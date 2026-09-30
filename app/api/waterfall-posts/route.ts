import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req:Request){
  try{
    const user=await requireUser();
    const body=await req.json();
    if(!body.bodyZh?.trim()&&!body.bodyEn?.trim())return NextResponse.json({error:"至少填写一种语言的动态内容"},{status:400});
    const post=await db.waterfallPost.create({data:{titleZh:body.titleZh?.trim()||null,titleEn:body.titleEn?.trim()||null,bodyZh:body.bodyZh||"",bodyEn:body.bodyEn||"",imageUrl:body.imageUrl?.trim()||null,tags:Array.isArray(body.tags)?body.tags:[],tagsEn:Array.isArray(body.tagsEn)?body.tagsEn:[],status:body.status==="PUBLISHED"?"PUBLISHED":"DRAFT",authorId:user.id}});
    return NextResponse.json(post);
  }catch(e:any){return new NextResponse(e.message,{status:e.message==="UNAUTHORIZED"?401:400});}
}
