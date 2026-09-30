import { redirect } from "next/navigation"; import { currentUser } from "@/lib/auth"; import NewContent from "@/components/NewContent";
export default async function New(){if(!await currentUser())redirect("/login");return <NewContent/>}
