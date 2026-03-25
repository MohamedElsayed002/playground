import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now  = new Date();
  const diff  = now.getTime() - date.getTime();
  const oneDay  = 86_400_000;
  const oneWeek = 7 * oneDay;
 
  if (diff < oneDay && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < oneWeek) {
    return date.toLocaleDateString([], { weekday: 'short' }) + ' ' +
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
 

export const extractImageUrl = (text: string) => {
  const match = text.match(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/i)
  return match ? match[1] : null
}

export const stripMarkdownImage = (text: string) =>
  text.replace(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/gi, "").trim()

export const formatJsonLike = (value: unknown) => {
  if (value === null || value === undefined) return "null"
  if (typeof value === "string") {
      try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value }
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2)
  return String(value)
}
