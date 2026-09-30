import AuthForm from "@/components/AuthForm";
import { googleConfigured } from "@/lib/google";
import { getLocale } from "@/lib/locale";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } };
export default function Register() {
  return <AuthForm register locale={getLocale()} googleEnabled={googleConfigured()} />;
}
