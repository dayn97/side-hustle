import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> { const locale = getLocale(); const article = await db.article.findUnique({ where: { slug: params.slug }, select: { titleZh: true, titleEn: true, excerptZh: true, excerptEn: true, coverUrl: true, slug: true } }); if (!article) return {}; const title = locale === "zh" ? article.titleZh : article.titleEn; const description = (locale === "zh" ? article.excerptZh : article.excerptEn) || title; return { title, description, alternates: { canonical: `/articles/${article.slug}` }, openGraph: { type: "article", title, description, url: `/articles/${article.slug}`, images: article.coverUrl ? [article.coverUrl] : undefined } }; }
export default async function Article({ params }: { params: { slug: string } }) {
  const a = await db.article.findUnique({ where: { slug: params.slug }, include: { author: true } });
  if (!a || a.status !== "PUBLISHED") return notFound();
  const user = await currentUser();
  const locale = getLocale();
  const memberActive = Boolean(user?.isMember && (!user.memberUntil || user.memberUntil > new Date()));
  const locked = a.isPremium && !memberActive;
  const tags = locale === "zh" ? a.tags : a.tagsEn;
  return <article className="article"><div className="kicker">{(locale === "zh" ? a.category : a.categoryEn) || (locale === "zh" ? "随笔" : "Essay")} {a.isPremium && ` · ${locale === "zh" ? "会员专属" : "Members"}`}</div><div className="tag-list">{tags.map((tag,index)=><span className="tag" key={`${tag}-${index}`}>#{tag}</span>)}</div><h1>{locale === "zh" ? a.titleZh : a.titleEn}</h1><p className="lead">{(locale === "zh" ? a.excerptZh : a.excerptEn) || ""}</p><div className="meta">{locale === "zh" ? "作者" : "By"} {a.author.name || a.author.email} · {a.createdAt.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}</div>{locked ? <div className="notice"><strong>{locale === "zh" ? "这是会员专属文章" : "This story is for members"}</strong><p>{locale === "zh" ? "开通会员即可阅读完整内容，同时支持独立写作者。" : "Become a member to read the full story and support independent writers."}</p><Link className="button" href="/membership">{locale === "zh" ? "开通会员" : "Become a member"}</Link></div> : <><div className="article-body">{locale === "zh" ? a.contentZh : a.contentEn}</div><div style={{ marginTop: 48 }}><Link className="button alt" href={`/support?article=${a.id}`}>☕ {locale === "zh" ? "打赏作者" : "Support the author"}</Link></div></>}</article>;
}
