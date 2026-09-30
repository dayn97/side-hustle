import { redirect } from "next/navigation"; import { currentUser } from "@/lib/auth"; import { getLocale } from "@/lib/locale"; import NewContent from "@/components/NewContent";
export default async function New(){if(!await currentUser())redirect("/login");return <NewContent locale={getLocale()}/>}
