import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createGoogleFlow, googleConfig, GOOGLE_FLOW_COOKIE, GOOGLE_FLOW_PATH } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const config = googleConfig();
    const user = await currentUser();
    const flow = await createGoogleFlow(user?.id || null);
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id: config.clientId, redirect_uri: config.redirectUri, response_type: "code", scope: "openid email profile",
      state: flow.state, nonce: flow.nonce, code_challenge: flow.challenge, code_challenge_method: "S256", prompt: "select_account",
    }).toString();
    cookies().set(GOOGLE_FLOW_COOKIE, flow.cookie, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: GOOGLE_FLOW_PATH, maxAge: 600,
    });
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", origin));
  }
}
