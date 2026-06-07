export interface FAQ {
  question: string;
  answer: string;
}

export type Section =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'tip'; text: string }
  | { type: 'warning'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'cta' }

export interface BlogPost {
  slug: string;
  title: string;
  h1: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  keywords: string[];
  readingTime: number;
  sections: Section[];
  faqs: FAQ[];
}
