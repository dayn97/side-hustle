import "./globals.css";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import type { Metadata } from "next";
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), title: { default: "Inkwell · 独立写作与真实经验", template: "%s · Inkwell" }, description: "一个简洁的中英文文章发布空间，阅读真实经验，分享可执行的方法。", alternates: { canonical: "/" }, openGraph: { type: "website", siteName: "Inkwell", title: "Inkwell · 独立写作与真实经验", description: "一个简洁的中英文文章发布空间。" }, robots: { index: true, follow: true } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  return (
    <html lang="zh-CN">
      <body>
        <header className="shell nav">
          <Link className="brand" href="/">inkwell.</Link>
          <nav className="navlinks">
            <Link href="/articles">Explore</Link>
            <Link href="/dashboard">Write</Link>
            {user ? (
              <Link href="/dashboard">{user.name || user.email}</Link>
            ) : (
              <Link href="/login">Sign in</Link>
            )}
          </nav>
        </header>
        <main className="shell">{children}</main>
        <footer>
          <div className="shell">
            Thoughtful writing, in two languages. © {new Date().getFullYear()} Inkwell.
          </div>
        </footer>
      </body>
    </html>
  );
}
