import { db } from "./db";
export async function markOrderPaid(provider: string, eventId: string, orderId: string, payload: unknown) {
  return db.$transaction(async tx => {
    const existing = await tx.webhookEvent.findUnique({ where: { provider_eventId: { provider, eventId } } });
    if (existing) return { duplicate: true };
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.type === "MEMBERSHIP" && !order.userId) throw new Error("MEMBERSHIP_USER_REQUIRED");
    await tx.webhookEvent.create({ data: { provider, eventId, payload: payload as object } });
    if (order.status === "PAID") return { duplicate: true };
    await tx.order.update({ where: { id: orderId }, data: { status: "PAID", paidAt: new Date() } });
    if (order.type === "MEMBERSHIP" && order.userId) await tx.user.update({ where: { id: order.userId }, data: { isMember: true, memberUntil: new Date(Date.now() + 30 * 86400000) } });
    return { duplicate: false };
  });
}
