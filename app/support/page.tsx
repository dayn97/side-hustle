"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Support() {
  const params = useSearchParams();
  const id = params.get("article");
  const [amount, setAmount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/payments/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DONATION", provider: "STRIPE", amount, articleId: id })
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "暂时无法创建订单，请稍后重试。");
      } else if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else {
        setMessage("演示订单已创建，尚未扣款。当前支付尚未开通。");
      }
    } catch {
      setMessage("网络连接失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  return <section className="form">
    <div className="kicker">A small thank you</div>
    <h2>Support the author</h2>
    <p className="lead">如果这篇文章对你有帮助，可以请作者喝杯咖啡。</p>
    <p className="meta">无需注册或登录 · No account required</p>
    {params.get("payment") === "returned" && <div className="notice">已从付款页面返回，最终付款状态以支付确认结果为准。</div>}
    {params.get("payment") === "cancelled" && <div className="notice">付款已取消，你可以重新选择金额。</div>}
    {!id ? <div className="notice">请先打开文章，再点击“打赏作者”。</div> : <>
      <div className="field">
        <label htmlFor="donation-amount">Amount (USD)</label>
        <select id="donation-amount" value={amount} disabled={busy} onChange={event => setAmount(Number(event.target.value))}>
          <option value="3">$3</option><option value="5">$5</option>
          <option value="10">$10</option><option value="20">$20</option>
        </select>
      </div>
      <button className="button" disabled={busy} onClick={submit}>{busy ? "正在处理…" : "继续打赏 · Continue to payment"}</button>
    </>}
    {message && <div className="notice" role="status">{message}</div>}
  </section>;
}
