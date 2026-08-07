import { useContext } from "react";
import { Authcontext } from "@/context/auth_context";
import { getOrgSession } from "@/data/organisations";
import type { MarketStoreProduct, MarketStoreShop } from "./demoMarketStore";
import { getMyShop, getOwnerKey } from "./marketUpload";

export interface ShopOwnerInfo {
  ownerKey: string;
  shop: MarketStoreShop | null;
  isOwner: (shop?: MarketStoreShop | null) => boolean;
  isMyInventoryProduct: (product: MarketStoreProduct) => boolean;
}

export function useShopOwner(): ShopOwnerInfo {
  const { user, orgUser } = useContext(Authcontext);
  const orgId = getOrgSession()?.orgId ?? null;
  const ownerKey = getOwnerKey(user, orgUser, orgId);
  const shop = getMyShop(ownerKey) ?? null;
  // Uploaded products carry the uploader's ownerKey, so we can tell which market items
  // came from this account's inventory (org members share one `org:<id>` owner key).
  const isMyInventoryProduct = (product: MarketStoreProduct) =>
    product.ownerKey === ownerKey;
  return {
    ownerKey,
    shop,
    isOwner: (target) => !!target && target.ownerKey === ownerKey,
    isMyInventoryProduct,
  };
}
