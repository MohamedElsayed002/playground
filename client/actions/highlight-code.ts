"use server";

import { highlightCodeToHtml, type HighlightCodeOptions } from "@/lib/shiki-server";

export async function highlightCodeAction(
  code: string,
  lang: string,
  defaultColor: "light" | "dark",
  themes?: HighlightCodeOptions["themes"],
) {
  return highlightCodeToHtml(code, lang, { defaultColor, themes });
}
