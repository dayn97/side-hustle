"use client";
import { useRouter } from "next/navigation";
import { useState,type FormEvent } from "react";
type Member={id:string;email:string;name:string|null;memberUntil:string|null};
export default function MemberManager({initial,locale}:{initial:Member[];locale:"zh"|"en"}){
  const router=useRouter();const zh=locale==="zh";const [email,setEmail]=useState("");const [until,setUntil]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
  async function add(event:FormEvent){event.preventDefault();setBusy(true);setMessage("");try{const r=await fetch("/api/admin/members",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,memberUntil:until||null})});const data=await r.json();if(!r.ok){setMessage(data.error||"操作失败");return;}setEmail("");setUntil("");setMessage(zh?"会员已开通。":"Membership activated.");router.refresh();}finally{setBusy(false);}}
  return <section className="card member-manager"><h2>{zh?"会员管理":"Membership management"}</h2><p className="meta">{zh?"对已注册用户开通会员、调整到期日或撤销资格；撤销不会删除用户账号。留空到期日代表永久会员。":"Grant membership to registered users, change expiry, or revoke it. Revoking never deletes the user account. Leave expiry empty for lifetime membership."}</p>
    <form className="member-add-form" onSubmit={add}><label>{zh?"已注册用户邮箱":"Registered user email"}<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={zh?"输入账号邮箱":"Account email"}/></label><label>{zh?"到期日（可选）":"Expiry (optional)"}<input type="date" value={until} onChange={e=>setUntil(e.target.value)}/></label><button className="button" disabled={busy}>{zh?"开通会员":"Grant membership"}</button></form>
    {message&&<p className="meta" role="status">{message}</p>}
    <div className="table-wrap"><table className="table"><thead><tr><th>{zh?"用户":"Member"}</th><th>{zh?"到期日":"Expires"}</th><th>{zh?"操作":"Actions"}</th></tr></thead><tbody>{initial.map(member=><MemberRow key={member.id} member={member} locale={locale}/>)}</tbody></table></div>
    {initial.length===0&&<p className="meta">{zh?"目前没有会员。":"No members yet."}</p>}
  </section>;
}
function MemberRow({member,locale}:{member:Member;locale:"zh"|"en"}){
  const router=useRouter();const zh=locale==="zh";const [until,setUntil]=useState(member.memberUntil?.slice(0,10)||"");const [busy,setBusy]=useState(false);
  async function update(){setBusy(true);try{const r=await fetch(`/api/admin/members/${member.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({memberUntil:until||null})});if(!r.ok)window.alert(zh?"保存失败，请重试。":"Could not save. Please retry.");else router.refresh();}finally{setBusy(false);}}
  async function revoke(){if(!window.confirm(zh?`确定撤销 ${member.email} 的会员资格吗？用户账号不会被删除。`:`Revoke membership for ${member.email}? The user account will remain.`))return;setBusy(true);try{const r=await fetch(`/api/admin/members/${member.id}`,{method:"DELETE"});if(r.ok)router.refresh();else window.alert(zh?"撤销失败，请重试。":"Could not revoke. Please retry.");}finally{setBusy(false);}}
  return <tr><td>{member.name||member.email}{member.name&&<span className="member-email">{member.email}</span>}</td><td><input aria-label={zh?`${member.email}到期日`:`${member.email} expiry`} type="date" value={until} onChange={e=>setUntil(e.target.value)}/></td><td className="row-actions"><button className="text-action" disabled={busy} onClick={update}>{zh?"保存":"Save"}</button><button className="text-action danger-action" disabled={busy} onClick={revoke}>{zh?"撤销":"Revoke"}</button></td></tr>;
}
