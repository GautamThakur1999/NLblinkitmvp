export type Sku = {
  sku_id: string;
  name: string;
  l1_category: string;
  price: number;
  original_price: number;
  in_stock: boolean;
  is_veg: boolean | null;
};

export type Suggestion = {
  sku_id: string;
  l1: string;
  fact_id: string;
};

export type OccasionResult = {
  occasion_id: string;
  headline: string;
  suggestions: Suggestion[];
  seasonal?: boolean;
  season_tag?: string;
};

export type Persona = {
  orders_90_days: number;
  purchased_l1s: string[];
};

export type CartItem = Sku & { quantity: number };
