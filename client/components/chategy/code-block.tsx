import { cn } from "@/lib/utils";
import { highlightCodeToHtml } from "@/lib/shiki-server";

type CodeBlockProps = {
  code: string;
  lang: string;
  className?: string;
  /** Inline color for dual-theme output when SSR cannot read client theme. */
  defaultColor?: "light" | "dark";
  themes?: { light: string; dark: string };
};

/**
 * Server-only syntax highlighting: Shiki runs on the server and ships HTML to the client,
 * so grammars/WASM are not included in the browser bundle.
 */
export async function CodeBlock({
  code,
  lang,
  className,
  defaultColor = "light",
  themes,
}: CodeBlockProps) {
  const html = await highlightCodeToHtml(code, lang, { defaultColor, themes });

  return (
    <div
      className={cn(
        "[&>pre,_&_code]:!bg-transparent [&>pre,_&_code]:[background:transparent_!important] [&>pre,_&_code]:border-none [&_code]:!text-[13px]",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
