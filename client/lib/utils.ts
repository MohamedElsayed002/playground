import { CodeSnippet } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 86_400_000;
  const oneWeek = 7 * oneDay;

  if (diff < oneDay && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < oneWeek) {
    return (
      date.toLocaleDateString([], { weekday: "short" }) +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export const extractImageUrl = (text: string) => {
  const match = text.match(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/i);
  return match ? match[1] : null;
};

export const stripMarkdownImage = (text: string) =>
  text.replace(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/gi, "").trim();

export const formatJsonLike = (value: unknown) => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

/** Map API language labels to Shiki grammar ids. */
export function normalizeShikiLang(language: string): string {
  const key = language.trim().toLowerCase() || "code";
  const map: Record<string, string> = {
    js: "javascript",
    javascript: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",
    typescript: "typescript",
    tsx: "tsx",
    jsx: "jsx",
    py: "python",
    python: "python",
    rb: "ruby",
    rs: "rust",
    go: "go",
    sh: "bash",
    bash: "bash",
    shell: "bash",
    zsh: "bash",
    yml: "yaml",
    yaml: "yaml",
    md: "markdown",
    json: "json",
    html: "html",
    css: "css",
    sql: "sql",
    code: "typescript",
  };
  return map[key] ?? (["txt", "text", "plaintext"].includes(key) ? "plaintext" : key);
}

export function extractCodeSnippets(payload: unknown): CodeSnippet[] {
  const snippets: CodeSnippet[] = [];
  const seen = new Set<string>();

  const addSnippet = (language: string, code: string) => {
    const normalized = code.trim();
    if (!normalized) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    snippets.push({ language, code: normalized });
  };

  const visit = (value: unknown) => {
    if (typeof value === "string") {
      const markdownMatches = [...value.matchAll(/```([\w-]*)\n([\s\S]*?)```/g)];
      if (markdownMatches.length > 0) {
        for (const match of markdownMatches) {
          const language = match[1]?.trim() || "code";
          const code = match[2] ?? "";
          addSnippet(language, code);
        }
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;

      const directCode = record.code;
      if (typeof directCode === "string") {
        const language = typeof record.language === "string" ? record.language : "code";
        addSnippet(language, directCode);
      }

      Object.values(record).forEach(visit);
    }
  };

  visit(payload);
  return snippets;
}
