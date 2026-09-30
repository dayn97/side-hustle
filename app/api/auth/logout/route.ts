import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const expected = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").origin;
  if (origin && origin !== expected) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  cookies().set("session", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
