export type ApiPaginated<T> = {
  data: T[];
  links?: unknown;
  meta?: unknown;
  success?: boolean;
};

export type ApiCategory = {
  id: number;
  name: string;
  slug?: string;
  parent_id?: number | null;
  children?: ApiCategory[];
};

export type ApiProductAttribute = {
  name: string;
  value: string;
};

export type ApiProductImage = {
  id: number;
  product_id: string;
  path: string;
  alt_text?: string | null;
  sort_order?: number;
  is_primary: boolean;
  deleted_at?: string | null;
};

export type ApiProduct = {
  id: string;
  sku?: string | null;
  name: string;
  slug?: string | null;
  condition?: 'new' | 'refurbished' | 'refurbished_premium' | null;
  is_price_on_request?: boolean | null;
  price?: number | null;
  price_ht?: number | null;
  stock?: number | null;
  description?: string | null;
  images?: ApiProductImage[];
  category?: ApiCategory | null;
  attributes?: ApiProductAttribute[];
  documents?: Array<{ id: number; title?: string; type?: string; url?: string; file_url?: string }>;
};

export type ApiSuccessEnvelope<T> = {
  success: boolean;
  data: T;
};

export type ApiProductsIndexResponse = ApiPaginated<ApiProduct> & { success?: boolean };

export type ApiProductShowResponse = {
  data: ApiProduct;
  success?: boolean;
};

export type ApiBlogPostSource = {
  label?: string | null;
  url?: string | null;
};

export type ApiBlogPost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  author?: string | null;
  excerpt?: string | null;
  summary?: string | null;
  content?: string | null;
  topics?: string[];
  sources?: ApiBlogPostSource[];
  image?: string | null;
  banner_url?: string | null;
  published_at?: string | null;
  date?: string | null;
};

export type ApiBlogPostsIndexResponse = ApiPaginated<ApiBlogPost> & { success?: boolean };

export type ApiBlogPostShowResponse = {
  data: ApiBlogPost;
  success?: boolean;
};

export type ApiProductSearchResponse = {
  success: boolean;
  // Selon l’implémentation backend, `results` peut être soit un tableau direct
  // de produits, soit un objet paginé contenant `data`.
  results:
    | ApiProduct[]
    | {
        data: ApiProduct[];
        links?: unknown;
        meta?: unknown;
      };
  pagination?: {
    current_page: number;
    last_page: number;
    total: number;
  };
};

export type ApiRecommendedResponse = {
  success: boolean;
  products:
    | ApiProduct[]
    | { data: ApiProduct[] };
};

export type ApiProductReview = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string | null;
};

export type ApiProductReviewsResponse = {
  data: ApiProductReview[];
  success?: boolean;
};

export type ApiCreateProductReviewRequest = {
  author_name: string;
  author_email?: string;
  rating: number;
  comment: string;
};

export type ApiCreateProductReviewResponse = {
  success: boolean;
  message?: string;
};

export type ApiCreateOrderRequest = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    address1: string;
    address2?: string;
    city: string;
    postal_code?: string;
    country?: string;
  };
  items: Array<{ product_id: string; quantity: number }>;
  notes?: string;
};

export type ApiCreateOrderResponse = {
  success: boolean;
  order?: {
    id: number;
    order_number: string;
    total_ttc: number;
    currency_code: string;
  };
  message?: string;
};

export type ApiTrackOrderResponse = {
  success: boolean;
  order?: {
    order_number: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    payment_method: 'cod';
    created_at: string;
    subtotal_ht: number;
    total_tax: number;
    total_ttc: number;
    currency_code: string;
    shipping_address?: {
      city?: string | null;
      country?: string | null;
    };
    items: Array<{
      name: string;
      sku?: string | null;
      quantity: number;
      line_total_ttc: number;
    }>;
  };
  message?: string;
};
