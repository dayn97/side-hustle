import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/locale";
import CategoryForm from "@/components/CategoryForm";
import MemberManager from "@/components/MemberManager";
import ArticleDeleteButton from "@/components/ArticleDeleteButton";

export default async function Admin(){
  const user=await currentUser();if(!user||user.role!=="ADMIN")redirect("/dashboard");
  const locale=getLocale();const zh=locale==="zh";
  const [users,articleCount,articles,members,orders,categories]=await Promise.all([
    db.user.count(),db.article.count(),
    db.article.findMany({orderBy:{updatedAt:"desc"},take:100,include:{author:{select:{name:true,email:true}}}}),
    db.user.findMany({where:{isMember:true},orderBy:{memberUntil:"asc"},select:{id:true,email:true,name:true,memberUntil:true}}),
    db.order.findMany({orderBy:{createdAt:"desc"},take:20,include:{user:true}}),
    db.category.findMany({orderBy:{name:"asc"}})
  ]);
  return <section className="dashboard"><div className="kicker">Admin</div><h1 style={{fontSize:52}}>{zh?"管理后台":"Admin"}</h1>
    <div className="grid"><div className="card"><h2>{users}</h2><p>{zh?"用户":"Users"}</p></div><div className="card"><h2>{articleCount}</h2><p>{zh?"文章":"Articles"}</p></div><div className="card"><h2>{members.length}</h2><p>{zh?"会员":"Members"}</p></div><div className="card"><h2>{orders.length}</h2><p>{zh?"近期订单":"Recent orders"}</p></div></div>
    <CategoryForm initial={categories}/>
    <MemberManager initial={members.map(m=>({...m,memberUntil:m.memberUntil?.toISOString()||null}))} locale={locale}/>
    <h2 style={{marginTop:48}}>{zh?"文章管理":"Article management"}</h2>
    <div className="table-wrap"><table className="table"><thead><tr><th>{zh?"标题":"Title"}</th><th>{zh?"作者":"Author"}</th><th>{zh?"状态":"Status"}</th><th>{zh?"更新日期":"Updated"}</th><th>{zh?"操作":"Actions"}</th></tr></thead><tbody>{articles.map(article=><tr key={article.id}><td>{zh?article.titleZh:article.titleEn}</td><td>{article.author.name||article.author.email}</td><td>{article.status}</td><td>{article.updatedAt.toLocaleDateString(zh?"zh-CN":"en-US")}</td><td className="row-actions"><Link href={`/dashboard/edit/${article.id}`}>{zh?"编辑":"Edit"}</Link><ArticleDeleteButton id={article.id} locale={locale}/></td></tr>)}</tbody></table></div>
    <h2 style={{marginTop:48}}>{zh?"订单":"Orders"}</h2>
    <div className="table-wrap"><table className="table"><thead><tr><th>User</th><th>Type</th><th>Provider</th><th>Amount</th><th>Status</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>{o.user?.email||"Guest"}</td><td>{o.type}</td><td>{o.provider}</td><td>${o.amount/100}</td><td>{o.status}</td></tr>)}</tbody></table></div>
  </section>;
}
