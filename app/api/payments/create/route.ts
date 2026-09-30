import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(req: Request) {
  let input;
  try { input = await req.json(); }
  catch { return NextResponse.json({ error: "请求格式错误" }, { status: 400 }); }
  if (!input || !["DONATION", "MEMBERSHIP"].includes(input.type)) {
    return NextResponse.json({ error: "订单类型无效" }, { status: 400 });
  }
  const provider = input.provider || "DEMO";
  if (!["STRIPE", "PAYPAL", "DEMO"].includes(provider)) {
    return NextResponse.json({ error: "暂不支持该支付方式" }, { status: 400 });
  }
  const user = await currentUser();
  if (input.type === "MEMBERSHIP" && !user) {
    return NextResponse.json({ error: "会员购买需要登录" }, { status: 401 });
  }
  const amount = input.type === "MEMBERSHIP" ? 900 : Math.round(Number(input.amount) * 100);
  if (!Number.isSafeInteger(amount) || amount < 100 || amount > 100000) {
    return NextResponse.json({ error: "打赏金额须为 1–1000 美元" }, { status: 400 });
  }
  let articleId: string | null = null;
  if (input.type === "DONATION") {
    if (typeof input.articleId !== "string" || !input.articleId) {
      return NextResponse.json({ error: "请选择要打赏的文章" }, { status: 400 });
    }
    const article = await db.article.findFirst({
      where: { id: input.articleId, status: "PUBLISHED" }, select: { id: true }
    });
    if (!article) return NextResponse.json({ error: "文章不存在或尚未发布" }, { status: 404 });
    articleId = article.id;
  }
  const stripeReady = provider === "STRIPE" && !!process.env.STRIPE_SECRET_KEY;
  if (stripeReady && !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "支付配置尚未完成，请稍后再试" }, { status: 503 });
  }
  if (provider === "PAYPAL" && process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    return NextResponse.json({ error: "PayPal 结账暂未开通" }, { status: 503 });
  }
  const order = await db.order.create({
    data: {
      userId: user?.id ?? null, type: input.type, provider: stripeReady ? "STRIPE" : "DEMO",
      amount, currency: "USD", idempotencyKey: randomUUID(), metadata: { articleId }
    }
  });
  if (!stripeReady) {
    return NextResponse.json({ orderId: order.id, checkoutUrl: null, mode: "demo" });
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const returnPath = input.type === "DONATION"
      ? "/support?article=" + encodeURIComponent(articleId!)
      : "/membership";
    const session = await stripe.checkout.sessions.create({
      mode: "payment", client_reference_id: order.id, metadata: { orderId: order.id },
      ...(user ? { customer_email: user.email } : {}),
      line_items: [{
        price_data: {
          currency: "usd", unit_amount: amount,
          product_data: { name: input.type === "DONATION" ? "Article donation" : "30-day membership" }
        }, quantity: 1
      }],
      success_url: base + returnPath + (returnPath.includes("?") ? "&" : "?") + "payment=returned",
      cancel_url: base + returnPath + (returnPath.includes("?") ? "&" : "?") + "payment=cancelled"
    }, { idempotencyKey: order.idempotencyKey });
    await db.order.update({ where: { id: order.id }, data: { providerOrderId: session.id } });
    return NextResponse.json({ orderId: order.id, checkoutUrl: session.url, mode: "stripe" });
  } catch {
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "无法打开付款页面，请稍后重试" }, { status: 502 });
  }
}
