"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GoogleButton from "./GoogleButton";

const googleMessages: Record<string, [string, string]> = {
  google_not_configured: ["Google 登录暂未开放，请使用邮箱和密码。", "Google sign-in is not available yet. Use your email and password."],
  google_link_required: ["这个邮箱已有账号。请先用原密码登录，然后在个人后台关联 Google。", "This email already has an account. Sign in with your password, then connect Google from your dashboard."],
  google_invalid_state: ["登录已过期，请重新点击 Google 登录。", "Your sign-in request expired. Please try Google sign-in again."],
  google_session_changed: ["当前登录账号发生变化，请重新开始 Google 登录。", "Your signed-in account changed. Please start Google sign-in again."],
  google_account_mismatch: ["请选择与当前站点账号邮箱相同、且未关联其他站点账号的 Google 账号。", "Choose the Google account with the same email, which is not connected to another account here."],
  google_cancelled: ["已取消 Google 登录，你可以重试或使用邮箱登录。", "Google sign-in was cancelled. Try again or use your email."],
  google_failed: ["Google 登录未完成，请重试。", "Google sign-in could not be completed. Please try again."],
};

export default function AuthForm({ register = false, locale, googleEnabled, oauthError }: { register?: boolean; locale: "zh" | "en"; googleEnabled: boolean; oauthError?: string }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const zh = locale === "zh";
  const message = error || googleMessages[oauthError || ""]?.[zh ? 0 : 1];
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch(register ? "/api/auth/register" : "/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!response.ok) {
        setError(register ? (zh ? "注册失败，请检查输入或使用已有账号登录。" : "Could not create your account. Check your details or sign in to your existing account.") : (zh ? "邮箱或密码不正确" : "Incorrect email or password."));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(zh ? "连接失败，请稍后重试。" : "Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return <form className="form" onSubmit={submit}>
    <div className="kicker">{register ? (zh ? "加入 Inkwell" : "Join Inkwell") : (zh ? "欢迎回来" : "Welcome back")}</div>
    <h2>{register ? (zh ? "创建账号" : "Create your account") : (zh ? "登录" : "Sign in")}</h2>
    {message && <div className="notice" role="alert">{message}</div>}
    <GoogleButton enabled={googleEnabled} locale={locale} />
    {!googleEnabled && <p className="meta">{zh ? "Google 登录暂未开放" : "Google sign-in is not available yet"}</p>}
    <div className="auth-divider">{zh ? "或使用邮箱" : "or use email"}</div>
    {register && <div className="field"><label htmlFor="name">{zh ? "姓名" : "Name"}</label><input id="name" required autoComplete="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>}
    <div className="field"><label htmlFor="email">{zh ? "邮箱" : "Email"}</label><input id="email" required type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
    <div className="field"><label htmlFor="password">{zh ? (register ? "密码（至少 8 位）" : "密码") : (register ? "Password (at least 8 characters)" : "Password")}</label><input id="password" required minLength={register ? 8 : undefined} type="password" autoComplete={register ? "new-password" : "current-password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
    <button className="button" disabled={busy}>{busy ? (zh ? "请稍候…" : "Please wait…") : register ? (zh ? "创建账号" : "Create account") : (zh ? "登录" : "Sign in")}</button>
    <p className="meta">{register ? (zh ? "已有账号？" : "Already have an account? ") : (zh ? "还没有账号？" : "New here? ")}<Link href={register ? "/login" : "/register"}>{register ? (zh ? "登录" : "Sign in") : (zh ? "创建账号" : "Create account")}</Link></p>
  </form>;
}
