import "./globals.css";
import "./auth.css";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import LanguageSwitch from "@/components/LanguageSwitch";
import SignOutButton from "@/components/SignOutButton";
import type { Metadata } from "next";
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), title: { default: "Inkwell · 独立写作与真实经验", template: "%s · Inkwell" }, description: "一个简洁的中英文文章发布空间，阅读真实经验，分享可执行的方法。", alternates: { canonical: "/" }, openGraph: { type: "website", siteName: "Inkwell", title: "Inkwell · 独立写作与真实经验", description: "一个简洁的中英文文章发布空间。" }, robots: { index: true, follow: true } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const locale = getLocale();

  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"}>
      <body>
        <header className="shell nav">
          <Link className="brand" href="/">inkwell.</Link>
          <nav className="navlinks">
            <Link href="/articles">{locale === "zh" ? "文章" : "Explore"}</Link>
            <Link href="/dashboard">{locale === "zh" ? "写作" : "Write"}</Link>
            {user ? (
              <Link href="/dashboard">{user.name || user.email}</Link>
            ) : (
              <Link href="/login">{locale === "zh" ? "登录" : "Sign in"}</Link>
            )}
            <LanguageSwitch locale={locale} />
            {user && <SignOutButton locale={locale} />}
          </nav>
        </header>
        <main className="shell">{children}</main>
        <footer>
          <div className="shell">
            {locale === "zh" ? "用心写作，分享真实经验。" : "Thoughtful writing and real experiences."} © {new Date().getFullYear()} Inkwell.
          </div>
        </footer>
      </body>
    </html>
  );
}
