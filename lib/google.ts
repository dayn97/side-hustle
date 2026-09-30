import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTVerifyGetKey } from "jose";

export const GOOGLE_FLOW_COOKIE = "google_oauth";
export const GOOGLE_FLOW_PATH = "/api/auth/google";
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"), { timeoutDuration: 10000 });

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function googleConfig() {
  if (!googleConfigured()) throw new Error("google_not_configured");
  const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  if (process.env.NODE_ENV === "production" && origin.protocol !== "https:") throw new Error("google_not_configured");
  return {
    clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
    origin: origin.origin,
    redirectUri: new URL("/api/auth/google/callback", origin.origin).href,
  };
}

function signingKey() {
  if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") throw new Error("google_not_configured");
  return new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only-secret-change-me");
}

export async function createGoogleFlow(linkUserId: string | null, key = signingKey()) {
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const cookie = await new SignJWT({ state, nonce, verifier, linkUserId })
    .setProtectedHeader({ alg: "HS256" }).setIssuer("inkwell").setAudience("google-oauth")
    .setIssuedAt().setExpirationTime("10m").sign(key);
  return { state, nonce, challenge, cookie };
}

export async function readGoogleFlow(cookie: string, state: string, key = signingKey()) {
  const { payload } = await jwtVerify(cookie, key, {
    algorithms: ["HS256"], issuer: "inkwell", audience: "google-oauth", requiredClaims: ["exp", "iat"], maxTokenAge: "10m",
  });
  if (typeof payload.state !== "string" || !state || state.length !== payload.state.length
    || !timingSafeEqual(Buffer.from(state), Buffer.from(payload.state))
    || typeof payload.nonce !== "string" || typeof payload.verifier !== "string"
    || !(payload.linkUserId === null || typeof payload.linkUserId === "string")) throw new Error("google_invalid_state");
  return { nonce: payload.nonce, verifier: payload.verifier, linkUserId: payload.linkUserId as string | null };
}

export type GoogleIdentity = { sub: string; email: string; name: string | null };

export async function verifyGoogleIdentity(idToken: string, clientId: string, nonce: string, keys: JWTVerifyGetKey = googleKeys): Promise<GoogleIdentity> {
  const { payload } = await jwtVerify(idToken, keys, {
    algorithms: ["RS256"], issuer: ["https://accounts.google.com", "accounts.google.com"], audience: clientId,
    requiredClaims: ["exp", "iat", "sub", "nonce", "email", "email_verified"], maxTokenAge: "1h", clockTolerance: 5,
  });
  if (payload.nonce !== nonce || payload.email_verified !== true
    || (payload.azp && payload.azp !== clientId)
    || typeof payload.sub !== "string" || !/^[\x21-\x7e]{1,255}$/.test(payload.sub)
    || typeof payload.email !== "string" || payload.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) throw new Error("google_invalid_identity");
  return { sub: payload.sub, email: payload.email.trim().toLowerCase(), name: typeof payload.name === "string" ? payload.name.slice(0, 200) : null };
}

type GoogleUser = { id: string; email: string; googleSub: string | null };
export function decideGoogleAccount(identity: GoogleIdentity, linked: GoogleUser | null, emailMatch: GoogleUser | null, linkingUser: GoogleUser | null) {
  if (linkingUser) {
    if ((linked && linked.id !== linkingUser.id) || identity.email !== linkingUser.email.toLowerCase()
      || (linkingUser.googleSub && linkingUser.googleSub !== identity.sub)) throw new Error("google_account_mismatch");
    return { action: linkingUser.googleSub ? "login" as const : "link" as const, userId: linkingUser.id };
  }
  if (linked) return { action: "login" as const, userId: linked.id };
  if (emailMatch) throw new Error("google_link_required");
  return { action: "create" as const };
}
