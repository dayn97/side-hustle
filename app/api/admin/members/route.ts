import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
function expiry(value:unknown){if(typeof value!=="string"||!value)return null;const date=new Date(`${value}T23:59:59.999Z`);return Number.isNaN(date.getTime())?undefined:date;}
export async function POST(req:Request){
  const admin=await currentUser();if(!admin||admin.role!=="ADMIN")return new NextResponse("forbidden",{status:403});
  const body=await req.json();const email=String(body.email||"").trim().toLowerCase();if(!email)return NextResponse.json({error:"请输入已注册用户邮箱"},{status:400});
  const memberUntil=expiry(body.memberUntil);if(memberUntil===undefined)return NextResponse.json({error:"到期日期无效"},{status:400});
  const user=await db.user.findUnique({where:{email}});if(!user)return NextResponse.json({error:"未找到该邮箱对应的用户，请先让用户注册"},{status:404});
  const updated=await db.user.update({where:{id:user.id},data:{isMember:true,memberUntil}});
  return NextResponse.json({id:updated.id,email:updated.email,name:updated.name,memberUntil:updated.memberUntil});
}
