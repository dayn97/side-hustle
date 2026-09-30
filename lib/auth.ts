import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only-secret-change-me");
export async function createSession(userId: string) { const token = await new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret); cookies().set("session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 604800 }); }
export async function currentUser() { const token = cookies().get("session")?.value; if (!token) return null; try { const { payload } = await jwtVerify(token, secret); return db.user.findUnique({ where: { id: String(payload.userId) } }); } catch { return null; } }
export async function requireUser() { const user = await currentUser(); if (!user) throw new Error("UNAUTHORIZED"); return user; }
