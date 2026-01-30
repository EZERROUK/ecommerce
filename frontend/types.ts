
export interface Service {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  benefits: string[];
  features: string[];
  metaTitle?: string;
  metaDesc?: string;
  faq?: FAQItem[]; // Pour Schema FAQPage (invisible ou visible)
}

export interface Product {
  id: string;
  slug?: string; // URL SEO Friendly
  name: string;
  category: 'server' | 'laptop' | 'desktop' | 'network' | 'printer' | 'software' | 'accessory' | 'rental';
  backendCategoryId?: number;
  backendCategoryName?: string;
  price?: string;
  description: string;
  fullDescription?: string; // Description longue SEO
  specs: string[];
  attributes?: Array<{ name: string; value: string }>;
  image: string;
  imageAlt?: string; // ALT SEO
  isRental?: boolean;
  badge?: 'new' | 'promo' | 'refurbished' | 'bestseller';
  rating?: number;
  condition?: 'new' | 'refurbished' | 'refurbished_premium';
  brand?: string;
  sku?: string; // Schema Product
  stock?: 'in_stock' | 'out_of_stock' | 'on_order'; // Gestion Stock
  metaTitle?: string;
  metaDesc?: string;
  keywords?: string[];

  documents?: Array<{
    id: number;
    title?: string;
    type: string;
    url: string;
  }>;
}

export interface TeamMember {
  name: string;
  role: string;
  image: string;
}

export interface Stat {
  value: string;
  label: string;
  icon: string;
}

export interface NavItem {
  label: string;
  path: string;
  key?: string;
  subItems?: { label: string; path: string; key?: string }[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug?: string;
  category: 'Conseils IT' | 'Comparatifs' | 'Actualités';
  excerpt: string;
  date: string;
  image: string;
  author: string;
}

export interface SuccessStory {
  id: string;
  client: string;
  sector: string;
  title: string;
  challenge: string;
  solution: string;
  result: string;
  image: string;
  logo?: string; // Logo client
}

export interface Review {
  id: string;
  company: string;
  sector: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export type ProductReview = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt?: string | null;
};

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  image?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: 'vente' | 'location' | 'support' | 'services' | 'paiement';
}

export interface Sector {
  id: string;
  slug: string;
  title: string;
  icon: string;
  description: string;
  metaTitle: string;
  metaDesc: string;
  challenges: string[];
  solutions: string[];
  image: string;
}