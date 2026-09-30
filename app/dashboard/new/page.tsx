import { redirect } from "next/navigation"; import { currentUser } from "@/lib/auth"; import Editor from "@/components/Editor";
export default async function New(){if(!await currentUser())redirect("/login");return <Editor/>}
