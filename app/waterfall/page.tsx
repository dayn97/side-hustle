import Image from "next/image";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/locale";
import type { Metadata } from "next";

export async function generateMetadata():Promise<Metadata>{const zh=getLocale()==="zh";return{title:zh?"瀑布流":"Waterfall",description:zh?"浏览独立创作者分享的动态、图片与灵感。":"Discover updates, images and ideas from independent creators.",alternates:{canonical:"/waterfall"}};}
export default async function WaterfallPage(){
  const zh=getLocale()==="zh";
  const posts=await db.waterfallPost.findMany({where:{status:"PUBLISHED"},orderBy:{createdAt:"desc"},include:{author:true}});
  return <section className="stories-page">
    <div className="kicker">{zh?"创作者动态":"Creator updates"}</div>
    <h1 className="stories-title">{zh?"瀑布流":"Waterfall"}</h1>
    {posts.length?<div className="waterfall-grid">{posts.map(post=>{
      const title=(zh?post.titleZh:post.titleEn)||(zh?post.titleEn:post.titleZh);
      const body=(zh?post.bodyZh:post.bodyEn)||(zh?post.bodyEn:post.bodyZh);
      const tags=(zh?post.tags:post.tagsEn).length?(zh?post.tags:post.tagsEn):(zh?post.tagsEn:post.tags);
      return <article className="waterfall-card" key={post.id}>
        {post.imageUrl&&<div className="waterfall-cover"><Image src={post.imageUrl} alt={title||""} width={900} height={900} sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw" unoptimized /></div>}
        <div className="waterfall-content">
          {title&&<h2 className="waterfall-heading">{title}</h2>}
          <p className="waterfall-excerpt waterfall-post-body">{body}</p>
          {tags.length>0&&<div className="tag-list">{tags.map((tag,index)=><span className="tag" key={`${tag}-${index}`}>#{tag}</span>)}</div>}
          <div className="waterfall-byline"><span>{post.author.name||post.author.email}</span><time dateTime={post.createdAt.toISOString()}>{post.createdAt.toLocaleDateString(zh?"zh-CN":"en-US")}</time></div>
        </div>
      </article>;
    })}</div>:<p className="empty-stories">{zh?"还没有瀑布流动态。登录后点击「新建内容」，选择「瀑布流动态」即可发布。":"No Waterfall posts yet. Sign in and choose “Waterfall post” when creating content."}</p>}
  </section>;
}
