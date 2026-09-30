import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return new NextResponse("forbidden", { status: 403 });
  const { name } = await req.json();
  const cleanName = String(name || "").trim();
  if (!cleanName) return new NextResponse("分类名称不能为空", { status: 400 });
  try {
    const category = await db.category.create({ data: { name: cleanName } });
    return NextResponse.json(category);
  } catch {
    return new NextResponse("分类已存在", { status: 409 });
  }
}
