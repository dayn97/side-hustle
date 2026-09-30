import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import WaterfallEditor from "@/components/WaterfallEditor";
import { getLocale } from "@/lib/locale";
export default async function EditWaterfallPost({params}:{params:{id:string}}){const user=await currentUser();if(!user)redirect("/login");const post=await db.waterfallPost.findUnique({where:{id:params.id}});if(!post||post.authorId!==user.id)redirect("/dashboard");return <WaterfallEditor post={post} locale={getLocale()}/>;}
