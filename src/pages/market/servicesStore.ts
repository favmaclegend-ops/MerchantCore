import { createStore } from "elk-components";
import { api } from "@/lib/api";

export interface MarketService {
  id: string;
  shop_id: string;
  shop_name?: string;
  source_id?: string | null;
  name: string;
  price: number;
  offer?: string | null;
  description?: string | null;
  image_url: string;
  rating: number;
  created_at?: string | null;
}

interface MarketServicesState extends Record<string, unknown> {
  items: MarketService[];
  loading: boolean;
  loaded: boolean;
  error?: string | null;
}

export const marketServicesStore = createStore<MarketServicesState>({
  items: [],
  loading: false,
  loaded: false,
  error: null,
});

export const fetchMarketServices = async (): Promise<MarketService[]> => {
  marketServicesStore.setState({ loading: true, error: null });
  try {
    const res = await api.market.getServices(undefined, 1, 100);
    const items = (res.services ?? []).map((s) => ({
      id: String(s.id ?? ""),
      shop_id: String(s.shop_id ?? ""),
      shop_name: s.shop_name ? String(s.shop_name) : undefined,
      source_id: s.source_id ? String(s.source_id) : null,
      name: String(s.name ?? ""),
      price: Number(s.price ?? 0),
      offer: s.offer ? String(s.offer) : null,
      description: s.description ? String(s.description) : null,
      image_url: String(s.image_url ?? ""),
      rating: Number(s.rating ?? 0),
      created_at: s.created_at ? String(s.created_at) : null,
    }));
    marketServicesStore.setState({ items, loading: false, loaded: true, error: null });
    return items;
  } catch (e) {
    marketServicesStore.setState({
      loading: false,
      error: e instanceof Error ? e.message : "Could not load market services",
    });
    return marketServicesStore.getState().items;
  }
};
