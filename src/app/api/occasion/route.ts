import { NextResponse } from "next/server";
import { Sku, Persona, OccasionResult, CartItem } from "@/lib/engine/types";
import { containsSensitiveAnchor, runHardFilters } from "@/lib/engine/guards";
import { getPrecomputedOccasion } from "@/lib/engine/retrieval";
import { getLiveOccasion } from "@/lib/engine/inference";
import catalogueData from "@data/catalogue/catalogue.json";
import factsData from "@data/facts/facts.json";

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const { cart, persona }: { cart: CartItem[]; persona: Persona } = await request.json();

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Empty cart" }, { status: 400 });
    }

    // P11-1: Denylist Guard (EC-S1)
    if (containsSensitiveAnchor(cart)) {
      console.log("[GUARD] Sensitive anchor detected. Silent no-op.");
      return NextResponse.json(null); // Deliberate empty response
    }

    const anchorL1s = new Set(cart.map(item => item.l1_category));
    const catalogue = catalogueData.skus as Sku[];

    // R8: 300ms Hard Ceiling Promise
    const budgetPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error("R8_LATENCY_ABANDON")), 280) // 280ms to leave room for render
    );

    const inferencePromise = async () => {
      let rawOccasion: OccasionResult | null = null;

      if (cart.length === 1) {
        // P11-30: Precomputed Path
        rawOccasion = getPrecomputedOccasion(cart);
      } else {
        // P11-25: Live Inference Path
        rawOccasion = await getLiveOccasion(cart, persona.purchased_l1s);
      }

      if (!rawOccasion) return null;

      // Apply Hard Filters (R1-R4)
      rawOccasion.suggestions = runHardFilters(
        rawOccasion.suggestions,
        anchorL1s,
        persona,
        catalogue
      );

      if (rawOccasion.suggestions.length === 0) {
        console.log("[GUARD] All suggestions filtered. Silent no-op.");
        return null;
      }

      // Attach SKU metadata and Reason text for the frontend
      const enrichedSuggestions = rawOccasion.suggestions.map(sug => {
        const sku = catalogue.find(s => s.sku_id === sug.sku_id)!;
        const factText = (factsData.facts as Record<string, { text: string }>)[sug.fact_id]?.text || "";
        return {
          ...sug,
          sku_name: sku.name,
          price: sku.price,
          original_price: sku.original_price,
          fact_text: factText
        };
      });

      return {
        ...rawOccasion,
        suggestions: enrichedSuggestions,
        _debug_render_time_ms: Date.now() - startTime
      };
    };

    // Race the inference against the 300ms budget clock
    const result = await Promise.race([inferencePromise(), budgetPromise]);
    return NextResponse.json(result);

  } catch (err) {
    if (err instanceof Error && err.message === "R8_LATENCY_ABANDON") {
      console.warn("[GUARD] R8 300ms budget blown. Abandoning.");
      return NextResponse.json(null);
    }
    console.error("API Error:", err);
    return NextResponse.json(null); // Never fail loudly to the UI
  }
}
