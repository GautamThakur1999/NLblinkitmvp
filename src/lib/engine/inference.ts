import { Sku, OccasionResult } from "./types";
import factsData from "@data/facts/facts.json";

// Fallback to fetch API for Edge runtime support
export async function getLiveOccasion(cart: Sku[], personaL1s: string[]): Promise<OccasionResult | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.warn("No GROQ_API_KEY found, falling back to null");
    return null;
  }

  const cartStr = cart.map(item => `${item.name} (${item.l1_category})`).join(", ");
  const factsStr = Object.entries(factsData.facts)
    .map(([id, fact]: [string, { text: string; target_l1: string }]) => `Fact ID: ${id} | Fact: ${fact.text} | Target L1: ${fact.target_l1}`)
    .join("\n");

  // Dynamic cap: Max 2 for a single item, up to 4 for multi-item carts
  const maxSuggestions = Math.min(4, Math.max(2, cart.length));
  
  const prompt = `You are the Blinkit Occasion Engine. 
The user just added the following items to their cart: ${cartStr}.
Infer the underlying occasion.

Select up to ${maxSuggestions} cross-category suggestions to surface. 
If no facts strongly match the occasion, return an empty array for suggestions [].
You must ONLY select suggestions using Fact IDs from the following approved fact set:
${factsStr}

RULES (R1-R4):
1. Suggestion L1 MUST NOT be in the anchor L1s.
2. Suggestion L1 MUST NOT be in the user's purchased L1s: ${personaL1s.join(", ")}.

OUTPUT JSON FORMAT EXACTLY:
{
  "occasion_id": "occ_custom",
  "headline": "Short 3-4 word occasion headline (e.g., 'Goes with a rich North Indian meal')",
  "suggestions": [
    { "sku_id": "placeholder", "l1": "Target L1", "fact_id": "Selected Fact ID" }
  ]
}

DO NOT output any other text. Only JSON.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2 second max wait for LLM

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // upgraded to 70B for better reasoning while maintaining Groq's low latency
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();
    const jsonStr = data.choices[0].message.content;
    const result = JSON.parse(jsonStr) as OccasionResult;

    // Map fact_id → sku_id using the target_l1 from facts + catalogue
    // The LLM returns a fact_id; we find the best matching in-stock SKU
    // from the correct L1 in our catalogue (injected at call time by the route)
    result.suggestions = result.suggestions.map(sug => {
      // Explicit hardcoded map covering all 10 facts in facts.json
      const FACT_TO_SKU: Record<string, string> = {
        fact_monsoon_atta: "sku_storage_jar_01",
        fact_weevils: "sku_pest_strips_01",
        fact_masala_dabba: "sku_absorber_01",
        fact_degreaser: "sku_degreaser_01",
        fact_phenyl_dogs: "sku_pet_cleaner_01",
        fact_holi_oil: "sku_oil_01",
        fact_paracetamol_fluids: "sku_electrolyte_01",
        fact_party_glasses: "sku_glasses_01",
        fact_lint_roller: "sku_lint_roller_01",
        fact_baby_solids: "sku_stain_remover_01",
        fact_egg_boiler: "sku_egg_boiler_01",
        fact_egg_holder: "sku_egg_holder_01",
        fact_milk_frother: "sku_milk_frother_01",
        fact_lactose_intol: "sku_lactase_01",
        fact_heavy_meal: "sku_digestive_drops_01",
        fact_milk_spills: "sku_kitchen_towel_01",
        fact_sandwich_maker: "sku_sandwich_maker_01",
        fact_butter_toast: "sku_butter_01",
        fact_bread_jam: "sku_jam_01",
        fact_naan_marinade: "sku_tandoori_marinade_01",
        fact_mint_chutney: "sku_mint_chutney_01",
        fact_ghee_naan: "sku_ghee_01",
        fact_butter_dish: "sku_butter_dish_01",
        fact_butter_knife: "sku_butter_knife_01",
      };
      const resolvedSku = FACT_TO_SKU[sug.fact_id] ?? null;
      if (!resolvedSku) return { ...sug, sku_id: "sku_placeholder" };
      return { ...sug, sku_id: resolvedSku };
    }).filter(sug => sug.sku_id !== "sku_placeholder"); // drop unmapped

    return result;

  } catch (err) {
    console.error("Groq inference failed:", err);
    return null;
  }
}
