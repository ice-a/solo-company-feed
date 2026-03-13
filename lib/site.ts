export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  const fallback = "http://localhost:3000";
  const base = raw && raw.trim().length > 0 ? raw.trim() : fallback;
  return base.replace(/\/+$/, "");
}
