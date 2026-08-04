import { Sku, Suggestion, Persona } from "./types";
import { isSensitiveCategory } from "../denylist";

/**
 * P11-1: Denylist Guard (EC-S1, S2, S3, S7)
 * Checks if ANY item in the cart belongs to a sensitive category.
 * Uses isSensitiveCategory() which normalises to lowercase — the catalogue
 * uses Title Case ("Pharma", "Baby Care") which would never match the raw
 * denylist strings if compared directly.
 */
export function containsSensitiveAnchor(cart: Sku[]): boolean {
  return cart.some(item => isSensitiveCategory(item.l1_category));
}

/**
 * P11-2 to P11-5, P11-9: Hard Filters R1-R4
 * Filters a list of suggestions against the rigid rules.
 */
export function runHardFilters(
  suggestions: Suggestion[],
  anchorL1s: Set<string>,
  persona: Persona,
  catalogue: Sku[]
): Suggestion[] {
  const validSuggestions: Suggestion[] = [];
  const seenL1s = new Set<string>();

  for (const sug of suggestions) {
    // Relaxed R2: Max 4 suggestions to allow variety on multi-item carts
    if (validSuggestions.length >= 4) break;

    // P11-9: Catalogue Validation
    const skuData = catalogue.find(s => s.sku_id === sug.sku_id);
    if (!skuData) continue;

    // P11-5: Stock check (R4)
    if (!skuData.in_stock) continue;

    // P11-2: Suggestion L1 != Anchor L1 (R1)
    if (anchorL1s.has(skuData.l1_category)) continue;

    // P11-4: Suppress already-purchased L1 (R3)
    if (persona.purchased_l1s.includes(skuData.l1_category)) continue;

    validSuggestions.push(sug);
  }

  return validSuggestions;
}
