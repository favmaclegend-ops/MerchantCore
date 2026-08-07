export interface PlaceSuggestion {
  place_id: number;
  label: string;
  sublabel?: string;
  lat: number;
  lng: number;
  type: string;
  address: Record<string, string>;
}

export interface GeoCoords {
  lat: number;
  lng: number;
}

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  addresstype: string;
  address: Record<string, string>;
}

async function fetchPlaces(
  query: string,
  options: { limit?: number; cityOnly?: boolean } = {},
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: String(options.limit ?? 6),
    "accept-language": "en",
  });
  if (options.cityOnly) params.set("featureType", "city");

  const res = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Geocoding request failed (${res.status})`);

  const results: NominatimResult[] = await res.json();
  return results.map((r) => ({
    place_id: r.place_id,
    label: r.display_name,
    sublabel:
      r.address?.city ??
      r.address?.town ??
      r.address?.state ??
      r.address?.country ??
      "",
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    type: r.addresstype || r.type || "place",
    address: r.address ?? {},
  }));
}

export const suggestAddresses = (query: string): Promise<PlaceSuggestion[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 3) return Promise.resolve([]);
  return fetchPlaces(trimmed);
};

const CITY_TYPES = new Set([
  "city",
  "town",
  "village",
  "municipality",
  "hamlet",
  "administrative",
]);

export const suggestCities = async (query: string): Promise<PlaceSuggestion[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const exact = await fetchPlaces(trimmed, { cityOnly: true, limit: 6 });
  if (exact.length > 0) return exact;
  const broad = await fetchPlaces(trimmed, { limit: 6 });
  const filtered = broad.filter(
    (s) => CITY_TYPES.has(s.type) || Boolean(s.address?.city || s.address?.town),
  );
  return filtered.length > 0 ? filtered : broad;
};

export const geocodeAddress = async (
  query: string,
): Promise<GeoCoords | null> => {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const [best] = await fetchPlaces(trimmed, { limit: 1 });
    return best ? { lat: best.lat, lng: best.lng } : null;
  } catch {
    return null;
  }
};

export const debounce = <A extends unknown[]>(
  fn: (...args: A) => void,
  wait = 300,
): ((...args: A) => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
};
