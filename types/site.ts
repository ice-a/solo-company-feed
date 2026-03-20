export type SocialLink = {
  id: string;
  label: string;
  url: string;
  iconUrl?: string;
};

export type SiteSettings = {
  socialLinks: SocialLink[];
};
