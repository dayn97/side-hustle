import "./globals.css";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
export default async function Layout({ children }: { children: React.ReactNode }) { const user = await currentUser(); return <><header className="shell nav"><Link className="brand" href="/">inkwell.</Link><nav className="navlinks"><Link href="/articles">Explore</Link><Link href="/dashboard">Write</Link>{user ? <Link href="/dashboard">{user.name || user.email}</Link> : <Link href="/login">Sign in</Link>}</nav></header><main className="shell">{children}</main><footer><div className="shell">Thoughtful writing, in two languages. © {new Date().getFullYear()} Inkwell.</div></footer></> }
