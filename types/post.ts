export type Post = {
  _id?: string;
  title: string;
  slug: string;
  markdown: string;
  cover?: string;
  tags?: string[];
  signal?: string;
  author: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  views?: number;
  isPinned?: boolean;
  pinnedAt?: string;
  favoriteCount?: number;
  isFavorited?: boolean;
};
