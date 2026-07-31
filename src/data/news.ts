export type NewsPost = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  category: string;
};

export type NewsLink = {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  summary?: string;
};

export const newsPosts: NewsPost[] = [];

export const newsLinks: NewsLink[] = [];
