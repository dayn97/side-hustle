"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton({ locale }: { locale: "zh" | "en" }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function signOut() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) { router.push("/login"); router.refresh(); }
    } finally { setBusy(false); }
  }
  return <button type="button" className="language-switch" disabled={busy} onClick={signOut}>{locale === "zh" ? "退出" : "Sign out"}</button>;
}
