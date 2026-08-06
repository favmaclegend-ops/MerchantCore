import { createStore } from "elk-components";

export interface MarketStoreShop {
  shop_id: string;
  shop_name: string;
  owner: string;
  product_id: string;
  shopProfileImage?: string;
  shopProfileImagebg?: string;
  rating?: string;
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
}

export interface MarketStoreAdvert {
    id: string,
    advertUrl: string,
    visitLink: string,
}

export interface MarketStore extends Record<string, unknown> {
  shops: Record<string, MarketStoreShop>;
  top4tRatingShops?: MarketStoreShop[];
  products: MarketStoreProduct[];
  advert?: MarketStoreAdvert[]
  catergories?: string[]
  
}



export const marketStore = createStore<MarketStore>({

    catergories: [
        'All', 'Beverages', 'Dairy', 'Electronics', 'Watch', 'Car', 'Perfume', 'Wine'
    ],

  shops: {
    'sunrise_mart@123456': {
      shop_id: "sunrise_mart@123456",
      shop_name: "Sunrise Mart",
      owner: "Daniel kofie",
      product_id: "sunrise_mart_product1234",
      shopProfileImage: "/img1.png",
      shopProfileImagebg: '',
      rating: "204000",
    },
    'elfridas_kitchen@990451': {
      shop_id: "elfridas_kitchen@990451",
      shop_name: "Elfirda's Kitchen",
      owner: "Elfrida Rollings",
      product_id: "mc_elfirdas_kitchen@123456",
      shopProfileImage: "/img2.png",
      rating: "345000",
      shopProfileImagebg: ''
    },
    'bugger_bug@20045': {
      shop_id: "bugger_bug@20045",
      shop_name: "Bugger Bug",
      owner: "Aziz Bah",
      product_id: "mc_bugger_bug@200451",
      shopProfileImage: "/img3.png",
      rating: "20000",
      shopProfileImagebg: ''
    },
    'Kolay@00021': {
      shop_id: "Kolay@00021",
      shop_name: "Kolay",
      owner: "Kenneth Kolka",
      product_id: "mc_kolay@200451",
      shopProfileImage: "/img4.png",
      rating: "15000",
      shopProfileImagebg: ''
    },
  },

  top4tRatingShops: [
    {
      shop_id: "sunrise_mart@123456",
      shop_name: "Sunrise Mart",
      owner: "Daniel kofie",
      product_id: "sunrise_mart_product1234",
      shopProfileImage: "",
      rating: "400000",
    },
    {
      shop_id: "elfridas_kitchen@990451",
      shop_name: "Elfirda's Kitchen",
      owner: "Elfrida Rollings",
      product_id: "mc_elfirdas_kitchen@123456",
      shopProfileImage: "",
      rating: "345000",
    },
    {
      shop_id: "bugger_bug@20045",
      shop_name: "Bugger Bug",
      owner: "Aziz Bah",
      product_id: "mc_bugger_bug@200451",
      shopProfileImage: "",
      rating: "20000",
    },
    {
      shop_id: "Kolay@00021",
      shop_name: "Kolay",
      owner: "Kenneth Kolka",
      product_id: "mc_kolay@200451",
      shopProfileImage: "",
      rating: "15000",
    },
  ],

  advert: [
    {
        id: `mc_sunrisemart-${Math.floor(Math.random() * 999999999)}`,
        advertUrl: '/img1.png',
        visitLink: ''
    },
    {
        id: `mc_sunrisemart-${Math.floor(Math.random() * 999999999)}`,
        advertUrl: '/img2.png',
        visitLink: ''
    },
    {
        id: `mc_sunrisemart-${Math.floor(Math.random() * 999999999)}`,
        advertUrl: '/img3.png',
        visitLink: ''
    },
    {
        id: `mc_sunrisemart-${Math.floor(Math.random() * 999999999)}`,
        advertUrl: '/img4.png',
        visitLink: ''
    }
  ],
  products: [
    {
      group_id: "sunrise_mart_product1234",
      product_id: `mc_sunrisemart-${Math.floor(Math.random() * 999999999)}`,
      product_name: "Fresh Milk",
      product_rating: "2500",
      shop_name: "Sunrise Mart",
      inStock: true,
      product_price: "2.99",
      category: 'Diary',
      keywords: ['Milk', 'fresh', 'drink', 'liquid', 'water']
    },
    {
      group_id: "Kolay@00021",
      product_id: `mc_sunrisemart-${Math.floor(Math.random() * 999999999)}`,
      product_name: "Mega Malt",
      product_rating: "14900",
      inStock: true,
      shop_name: "Sunrise Mart",
      product_price: "15",
      category: 'Beverages',
      keywords: ['malt', 'mega', 'fresh', 'drink', 'liquid', 'water'],

    },
    {
      group_id: "sunrise_mart_product1234",
      product_id: `mc_sunrisemart-${Math.floor(Math.random() * 999999999)}`,
      product_name: "Pure Heaven",
      product_rating: "2000",
      inStock: true,
      shop_name: "Sunrise Mart",
      product_price: "150",
      category: 'Wine',
      keywords: ['pure', 'heaven', 'expensive', 'drink', 'wine', 'liquid', 'water']
    },
    {
      group_id: "elfridas_kitchen@990451",
      product_id: `mc_sunrisemart-${Math.floor(Math.random() * 999999999)}`,
      product_name: "Hour Glass",
      product_rating: "600",
      inStock: true,
      shop_name: "Elfirida's Kitchen",
      product_price: "12",
      category: 'Gadgets',
      keywords: ['glass', 'time', 'chanted']
    },
    {
      group_id: "bugger_bug@20045",
      product_id: `mc_sunrisemart-${Math.floor(Math.random() * 999999999)}`,
      product_name: "Diamond Watch",
      product_rating: "1000500",
      inStock: true,
      shop_name: "Bugger Bug",
      product_price: "1000000",
      category: 'Watch',
      keywords: ['rolex', 'expensive', 'silver', 'gold', 'watch', 'diamond']

    },
    {
      group_id: "sunrise_mart_product1234",
      product_id: `mc_sunrisemart-${Math.floor(Math.random() * 999999999)}`,
      product_name: "Rolex",
      product_rating: "90000",
      inStock: true,
      shop_name: "Sunrise Mart",
      product_price: "1000000",
      category: 'Watch',
      keywords: ['watch', 'rolex']
    },
    {
      group_id: "sunrise_mart_product1234",
      product_id: `mc_sunrisemart-${Math.floor(Math.random() * 999999999)}`,
      product_name: "Draqular",
      product_rating: "1500",
      inStock: true,
      shop_name: "Sunrise Mart",
      product_price: "1200",
      category: 'Perfume',
      keywords: ['air', 'fresh', 'sweet', 'perfume', 'night', 'attractive']
    },
  ],
});


