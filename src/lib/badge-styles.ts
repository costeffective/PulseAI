import type { Sentiment } from "./types";

export function sentimentBadgeClass(sentiment: Sentiment | string) {
  switch (sentiment) {
    case "positive":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/60";
    case "negative":
      return "bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800/60";
    default:
      return "bg-stone-100 text-stone-600 ring-stone-200/60 dark:bg-stone-800/50 dark:text-stone-300 dark:ring-stone-700/60";
  }
}

export function priorityBadgeClass(priority: string) {
  switch (priority) {
    case "high":
      return "bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800/60";
    case "medium":
      return "bg-amber-50 text-amber-800 ring-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/60";
    default:
      return "bg-stone-100 text-stone-600 ring-stone-200/60 dark:bg-stone-800/50 dark:text-stone-300 dark:ring-stone-700/60";
  }
}

export function categoryBadgeClass(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("bug"))
    return "bg-red-50 text-red-700 ring-red-200/60 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800/60";
  if (normalized.includes("feature"))
    return "bg-violet-50 text-violet-700 ring-violet-200/60 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800/60";
  if (normalized.includes("pricing"))
    return "bg-orange-50 text-orange-700 ring-orange-200/60 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-800/60";
  if (normalized.includes("ux"))
    return "bg-sky-50 text-sky-700 ring-sky-200/60 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800/60";
  if (normalized.includes("praise"))
    return "bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/60";
  return "bg-indigo-50 text-indigo-700 ring-indigo-200/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-800/60";
}
