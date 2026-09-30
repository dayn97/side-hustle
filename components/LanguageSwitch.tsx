"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LanguageSwitch({ locale }: { locale: "zh" | "en" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function switchLocale() {
    if (busy) return;
    setBusy(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: locale === "zh" ? "en" : "zh" }),
    });
    router.refresh();
    setBusy(false);
  }
  return <button type="button" className="language-switch" onClick={switchLocale} disabled={busy} aria-label={locale === "zh" ? "Switch language to English" : "切换为中文"}>{locale === "zh" ? "EN" : "中文"}</button>;
}
