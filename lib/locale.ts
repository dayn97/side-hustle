import { cookies } from "next/headers";

export type Locale = "zh" | "en";

export function getLocale(): Locale {
  return cookies().get("inkwell_locale")?.value === "en" ? "en" : "zh";
}
