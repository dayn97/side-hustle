import AuthForm from "@/components/AuthForm";
import { googleConfigured } from "@/lib/google";
import { getLocale } from "@/lib/locale";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };
export default function Login({ searchParams }: { searchParams: { error?: string } }) {
  return <AuthForm locale={getLocale()} googleEnabled={googleConfigured()} oauthError={searchParams.error} />;
}
