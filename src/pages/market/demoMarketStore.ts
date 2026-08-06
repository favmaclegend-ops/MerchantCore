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
  description?: string
  uploadedAt?: string
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

  shops: {
    'sunrise_mart@123456': {
      shop_id: "sunrise_mart@123456",
      shop_name: "Sunrise Mart",
      owner: "Daniel kofie",
      product_id: "sunrise_mart_product1234",
      shopProfileImage: "/img1.png",
      shopProfileImagebg: '',
      rating: "204000",
      description: "Your neighbourhood one-stop grocery destination. From farm-fresh produce to everyday essentials, Sunrise Mart brings quality, convenience and warm service to every doorstep.",
      createdAt: "2019-03-12",
      location: {
        lat: 5.6037,
        lng: -0.187,
        address: "12 Independence Avenue, Osu",
        city: "Accra, Ghana"
      },
    },
    'elfridas_kitchen@990451': {
      shop_id: "elfridas_kitchen@990451",
      shop_name: "Elfirda's Kitchen",
      owner: "Elfrida Rollings",
      product_id: "mc_elfirdas_kitchen@123456",
      shopProfileImage: "/img2.png",
      rating: "345000",
      shopProfileImagebg: '',
      description: "Authentic homemade flavours crafted with love. Elfrida's Kitchen serves hearty, made-from-scratch meals inspired by generations of family recipes.",
      createdAt: "2020-07-21",
      location: {
        lat: 5.615,
        lng: -0.172,
        address: "4 Oxford Street, Osu",
        city: "Accra, Ghana"
      },
    },
    'bugger_bug@20045': {
      shop_id: "bugger_bug@20045",
      shop_name: "Bugger Bug",
      owner: "Aziz Bah",
      product_id: "mc_bugger_bug@200451",
      shopProfileImage: "/img3.png",
      rating: "20000",
      shopProfileImagebg: '',
      description: "Luxury timepieces and statement accessories for the modern connoisseur. Discover premium watches, jewellery and more — carefully curated and guaranteed authentic.",
      createdAt: "2018-11-05",
      location: {
        lat: 5.6504,
        lng: -0.1874,
        address: "88 Spintex Road, Community 11",
        city: "Tema, Ghana"
      },
    },
    'Kolay@00021': {
      shop_id: "Kolay@00021",
      shop_name: "Kolay",
      owner: "Kenneth Kolka",
      product_id: "mc_kolay@200451",
      shopProfileImage: "/img4.png",
      rating: "15000",
      shopProfileImagebg: '',
      description: "Kolay is a boutique marketplace for refined everyday goods. Expect curated quality, honest pricing and an effortless shopping experience.",
      createdAt: "2021-01-30",
      location: {
        lat: 5.5907,
        lng: -0.21,
        address: "23 Ring Road Central, Adabraka",
        city: "Accra, Ghana"
      },
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
      id: `mc_ad-sunrisemart-${Math.floor(Math.random() * 999999999)}`,
      title: "Sunrise Mart — Fresh Daily",
      advertUrl:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
      videoUrl:
        "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
      visitLink: "https://www.google.com",
    },
    {
      id: `mc_ad-elfirdas-${Math.floor(Math.random() * 999999999)}`,
      title: "Elfrida's Kitchen — Home Made",
      advertUrl:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
      videoUrl:
        "https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4",
      visitLink: "https://www.wikipedia.org",
    },
    {
      id: `mc_ad-buggerbug-${Math.floor(Math.random() * 999999999)}`,
      title: "Bugger Bug — Luxury Watches",
      advertUrl:
        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80",
      videoUrl:
        "https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4",
      visitLink: "https://github.com",
    },
    {
      id: `mc_ad-kolay-${Math.floor(Math.random() * 999999999)}`,
      title: "Kolay — Curated Goods",
      advertUrl:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80",
      videoUrl:
        "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4",
      visitLink: "https://www.mozilla.org",
    },
    {
      id: `mc_ad-pureheaven-${Math.floor(Math.random() * 999999999)}`,
      title: "Pure Heaven — Fine Wine",
      advertUrl:
        "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
      videoUrl:
        "https://mdn.github.io/learning-area/html/multimedia-and-embedding/video-and-audio-content/rabbit320.mp4",
      visitLink: "https://www.openstreetmap.org",
    },
    {
      id: `mc_ad-sunrisedelivery-${Math.floor(Math.random() * 999999999)}`,
      title: "Sunrise Mart — Groceries Delivered",
      advertUrl:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      visitLink: "https://www.youtube.com",
    },
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
      keywords: ['Milk', 'fresh', 'drink', 'liquid', 'water'],
      productImageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=900&q=80",
      ],
      description: "Farm-fresh whole milk, chilled daily and packed with natural goodness. Perfect for your morning cereal, coffee, or a glass straight up.",
      uploadedAt: "2026-01-14",
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
      productImageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80",
      ],
      description: "A rich, malty non-alcoholic drink with a satisfyingly bold taste. Chilled perfection in every bottle.",
      uploadedAt: "2026-02-03",

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
      keywords: ['pure', 'heaven', 'expensive', 'drink', 'wine', 'liquid', 'water'],
      productImageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1528823872057-9c018a7a7553?auto=format&fit=crop&w=900&q=80",
      ],
      description: "A refined wine with a smooth, velvety finish. Pure Heaven is crafted for special moments and quiet evenings.",
      uploadedAt: "2025-12-19",
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
      keywords: ['glass', 'time', 'chanted'],
      productImageUrl: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=600&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1510672981848-a1c4f1cb5abf?auto=format&fit=crop&w=900&q=80",
      ],
      description: "An elegant hourglass that brings timeless charm to any desk. A perfect gift for the thinker and the dreamer.",
      uploadedAt: "2026-01-28",
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
      keywords: ['rolex', 'expensive', 'silver', 'gold', 'watch', 'diamond'],
      productImageUrl: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=600&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80",
      ],
      description: "A statement timepiece set with brilliant stones on a premium bracelet. Engineered for those who value precision and style.",
      uploadedAt: "2025-11-08",

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
      keywords: ['watch', 'rolex'],
      productImageUrl: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=600&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80",
      ],
      description: "The iconic timepiece of legends. Swiss precision, timeless design, and unmistakable presence on the wrist.",
      uploadedAt: "2026-03-02",
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
      keywords: ['air', 'fresh', 'sweet', 'perfume', 'night', 'attractive'],
      productImageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=900&q=80",
      ],
      description: "A bold, magnetic fragrance that lingers through the night. Sweet, fresh, and irresistibly confident.",
      uploadedAt: "2026-02-21",
    },
  ],
};

export const marketStore = createStore<MarketStore>(marketData);


