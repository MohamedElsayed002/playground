import { createHighlighterCore } from "@shikijs/core";
import { createOnigurumaEngine } from "@shikijs/engine-oniguruma";
import githubDark from "@shikijs/themes/github-dark";
import githubLight from "@shikijs/themes/github-light";
import { normalizeShikiLang } from "@/lib/utils";

/**
 * Fine-grained Shiki bundle: only these grammars and themes are ever loaded.
 * Keep in sync with {@link normalizeShikiLang} and app usage (TS/JSON demos, Chategy snippets).
 */
const langLoaders = [
  () => import("@shikijs/langs/javascript"),
  () => import("@shikijs/langs/typescript"),
  () => import("@shikijs/langs/tsx"),
  () => import("@shikijs/langs/jsx"),
  () => import("@shikijs/langs/json"),
  () => import("@shikijs/langs/python"),
  () => import("@shikijs/langs/ruby"),
  () => import("@shikijs/langs/rust"),
  () => import("@shikijs/langs/go"),
  () => import("@shikijs/langs/bash"),
  () => import("@shikijs/langs/yaml"),
  () => import("@shikijs/langs/markdown"),
  () => import("@shikijs/langs/html"),
  () => import("@shikijs/langs/css"),
  () => import("@shikijs/langs/sql"),
] as const;

let highlighterPromise: ReturnType<typeof createHighlighterCore> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubLight, githubDark],
      langs: [...langLoaders],
      engine: createOnigurumaEngine(import("shiki/wasm")),
    });
  }
  return highlighterPromise;
}

export type HighlightCodeOptions = {
  themes?: { light: string; dark: string };
  defaultColor?: "light" | "dark";
};

export async function highlightCodeToHtml(
  code: string,
  lang: string,
  options: HighlightCodeOptions = {},
): Promise<string> {
  const { defaultColor = "light", themes = { light: "github-light", dark: "github-dark" } } =
    options;

  const normalized = normalizeShikiLang(lang);
  const highlighter = await getHighlighter();

  const run = (langId: string) =>
    highlighter.codeToHtml(code, {
      lang: langId,
      themes: {
        light: themes.light,
        dark: themes.dark,
      },
      defaultColor,
    });

  try {
    return await run(normalized);
  } catch {
    return await run("typescript");
  }
}
