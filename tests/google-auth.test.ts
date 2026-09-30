import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { createGoogleFlow, decideGoogleAccount, readGoogleFlow, verifyGoogleIdentity } from "../lib/google";

const key = new TextEncoder().encode("test-only-auth-secret-32-bytes-long");
const clientId = "test-client.apps.googleusercontent.com";
const identity = { sub: "google-subject", email: "reader@example.com", name: "Reader" };
const fixture = generateKeyPair("RS256").then(async pair => ({
  ...pair, keys: createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), alg: "RS256", kid: "test-google" }] }),
}));

async function googleToken(changes: Record<string, unknown> = {}) {
  const { privateKey } = await fixture;
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ iss: "https://accounts.google.com", aud: clientId, sub: identity.sub, email: identity.email, name: identity.name, nonce: "test-nonce", email_verified: true, iat: now, exp: now + 3600, ...changes })
    .setProtectedHeader({ alg: "RS256", kid: "test-google" }).sign(privateKey);
}

test("OAuth flow preserves nonce and PKCE verifier, with a unique state each time", async () => {
  const flow = await createGoogleFlow("existing-user", key);
  const parsed = await readGoogleFlow(flow.cookie, flow.state, key);
  assert.equal(parsed.linkUserId, "existing-user");
  assert.equal(parsed.nonce, flow.nonce);
  assert.equal(createHash("sha256").update(parsed.verifier).digest("base64url"), flow.challenge);
  assert.notEqual((await createGoogleFlow(null, key)).state, flow.state);
});

test("OAuth flow rejects missing/mismatched state, a tampered signature, and a different key", async () => {
  const flow = await createGoogleFlow(null, key);
  await assert.rejects(readGoogleFlow(flow.cookie, "", key));
  await assert.rejects(readGoogleFlow(flow.cookie, "wrong-state", key));
  const parts = flow.cookie.split(".");
  parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
  await assert.rejects(readGoogleFlow(parts.join("."), flow.state, key));
  await assert.rejects(readGoogleFlow(flow.cookie, flow.state, new TextEncoder().encode("wrong-signing-key")));
});

test("OAuth flow rejects expired cookies and session tokens with a different audience", async () => {
  const claims = { state: "state", nonce: "nonce", verifier: "verifier", linkUserId: null };
  const expired = await new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setIssuer("inkwell").setAudience("google-oauth").setIssuedAt().setExpirationTime(Math.floor(Date.now() / 1000) - 60).sign(key);
  const wrongAudience = await new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setIssuer("inkwell").setAudience("session").setIssuedAt().setExpirationTime("10m").sign(key);
  await assert.rejects(readGoogleFlow(expired, "state", key));
  await assert.rejects(readGoogleFlow(wrongAudience, "state", key));
});

test("verified Google identity uses the stable subject and normalizes the email", async () => {
  const token = await googleToken({ email: "Reader@Example.com" });
  const result = await verifyGoogleIdentity(token, clientId, "test-nonce", (await fixture).keys);
  assert.deepEqual(result, identity);
});

for (const [reason, change] of Object.entries({
  "wrong audience": { aud: "attacker-client" }, "wrong issuer": { iss: "https://attacker.example" },
  "expired token": { exp: Math.floor(Date.now() / 1000) - 60 }, "wrong nonce": { nonce: "attacker-nonce" },
  "unverified email": { email_verified: false }, "missing email": { email: undefined },
  "wrong authorized presenter": { azp: "another-client" }, "invalid email": { email: "not-an-email" },
})) {
  test(`Google verification rejects ${reason}`, async () => {
    await assert.rejects(verifyGoogleIdentity(await googleToken(change), clientId, "test-nonce", (await fixture).keys));
  });
}

test("Google verification rejects a forged JWT signature", async () => {
  const token = await googleToken();
  const parts = token.split(".");
  parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
  await assert.rejects(verifyGoogleIdentity(parts.join("."), clientId, "test-nonce", (await fixture).keys));
});

test("new Google identity creates an account, but matching email alone never grants access", () => {
  assert.deepEqual(decideGoogleAccount(identity, null, null, null), { action: "create" });
  assert.throws(() => decideGoogleAccount(identity, null, { id: "existing-user", email: identity.email, googleSub: null }, null), /google_link_required/);
});

test("previously linked Google subject logs into the same account even if its email changes", () => {
  const user = { id: "original-user", email: "previous@example.com", googleSub: identity.sub };
  assert.deepEqual(decideGoogleAccount(identity, user, null, null), { action: "login", userId: user.id });
});

test("linking requires the authenticated original account and matching email", () => {
  const user = { id: "original-user", email: identity.email, googleSub: null };
  assert.deepEqual(decideGoogleAccount(identity, null, user, user), { action: "link", userId: user.id });
  assert.throws(() => decideGoogleAccount(identity, null, null, { ...user, email: "different@example.com" }), /google_account_mismatch/);
  assert.throws(() => decideGoogleAccount(identity, { ...user, id: "another-user", googleSub: identity.sub }, user, user), /google_account_mismatch/);
  assert.throws(() => decideGoogleAccount(identity, null, user, { ...user, googleSub: "another-subject" }), /google_account_mismatch/);
});
