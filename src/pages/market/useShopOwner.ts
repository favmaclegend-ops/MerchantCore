import { useContext } from "react";
import { Authcontext } from "@/context/auth_context";
import { getOrgSession } from "@/data/organisations";
import type { MarketStoreShop } from "./demoMarketStore";
import { getMyShop, getOwnerKey } from "./marketUpload";

export interface ShopOwnerInfo {
  ownerKey: string;
  shop: MarketStoreShop | null;
  isOwner: (shop?: MarketStoreShop | null) => boolean;
}

export function useShopOwner(): ShopOwnerInfo {
  const { user, orgUser } = useContext(Authcontext);
  const orgId = getOrgSession()?.orgId ?? null;
  const ownerKey = getOwnerKey(user, orgUser, orgId);
  const shop = getMyShop(ownerKey) ?? null;
  return {
    ownerKey,
    shop,
    isOwner: (target) => !!target && target.ownerKey === ownerKey,
  };
}
