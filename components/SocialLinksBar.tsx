import { SocialLink } from "@/types/site";

function normalizeLinks(links: SocialLink[]) {
  return links.filter((item) => item.url && item.label);
}

export function SocialLinksBar({
  links,
  title = "社交链接",
  compact = false
}: {
  links: SocialLink[];
  title?: string;
  compact?: boolean;
}) {
  const visibleLinks = normalizeLinks(links);
  if (visibleLinks.length === 0) {
    return null;
  }

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "space-y-3"}>
      {!compact ? <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">{title}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        {visibleLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className={`group inline-flex items-center gap-2 rounded-full transition ${
              compact
                ? "bg-white/70 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-white"
                : "bg-white/12 px-3 py-2 text-sm text-white ring-1 ring-white/15 hover:bg-white/20"
            }`}
          >
            {link.iconUrl ? (
              <img
                src={link.iconUrl}
                alt=""
                className="h-5 w-5 rounded-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                  compact ? "bg-slate-900 text-white" : "bg-white text-brand-700"
                }`}
              >
                {link.label.slice(0, 1)}
              </span>
            )}
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
