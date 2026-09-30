import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/locale";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const zh = getLocale() === "zh";
  return { title: zh ? "瀑布流" : "Waterfall", description: zh ? "以瀑布流浏览 Inkwell 文章。" : "Browse Inkwell stories in a waterfall layout.", alternates: { canonical: "/waterfall" } };
}

export default async function WaterfallPage() {
  const zh = getLocale() === "zh";
  const articles = await db.article.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, include: { author: true } });

  return <section className="stories-page">
    <div className="kicker">{zh ? "自由探索" : "Discover"}</div>
    <h1 className="stories-title">{zh ? "瀑布流" : "Waterfall"}</h1>
    {articles.length ? <div className="waterfall-grid">
      {articles.map(article => {
        const title = zh ? article.titleZh : article.titleEn;
        const excerpt = (zh ? article.excerptZh : article.excerptEn) || "";
        const category = (zh ? article.category : article.categoryEn) || (zh ? "随笔" : "Essay");
        const tags = zh ? article.tags : article.tagsEn;
        return <article className="waterfall-card" key={article.id}>
          {article.coverUrl && <Link className="waterfall-cover" href={`/articles/${article.slug}`} aria-label={title}>
            <Image src={article.coverUrl} alt={title} width={900} height={560} sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw" unoptimized />
          </Link>}
          <div className="waterfall-content">
            <div className="waterfall-labels"><span className="tag">{category}</span>{article.isPremium && <span className="tag">{zh ? "会员专属" : "Members"}</span>}</div>
            <h2 className="waterfall-heading"><Link href={`/articles/${article.slug}`}>{title}</Link></h2>
            {excerpt && <p className="waterfall-excerpt">{excerpt}</p>}
            {tags.length > 0 && <div className="tag-list">{tags.map((tag, index) => <span className="tag" key={`${tag}-${index}`}>#{tag}</span>)}</div>}
            <div className="waterfall-byline"><span>{article.author.name || article.author.email}</span><time dateTime={article.createdAt.toISOString()}>{article.createdAt.toLocaleDateString(zh ? "zh-CN" : "en-US")}</time></div>
            <Link className="waterfall-read" href={`/articles/${article.slug}`}>{zh ? "继续阅读 →" : "Read story →"}</Link>
          </div>
        </article>;
      })}
    </div> : <p className="empty-stories">{zh ? "还没有发布的文章。" : "No stories published yet."}</p>}
  </section>;
}
