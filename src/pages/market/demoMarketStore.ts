import { createStore } from "elk-components";

export interface MarketStoreShop {
  shop_id: string;
  shop_name: string;
  owner: string;
  product_id: string;
  shopProfileImage?: string;
  shopProfileImagebg?: string;
  rating?: string;
  description?: string;
  createdAt?: string;
  ownerKey?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
    city?: string;
  };
}

export interface MarketProductVariant {
  image?: string;
  size?: string;
  color?: string;
  shape?: string;
}

export interface MarketStoreProduct {
  group_id: string;
  product_id: string;
  product_name: string;
  product_rating: string;
  inStock: boolean;
  shop_name: string;
  product_price: string;
  category: string
  keywords?: string[]
  productImageUrl?: string
  productImages?: string[]
  variants?: MarketProductVariant[]
  description?: string
  uploadedAt?: string
  ownerKey?: string
  sourceId?: string
}

export interface MarketStoreAdvert {
  id: string;
  title?: string;
  advertUrl: string;
  videoUrl?: string;
  visitLink: string;
}

export interface MarketStore extends Record<string, unknown> {
  shops: Record<string, MarketStoreShop>;
  top4tRatingShops?: MarketStoreShop[];
  products: MarketStoreProduct[];
  advert?: MarketStoreAdvert[]
  catergories?: string[]
  
}



export const marketData: MarketStore = {

    catergories: [
        'All', 'Beverages', 'Dairy', 'Electronics', 'Watch', 'Car', 'Perfume', 'Wine'
    ],

  shops: {},

  top4tRatingShops: [],

  advert: [],
  products: [],
};

export const marketStore = createStore<MarketStore>(marketData);


