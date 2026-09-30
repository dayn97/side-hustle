import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createSession, currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { decideGoogleAccount, googleConfig, GOOGLE_FLOW_COOKIE, GOOGLE_FLOW_PATH, readGoogleFlow, verifyGoogleIdentity } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  function finish(path: string) {
    const response = NextResponse.redirect(new URL(path, origin));
    response.cookies.set(GOOGLE_FLOW_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: GOOGLE_FLOW_PATH, maxAge: 0 });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  try {
    const config = googleConfig();
    const cookie = cookies().get(GOOGLE_FLOW_COOKIE)?.value;
    const state = req.nextUrl.searchParams.get("state");
    if (!cookie || !state) throw new Error("google_invalid_state");
    const flow = await readGoogleFlow(cookie, state);
    if (req.nextUrl.searchParams.has("error")) return finish("/login?error=google_cancelled");
    const code = req.nextUrl.searchParams.get("code");
    if (!code || code.length > 4096) throw new Error("google_invalid_state");
    const linkingUser = await currentUser();
    if ((linkingUser?.id || null) !== flow.linkUserId) throw new Error("google_session_changed");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, cache: "no-store", signal: AbortSignal.timeout(10000),
      body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, grant_type: "authorization_code", code_verifier: flow.verifier }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || typeof tokens.id_token !== "string") throw new Error("google_failed");
    const identity = await verifyGoogleIdentity(tokens.id_token, config.clientId, flow.nonce);
    const [linked, emailMatch] = await Promise.all([
      db.user.findUnique({ where: { googleSub: identity.sub } }), db.user.findUnique({ where: { email: identity.email } }),
    ]);
    const decision = decideGoogleAccount(identity, linked, emailMatch, linkingUser);
    let userId: string;
    if (decision.action === "create") {
      try {
        const user = await db.user.create({ data: { email: identity.email, name: identity.name, googleSub: identity.sub, role: "AUTHOR" } });
        userId = user.id;
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
        const user = await db.user.findUnique({ where: { googleSub: identity.sub } });
        if (!user) throw new Error("google_link_required");
        userId = user.id;
      }
    } else {
      userId = decision.userId;
      if (decision.action === "link") {
        await db.user.updateMany({ where: { id: userId, googleSub: null }, data: { googleSub: identity.sub } });
        const user = await db.user.findUnique({ where: { id: userId } });
        if (user?.googleSub !== identity.sub) throw new Error("google_account_mismatch");
      }
    }
    await createSession(userId);
    return finish("/dashboard?google=connected");
  } catch (error) {
    const allowed = new Set(["google_not_configured", "google_invalid_state", "google_link_required", "google_account_mismatch", "google_session_changed"]);
    const message = error instanceof Error && allowed.has(error.message) ? error.message : "google_failed";
    return finish(`/login?error=${message}`);
  }
}
