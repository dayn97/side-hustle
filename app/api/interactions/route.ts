import { NextResponse } from "next/server";
import { ContentType } from "@prisma/client";
import { db } from "@/lib/db";
import { currentUser, requireUser } from "@/lib/auth";

function validType(value:string|null):value is ContentType{return value==="ARTICLE"||value==="WATERFALL";}
async function published(type:ContentType,id:string){return type==="ARTICLE"?Boolean(await db.article.findFirst({where:{id,status:"PUBLISHED"},select:{id:true}})):Boolean(await db.waterfallPost.findFirst({where:{id,status:"PUBLISHED"},select:{id:true}}));}

export async function GET(req:Request){
  const url=new URL(req.url);const type=url.searchParams.get("type");const id=url.searchParams.get("id");
  if(!validType(type)||!id)return NextResponse.json({error:"invalid content"},{status:400});
  if(!await published(type,id))return NextResponse.json({error:"not found"},{status:404});
  const user=await currentUser();
  const [likes,liked,comments]=await Promise.all([
    db.contentLike.count({where:{contentType:type,contentId:id}}),
    user?db.contentLike.findUnique({where:{contentType_contentId_userId:{contentType:type,contentId:id,userId:user.id}},select:{id:true}}):null,
    db.contentComment.findMany({where:{contentType:type,contentId:id,parentId:null},orderBy:{createdAt:"desc"},take:30,include:{user:{select:{id:true,name:true}},replies:{orderBy:{createdAt:"asc"},include:{user:{select:{id:true,name:true}}}}}})
  ]);
  return NextResponse.json({likes,liked:Boolean(liked),comments});
}

export async function POST(req:Request){
  try{
    const user=await requireUser();const body=await req.json();
    if(!validType(body.type)||typeof body.contentId!=="string"||!body.contentId)return NextResponse.json({error:"invalid content"},{status:400});
    const {type,contentId}=body;
    if(!await published(type,contentId))return NextResponse.json({error:"内容不存在或尚未发布"},{status:404});
    if(body.action==="like"){
      const key={contentType_contentId_userId:{contentType:type,contentId,userId:user.id}};
      const prior=await db.contentLike.findUnique({where:key,select:{id:true}});
      if(prior)await db.contentLike.delete({where:key});else await db.contentLike.create({data:{contentType:type,contentId,userId:user.id}});
      const [likes,liked]=await Promise.all([db.contentLike.count({where:{contentType:type,contentId}}),db.contentLike.findUnique({where:key,select:{id:true}})]);
      return NextResponse.json({likes,liked:Boolean(liked)});
    }
    if(body.action==="comment"||body.action==="reply"){
      const text=typeof body.body==="string"?body.body.trim():"";
      if(!text||text.length>1000)return NextResponse.json({error:"内容需为 1–1000 个字符"},{status:400});
      let parentId:string|null=null;
      if(body.action==="reply"){
        if(typeof body.parentId!=="string")return NextResponse.json({error:"请选择要回复的评论"},{status:400});
        const parent=await db.contentComment.findUnique({where:{id:body.parentId},select:{id:true,parentId:true,contentType:true,contentId:true}});
        if(!parent||parent.parentId||parent.contentType!==type||parent.contentId!==contentId)return NextResponse.json({error:"评论不存在"},{status:404});
        parentId=parent.id;
      }
      const comment=await db.contentComment.create({data:{contentType:type,contentId,body:text,userId:user.id,parentId},include:{user:{select:{id:true,name:true}}}});
      return NextResponse.json(comment,{status:201});
    }
    return NextResponse.json({error:"invalid action"},{status:400});
  }catch(e:any){return new NextResponse(e.message,{status:e.message==="UNAUTHORIZED"?401:400});}
}
