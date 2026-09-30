import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
function expiry(value:unknown){if(value===null||value==="")return null;if(typeof value!=="string")return undefined;const date=new Date(`${value}T23:59:59.999Z`);return Number.isNaN(date.getTime())?undefined:date;}
async function authorized(){const user=await currentUser();return Boolean(user&&user.role==="ADMIN");}
export async function PATCH(req:Request,{params}:{params:{id:string}}){if(!await authorized())return new NextResponse("forbidden",{status:403});const body=await req.json();const memberUntil=expiry(body.memberUntil);if(memberUntil===undefined)return NextResponse.json({error:"到期日期无效"},{status:400});try{const user=await db.user.update({where:{id:params.id},data:{isMember:true,memberUntil}});return NextResponse.json({id:user.id,email:user.email,name:user.name,memberUntil:user.memberUntil});}catch{return new NextResponse("用户不存在",{status:404});}}
export async function DELETE(_req:Request,{params}:{params:{id:string}}){if(!await authorized())return new NextResponse("forbidden",{status:403});try{const user=await db.user.update({where:{id:params.id},data:{isMember:false,memberUntil:null}});return NextResponse.json({id:user.id,isMember:false});}catch{return new NextResponse("用户不存在",{status:404});}}
