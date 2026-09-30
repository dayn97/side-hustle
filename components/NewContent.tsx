"use client";
import { useState } from "react";
import Editor from "@/components/Editor";
import WaterfallEditor from "@/components/WaterfallEditor";
export default function NewContent({locale}:{locale:"zh"|"en"}){
  const zh=locale==="zh";
  const [type,setType]=useState<"ARTICLE"|"WATERFALL">("ARTICLE");
  return <>
    <section className="form" style={{maxWidth:800,marginBottom:0}}>
      <div className="field"><label htmlFor="publish-type">{zh?"发布内容类型":"Publish as"}</label><select id="publish-type" value={type} onChange={e=>setType(e.target.value as "ARTICLE"|"WATERFALL")}><option value="ARTICLE">{zh?"文章":"Article"}</option><option value="WATERFALL">{zh?"瀑布流动态":"Waterfall post"}</option></select></div>
      <p className="meta">{type==="ARTICLE"?(zh?"文章会显示在文章列表。":"Articles appear in the Stories section."):(zh?"动态只显示在瀑布流，不会出现在文章列表。":"Posts appear only in the Waterfall feed.")}</p>
    </section>
    {type==="ARTICLE"?<Editor/>:<WaterfallEditor/>}
  </>;
}
