"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function ArticleDeleteButton({id,locale}:{id:string;locale:"zh"|"en"}){
  const router=useRouter();const [busy,setBusy]=useState(false);const zh=locale==="zh";
  async function remove(){if(!window.confirm(zh?"确定删除这篇文章吗？文章的评论和点赞也会一并删除。":"Delete this article? Its comments and likes will also be removed."))return;setBusy(true);try{const r=await fetch(`/api/articles/${id}`,{method:"DELETE"});if(!r.ok)window.alert(zh?"删除失败，请重试。":"Could not delete. Please retry.");else router.refresh();}finally{setBusy(false);}}
  return <button type="button" className="text-action danger-action" disabled={busy} onClick={remove}>{busy?(zh?"删除中…":"Deleting…"):(zh?"删除":"Delete")}</button>;
}
