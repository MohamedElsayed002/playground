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
 