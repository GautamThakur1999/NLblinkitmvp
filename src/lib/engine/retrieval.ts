import { Sku, OccasionResult } from "./types";
import mapData from "@data/occasions/map.json";

export function getPrecomputedOccasion(cart: Sku[]): OccasionResult | null {
  if (cart.length !== 1) return null; // Precomputed map only handles single-item carts
  
  const anchorSkuId = cart[0].sku_id;
  const map = mapData.map as Record<string, OccasionResult>;
  
  const occasion = map[anchorSkuId];
  if (!occasion) return null;

  return occasion;
}
