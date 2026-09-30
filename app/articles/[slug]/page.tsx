import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> { const article = await db.article.findUnique({ where: { slug: params.slug }, select: { titleZh: true, titleEn: true, excerptZh: true, coverUrl: true, slug: true } }); if (!article) return {}; return { title: article.titleZh, description: article.excerptZh || article.titleEn, alternates: { canonical: `/articles/${article.slug}` }, openGraph: { type: "article", title: article.titleZh, description: article.excerptZh || article.titleEn, url: `/articles/${article.slug}`, images: article.coverUrl ? [article.coverUrl] : undefined } }; }
export default async function Article({ params }: { params: { slug: string } }) {
  const a = await db.article.findUnique({ where: { slug: params.slug }, include: { author: true } });
  if (!a || a.status !== "PUBLISHED") return notFound();
  const user = await currentUser();
  const memberActive = Boolean(user?.isMember && (!user.memberUntil || user.memberUntil > new Date()));
  const locked = a.isPremium && !memberActive;
  return <article className="article"><div className="kicker">{a.category || "Essay"} {a.isPremium && " · Members"}</div><h1>{a.titleZh}</h1><p className="lead">{a.titleEn}</p><div className="meta">By {a.author.name || a.author.email} · {a.createdAt.toLocaleDateString("zh-CN")}</div>{locked ? <div className="notice"><strong>这是会员专属文章</strong><p>订阅会员即可阅读完整内容，同时支持独立写作者。</p><Link className="button" href="/membership">开通会员</Link></div> : <><div className="article-body">{a.contentZh}</div><hr style={{ border: 0, borderTop: "1px solid #e6e0d8", margin: "48px 0" }} /><div className="article-body">{a.contentEn}</div><div style={{ marginTop: 48 }}><Link className="button alt" href={`/support?article=${a.id}`}>☕ 打赏作者</Link></div></>}</article>;
}
