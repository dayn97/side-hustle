import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/locale";
import { googleConfigured } from "@/lib/google";
import GoogleButton from "@/components/GoogleButton";
import ArticleDeleteButton from "@/components/ArticleDeleteButton";

export default async function Dashboard({ searchParams }: { searchParams: { google?: string } }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const locale = getLocale();
  const zh = locale === "zh";
  const articles = await db.article.findMany({ where: { authorId: user.id }, orderBy: { updatedAt: "desc" } });
  const posts = await db.waterfallPost.findMany({ where: { authorId: user.id }, orderBy: { updatedAt: "desc" } });
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 });
  return <section className="dashboard"><div className="dashgrid">
    <aside className="side"><div className="kicker">{zh ? "个人后台" : "Dashboard"}</div><h3>{user.name || user.email}</h3>
      <Link href="/dashboard/new">＋ {zh ? "新建内容" : "New content"}</Link>
      <Link href="/membership">{user.isMember ? (zh ? "✓ 已开通会员" : "✓ Member active") : (zh ? "开通会员" : "Become a member")}</Link>
      {user.role === "ADMIN" && <Link href="/admin">{zh ? "管理后台" : "Admin"}</Link>}
    </aside>
    <div>
      {searchParams.google === "connected" && user.googleSub && <div className="notice">{zh ? "Google 登录成功，账号已关联。" : "Signed in with Google. Your account is connected."}</div>}
      <div className="card" style={{ marginBottom: 32 }}><h3>{zh ? "登录方式" : "Sign-in methods"}</h3>
        {user.googleSub ? <p className="meta">{zh ? "✓ Google 已关联，下次可直接用 Google 登录。" : "✓ Google connected. You can sign in with Google next time."}</p> : <><p className="meta">{zh ? "关联与此账号邮箱相同的 Google 账号。" : "Connect the Google account with the same email as this account."}</p><GoogleButton enabled={googleConfigured()} locale={locale} link /></>}
      </div>
      <h2>{zh ? "我的文章" : "Your stories"}</h2>
      {articles.length === 0 ? <p className="meta">{zh ? "还没有文章，开始写第一篇吧。" : "Write your first story."}</p> : <div className="table-wrap"><table className="table"><thead><tr><th>{zh ? "标题" : "Title"}</th><th>{zh ? "状态" : "Status"}</th><th>{zh ? "更新日期" : "Updated"}</th><th>{zh?"操作":"Actions"}</th></tr></thead><tbody>{articles.map(a => <tr key={a.id}><td>{zh ? a.titleZh : a.titleEn}</td><td>{a.status}</td><td>{a.updatedAt.toLocaleDateString(zh ? "zh-CN" : "en-US")}</td><td className="row-actions"><Link href={`/dashboard/edit/${a.id}`}>{zh ? "编辑" : "Edit"}</Link><ArticleDeleteButton id={a.id} locale={locale}/></td></tr>)}</tbody></table></div>}
      <h2 style={{ marginTop: 52 }}>{zh ? "我的瀑布流动态" : "My Waterfall posts"}</h2>
      {posts.length === 0 ? <p className="meta">{zh ? "还没有瀑布流动态。点击「新建内容」，选择瀑布流即可发布。" : "No Waterfall posts yet. Choose Waterfall when creating content."}</p> : <table className="table"><thead><tr><th>{zh ? "内容" : "Content"}</th><th>{zh ? "状态" : "Status"}</th><th>{zh ? "更新日期" : "Updated"}</th><th></th></tr></thead><tbody>{posts.map(p=><tr key={p.id}><td>{(zh?p.titleZh:p.titleEn)||((zh?p.bodyZh:p.bodyEn).slice(0,60))}</td><td>{p.status}</td><td>{p.updatedAt.toLocaleDateString(zh?"zh-CN":"en-US")}</td><td><Link href={`/dashboard/waterfall/edit/${p.id}`}>{zh?"编辑":"Edit"}</Link></td></tr>)}</tbody></table>}
      <h2 style={{ marginTop: 52 }}>{zh ? "最近订单" : "Recent orders"}</h2><table className="table"><tbody>{orders.map(o => <tr key={o.id}><td>{o.type}</td><td>{o.provider}</td><td>{o.amount / 100} {o.currency}</td><td>{o.status}</td></tr>)}</tbody></table>
    </div>
  </div></section>;
}
