/**
 * Model routing + latency budgets for the Occasion Engine runtime.
 *
 * Single source of truth — no model ID or budget should appear anywhere else
 * in the app. See architecture.md §2.1 and §6.3.
 *
 * MODEL IDS VERIFIED: 30 July 2026
 *   Groq   — console.groq.com/docs/models  (production models only)
 *   Gemini — ai.google.dev/gemini-api/docs/models
 *
 * Provider model IDs churn faster than documentation. Prefer PRODUCTION over
 * PREVIEW — Groq warns that preview models may be discontinued without notice.
 */

export interface ModelConfig {
  provider: 'groq' | 'gemini';
  modelId: string;
  isFreeTier: boolean;
  note?: string;
}

/**
 * Tier 1 — live occasion inference for multi-item carts.
 *
 * Groq is not a preference here: time-to-first-token IS the product constraint
 * (docs/06-mvp-concept.md R8, 300ms hard ceiling). No other provider currently
 * clears that budget reliably.
 */
export const LIVE_INFERENCE_MODEL: ModelConfig = {
  provider: 'groq',
  modelId: 'llama-3.3-70b-versatile',
  isFreeTier: true,
  note: 'Production model. Large instruct, sub-second TTFT.',
};

/**
 * Tier 1 alternative — smaller/faster if the 70B model misses the budget under
 * load. Swap via OCCASION_MODEL_OVERRIDE without touching call sites.
 */
export const LIVE_INFERENCE_MODEL_FAST: ModelConfig = {
  provider: 'groq',
  modelId: 'llama-3.1-8b-instant',
  isFreeTier: true,
  note: 'Lower latency, less nuance. Budget escape hatch.',
};

/** Tier 2 — Groq unavailable or rate-limited. Silent to the user. */
export const FALLBACK_INFERENCE_MODEL: ModelConfig = {
  provider: 'gemini',
  modelId: 'gemini-2.5-flash',
  isFreeTier: true,
  note: 'Tier 2 of the degradation ladder (architecture.md §6.4).',
};

/**
 * Latency budgets in milliseconds (architecture.md §6.3).
 *
 * HARD_CEILING_ABANDON is the only one that is enforced rather than measured.
 * Per edge.md EC-L1, a path exceeding it is ABANDONED, not delayed — a loading
 * skeleton on a non-blocking surface reads as broken rather than loading.
 * Late is worse than absent.
 */
export const LATENCY_BUDGETS = {
  PRECOMPUTED_P50: 15,
  PRECOMPUTED_P95: 40,
  LIVE_ROUTE_GUARDS_P50: 20,
  LIVE_ROUTE_GUARDS_P95: 50,
  LIVE_INFERENCE_P50: 180,
  LIVE_INFERENCE_P95: 400,
  LIVE_FILTERS_P50: 5,
  LIVE_FILTERS_P95: 15,
  /** R8. Enforced, not aspirational. Abandon beyond this. */
  HARD_CEILING_ABANDON: 300,
} as const;

/** Hard rules from docs/06-mvp-concept.md §4. Enforced in code, never in prompts. */
export const OCCASION_RULES = {
  /** R2 — a list recreates the evaluation cost we are removing. */
  MAX_SUGGESTIONS: 2,
  /** R5 — firing on every add trains users to ignore it. */
  MAX_FIRES_PER_SESSION: 1,
  /** EC-T9 — repeated dismissal is a signal. */
  DISMISSALS_BEFORE_MUTE: 3,
  /** EC-T3 — fire once, on the settled cart state. */
  DEBOUNCE_MS: 800,
  /** EC-D4 — a jarring price gap reads as upsell and kills the helpful framing. */
  MAX_PRICE_RATIO_VS_ANCHOR: 4,
  /** EC-M6 — drop rather than truncate; half a reason is worse than none. */
  MAX_REASON_CHARS: 60,
  /** EC-S4 / EC-S5 — baby and pet adjacencies decay; bereavement is possible. */
  SENSITIVE_CATEGORY_DECAY_DAYS: 60,
} as const;

/**
 * Whether live inference is possible at all.
 *
 * Must be checked server-side only. Per edge.md EC-P1 the app boots and serves
 * with no keys set, degrading to the precomputed path — it never crashes.
 */
export function hasLiveInference(): boolean {
  return Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
}
