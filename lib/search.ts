export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildSearchFilter(query?: string) {
  if (!query) return null;
  const trimmed = query.trim();
  if (!trimmed) return null;
  const safe = escapeRegExp(trimmed);
  const regex = new RegExp(safe, "i");
  return {
    $or: [{ title: { $regex: regex } }, { markdown: { $regex: regex } }]
  };
}
