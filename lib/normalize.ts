export function normalizeImageUrl(input?: string): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice(7)}`;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("img.020417.xyz/")) return `https://${trimmed}`;
  if (trimmed.startsWith("/")) return `https://img.020417.xyz${trimmed}`;
  return `https://${trimmed}`;
}
