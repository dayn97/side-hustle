import { NextResponse } from "next/server";
export async function POST(req:Request){const payload=await req.json();return NextResponse.json({received:true,note:"Verify PayPal transmission headers and order status here before calling markOrderPaid."});}
