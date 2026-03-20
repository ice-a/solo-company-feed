import { getDb } from "@/lib/mongo";
import { SiteSettings, SocialLink } from "@/types/site";

const SETTINGS_COLLECTION = "settings";
const SITE_SETTINGS_ID = "site";

type SiteSettingsDocument = {
  _id: string;
  socialLinks?: SocialLink[];
};

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  {
    id: "github",
    label: "GitHub",
    url: "",
    iconUrl: ""
  },
  {
    id: "bilibili",
    label: "B站",
    url: "",
    iconUrl: ""
  }
];

function normalizeSocialLink(link: any, index: number): SocialLink | null {
  if (!link || typeof link !== "object") {
    return null;
  }

  const label = typeof link.label === "string" ? link.label.trim() : "";
  const url = typeof link.url === "string" ? link.url.trim() : "";
  const iconUrl = typeof link.iconUrl === "string" ? link.iconUrl.trim() : "";
  const id =
    typeof link.id === "string" && link.id.trim()
      ? link.id.trim()
      : `social-link-${index + 1}`;

  if (!label && !url && !iconUrl) {
    return null;
  }

  return {
    id,
    label: label || `链接 ${index + 1}`,
    url,
    iconUrl
  };
}

function getSettingsCollection() {
  return getDb().then((db) => db.collection<SiteSettingsDocument>(SETTINGS_COLLECTION));
}

export function getDefaultSocialLinks() {
  return DEFAULT_SOCIAL_LINKS.map((item) => ({ ...item }));
}

export function normalizeSiteSettings(doc?: Partial<SiteSettingsDocument> | null): SiteSettings {
  const socialLinks = Array.isArray(doc?.socialLinks)
    ? doc.socialLinks
        .map((item: any, index: number) => normalizeSocialLink(item, index))
        .filter(Boolean)
    : [];

  return {
    socialLinks: socialLinks.length > 0 ? (socialLinks as SocialLink[]) : getDefaultSocialLinks()
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const collection = await getSettingsCollection();
  const doc = await collection.findOne({ _id: SITE_SETTINGS_ID });
  return normalizeSiteSettings(doc);
}

export async function updateSiteSettings(settings: SiteSettings) {
  const collection = await getSettingsCollection();
  await collection.updateOne(
    { _id: SITE_SETTINGS_ID },
    {
      $set: {
        socialLinks: settings.socialLinks
      }
    },
    { upsert: true }
  );
}
