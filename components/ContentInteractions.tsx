"use client";
import Link from "next/link";
import { useCallback,useEffect,useState,type FormEvent } from "react";

type Person={id:string;name:string|null};
type Comment={id:string;body:string;createdAt:string;user:Person;replies?:Comment[];parentId?:string|null};
type Summary={likes:number;liked:boolean;comments:Comment[]};
export default function ContentInteractions({type,contentId,shareUrl,locale,authenticated}:{type:"ARTICLE"|"WATERFALL";contentId:string;shareUrl:string;locale:"zh"|"en";authenticated:boolean}){
  const zh=locale==="zh";
  const [summary,setSummary]=useState<Summary>({likes:0,liked:false,comments:[]});
  const [body,setBody]=useState("");
  const [replyTo,setReplyTo]=useState<string|null>(null);
  const [replyBody,setReplyBody]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const load=useCallback(async()=>{const r=await fetch(`/api/interactions?type=${type}&id=${encodeURIComponent(contentId)}`);if(r.ok)setSummary(await r.json());},[type,contentId]);
  useEffect(()=>{void load();},[load]);
  async function send(action:"like"|"comment"|"reply",text?:string,parentId?:string){
    if(!authenticated){setMessage(zh?"请先登录后再点赞或回复。":"Sign in to like or reply.");return null;}
    setBusy(true);setMessage("");
    try{const r=await fetch("/api/interactions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,contentId,action,body:text,parentId})});const data=await r.json();if(!r.ok){setMessage(data.error|| (zh?"操作失败":"Action failed"));return null;}return data;}catch{setMessage(zh?"网络异常，请重试。":"Network error. Please retry.");return null;}finally{setBusy(false);}
  }
  async function toggleLike(){const data=await send("like");if(data)setSummary(current=>({...current,likes:data.likes,liked:data.liked}));}
  async function submitComment(event:FormEvent){event.preventDefault();const text=body.trim();if(!text)return;const created=await send("comment",text);if(created){setBody("");await load();}}
  async function submitReply(event:FormEvent,parentId:string){event.preventDefault();const text=replyBody.trim();if(!text)return;const created=await send("reply",text,parentId);if(created){setReplyBody("");setReplyTo(null);await load();}}
  async function share(){const url=new URL(shareUrl,window.location.origin).toString();try{if(navigator.share)await navigator.share({url});else{await navigator.clipboard.writeText(url);setMessage(zh?"链接已复制，可以分享给朋友。":"Link copied. Share it with a friend.");}}catch(e){if(e instanceof Error&&e.name!=="AbortError")setMessage(zh?"分享失败，请复制地址栏链接。":"Could not share. Copy the address-bar link instead.");}}
  const date=(value:string)=>new Date(value).toLocaleDateString(zh?"zh-CN":"en-US");
  return <section className="content-interactions" aria-label={zh?"互动":"Engagement"}>
    <div className="interaction-actions">
      <button type="button" className={`interaction-button${summary.liked?" is-liked":""}`} onClick={toggleLike} disabled={busy} aria-pressed={summary.liked}>♡ {zh?"点赞":"Like"} <span>{summary.likes}</span></button>
      <a className="interaction-button" href={`#comments-${contentId}`}>◯ {zh?"回复":"Reply"} <span>{summary.comments.length}</span></a>
      <button type="button" className="interaction-button" onClick={share}>↗ {zh?"分享":"Share"}</button>
    </div>
    {message&&<p className="interaction-message" role="status">{message}{!authenticated&&< > <Link href="/login">{zh?"登录":"Sign in"}</Link></>}</p>}
    <div id={`comments-${contentId}`} className="comments-panel">
      <h3>{zh?"评论与回复":"Comments & replies"}</h3>
      {authenticated?<form className="comment-form" onSubmit={submitComment}><textarea aria-label={zh?"写评论":"Write a comment"} maxLength={1000} value={body} onChange={e=>setBody(e.target.value)} placeholder={zh?"写下你的想法…":"Add to the conversation…"}/><button className="button" disabled={busy||!body.trim()}>{zh?"发表评论":"Comment"}</button></form>:<p className="meta">{zh?"登录后即可参与评论和回复。":"Sign in to comment and reply."} <Link href="/login">{zh?"登录":"Sign in"}</Link></p>}
      {summary.comments.length===0?<p className="meta">{zh?"还没有评论，来聊聊吧。":"No comments yet. Start the conversation."}</p>:<div className="comment-list">{summary.comments.map(comment=><div className="comment" key={comment.id}><div className="comment-meta"><strong>{comment.user.name|| (zh?"读者":"Reader")}</strong><time>{date(comment.createdAt)}</time></div><p>{comment.body}</p>
        {authenticated&&<button type="button" className="reply-link" onClick={()=>{setReplyTo(replyTo===comment.id?null:comment.id);setReplyBody("");}}>{zh?"回复":"Reply"}</button>}
        {replyTo===comment.id&&<form className="reply-form" onSubmit={event=>submitReply(event,comment.id)}><textarea autoFocus maxLength={1000} aria-label={zh?"写回复":"Write a reply"} value={replyBody} onChange={e=>setReplyBody(e.target.value)} placeholder={zh?"回复这条评论…":"Reply to this comment…"}/><button className="button" disabled={busy||!replyBody.trim()}>{zh?"发送":"Send"}</button></form>}
        {comment.replies?.map(reply=><div className="comment comment-reply" key={reply.id}><div className="comment-meta"><strong>{reply.user.name||(zh?"读者":"Reader")}</strong><time>{date(reply.createdAt)}</time></div><p>{reply.body}</p></div>)}
      </div>)}</div>}
    </div>
  </section>;
}
