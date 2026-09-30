import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (body?.locale !== "zh" && body?.locale !== "en") {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  const response = NextResponse.json({ locale: body.locale });
  response.cookies.set("inkwell_locale", body.locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
