"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Post = {id:string;titleZh:string|null;titleEn:string|null;bodyZh:string;bodyEn:string;imageUrl:string|null;tags:string[];tagsEn:string[];status:string};
export default function WaterfallEditor({post}:{post?:Post}){
  const router=useRouter();
  const [f,setF]=useState({titleZh:post?.titleZh||"",titleEn:post?.titleEn||"",bodyZh:post?.bodyZh||"",bodyEn:post?.bodyEn||"",imageUrl:post?.imageUrl||"",tags:post?.tags.join(", ")||"",tagsEn:post?.tagsEn.join(", ")||""});
  const [msg,setMsg]=useState("");
  function update(key:string,value:string){setF(prev=>({...prev,[key]:value}));}
  async function save(status:string){const url=post?`/api/waterfall-posts/${post.id}`:"/api/waterfall-posts";const r=await fetch(url,{method:post?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...f,status,tags:f.tags.split(",").map(x=>x.trim()).filter(Boolean),tagsEn:f.tagsEn.split(",").map(x=>x.trim()).filter(Boolean)})});if(r.ok)router.push("/dashboard");else setMsg(await r.text());}
  return <section className="form" style={{maxWidth:800,marginTop:24}}><div className="kicker">Waterfall</div><h2>{post?"编辑瀑布流动态 / Edit post":"新建瀑布流动态 / New post"}</h2>{msg&&<div className="notice">{msg}</div>}
    <div className="field"><label>标题（中文，可选）</label><input value={f.titleZh} onChange={e=>update("titleZh",e.target.value)}/></div>
    <div className="field"><label>Title (English, optional)</label><input value={f.titleEn} onChange={e=>update("titleEn",e.target.value)}/></div>
    <div className="field"><label>动态内容（中文）</label><textarea value={f.bodyZh} onChange={e=>update("bodyZh",e.target.value)}/></div>
    <div className="field"><label>Post content (English)</label><textarea value={f.bodyEn} onChange={e=>update("bodyEn",e.target.value)}/></div>
    <div className="field"><label>图片 URL（可选，支持 R2 / S3 地址）</label><input type="url" value={f.imageUrl} onChange={e=>update("imageUrl",e.target.value)}/></div>
    <div className="field"><label>标签（中文，逗号分隔）</label><input value={f.tags} onChange={e=>update("tags",e.target.value)}/></div>
    <div className="field"><label>Tags (English, comma separated)</label><input value={f.tagsEn} onChange={e=>update("tagsEn",e.target.value)}/></div>
    <div style={{marginTop:24}}><button className="button alt" onClick={()=>save("DRAFT")}>保存草稿 / Save draft</button> <button className="button" onClick={()=>save("PUBLISHED")}>发布到瀑布流 / Publish to Waterfall</button></div>
  </section>;
}
