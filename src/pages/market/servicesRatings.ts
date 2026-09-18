import { getOwnerKey } from "./marketUpload";

// The user's own star rating for each market service is kept in localStorage
// (like product ratings) so it survives reloads and can drive immediate UI
// feedback. The authoritative average lives on the backend (MarketService.rating),
// updated via PUT /market/services/:id/rate.

const RATINGS_KEY = "mc_market_service_ratings_v1";

export type StarRating = 1 | 2 | 3 | 4 | 5;

type RatingsState = Record<string, StarRating>;

function readRatings(): RatingsState {
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RatingsState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRatings(state: RatingsState): void {
  try {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — best effort
  }
}

export const getServiceRaterKey = (
  user?: { id?: string; email?: string } | null,
  orgUser?: { id?: string; email?: string } | null,
  orgId?: string | null,
): string => getOwnerKey(user, orgUser, orgId);

export const getServiceUserRating = (serviceId: string): StarRating | undefined =>
  readRatings()[serviceId];

export function setServiceUserRating(serviceId: string, stars: StarRating): void {
  const state = readRatings();
  const next: StarRating | undefined = state[serviceId] === stars ? undefined : stars;
  if (next === undefined) delete state[serviceId];
  else state[serviceId] = next;
  writeRatings(state);
}
