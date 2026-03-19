export type Post = {
  _id?: string;
  title: string;
  slug: string;
  markdown: string;
  cover?: string;
  tags?: string[];
  signal?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  views?: number;
};
