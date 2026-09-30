export default function GoogleButton({ enabled, locale, link = false }: { enabled: boolean; locale: "zh" | "en"; link?: boolean }) {
  const label = locale === "zh" ? (link ? "关联 Google 账号" : "使用 Google 登录") : (link ? "Connect Google account" : "Continue with Google");
  return enabled ? <a className="google-button" href="/api/auth/google">{label}</a> : <button className="google-button" type="button" disabled title={locale === "zh" ? "Google 登录暂未开放" : "Google sign-in is not available yet"}>{label}</button>;
}
