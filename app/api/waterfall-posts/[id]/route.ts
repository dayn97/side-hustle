import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function PUT(req:Request,{params}:{params:{id:string}}){
  try{
    const user=await requireUser();
    const old=await db.waterfallPost.findUnique({where:{id:params.id}});
    if(!old||old.authorId!==user.id)return new NextResponse("forbidden",{status:403});
    const body=await req.json();
    if(!body.bodyZh?.trim()&&!body.bodyEn?.trim())return NextResponse.json({error:"至少填写一种语言的动态内容"},{status:400});
    const post=await db.waterfallPost.update({where:{id:params.id},data:{titleZh:body.titleZh?.trim()||null,titleEn:body.titleEn?.trim()||null,bodyZh:body.bodyZh||"",bodyEn:body.bodyEn||"",imageUrl:body.imageUrl?.trim()||null,tags:Array.isArray(body.tags)?body.tags:[],tagsEn:Array.isArray(body.tagsEn)?body.tagsEn:[],status:body.status==="PUBLISHED"?"PUBLISHED":"DRAFT"}});
    return NextResponse.json(post);
  }catch(e:any){return new NextResponse(e.message,{status:e.message==="UNAUTHORIZED"?401:400});}
}
