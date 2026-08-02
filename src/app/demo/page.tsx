"use client";

import { useState, useCallback, useRef } from "react";
import catalogueData from "@data/catalogue/catalogue.json";
import personasData from "@data/users/personas.json";

// ── Types ─────────────────────────────────────────────────────────────────────
type Sku = {
  sku_id: string;
  name: string;
  l1_category: string;
  price: number;
  original_price: number;
  in_stock: boolean;
  is_veg: boolean | null;
};

type EnrichedSuggestion = {
  sku_id: string;
  l1: string;
  fact_id: string;
  sku_name: string;
  price: number;
  original_price: number;
  fact_text: string;
};

type OccasionResult = {
  occasion_id: string;
  headline: string;
  suggestions: EnrichedSuggestion[];
  _debug_render_time_ms?: number;
};

type TriggerLogEntry = {
  ts: number;
  anchor_sku: string;
  anchor_l1: string;
  outcome: "BLOCKED_SENSITIVE" | "BLOCKED_FILTERED" | "BLOCKED_TIMEOUT" | "RENDERED" | "NO_OCCASION" | "DISMISSED";
  rule?: string;
  debug?: string;
};

// P13-9: Per-occasion precision record
type OccasionStats = {
  occasion_id: string;
  headline: string;
  impressions: number;
  adds: number;   // suggestions added from this occasion
};

type PersonaKey = "user_segment_a_hero" | "user_segment_b_suppression";
type Personas = typeof personasData.personas;

const ALL_SKUS = catalogueData.skus as Sku[];
const PERSONAS = personasData.personas as Personas;
const L1_CATEGORIES = [...new Set(ALL_SKUS.map(s => s.l1_category))].sort();

// ── P13-8: C60 tracking scaffold (sessionStorage) ─────────────────────────────
// C60 = repurchase of a new category within 60 days
// In this demo we scope it to session; in production it would be persistent.
function recordC60(l1_category: string) {
  if (typeof window === "undefined") return;
  const existing = JSON.parse(sessionStorage.getItem("c60_events") || "[]") as { l1: string; ts: number }[];
  existing.push({ l1: l1_category, ts: Date.now() });
  sessionStorage.setItem("c60_events", JSON.stringify(existing));
}

function getC60Events(): { l1: string; ts: number }[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(sessionStorage.getItem("c60_events") || "[]");
}

// ── Demo Banner ───────────────────────────────────────────────────────────────
function DemoBanner() {
  return (
    <div className="bg-primary-container border-b border-outline-variant px-gutter py-2 flex items-center gap-2 text-xs text-on-primary-container font-medium">
      <span className="material-symbols-outlined text-[16px]">warning</span>
      DEMO DATA — synthetic catalogue · not real Blinkit data
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
const SKU_EMOJI: Record<string, string> = {
  "Staples": "🌾", "Dairy": "🥛", "Bakery": "🍞", "Pet Care": "🐾",
  "Home & Office": "🏠", "Cleaning": "🧹", "Personal Care": "🧴",
  "Baby Care": "👶", "Pharma": "💊", "Beverages": "🥤", "Munchies": "🍿",
};

function ProductCard({ sku, onAdd, inCart }: { sku: Sku; onAdd: (sku: Sku) => void; inCart: boolean }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-sm flex flex-col gap-xs shadow-[0px_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.08)] transition-shadow w-36 flex-shrink-0">
      <div className="w-full aspect-square bg-surface rounded-xl flex items-center justify-center text-3xl">
        {SKU_EMOJI[sku.l1_category] ?? "📦"}
      </div>
      <div>
        <p className="font-label-md text-label-md text-on-surface line-clamp-2">{sku.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="font-body-md text-body-md font-bold text-on-surface">₹{sku.price}</span>
          {sku.price < sku.original_price && (
            <span className="text-xs text-on-surface-variant line-through">₹{sku.original_price}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onAdd(sku)}
        disabled={!sku.in_stock}
        className={`w-full py-1.5 rounded-lg font-label-md text-label-md transition-all ${
          inCart
            ? "bg-secondary-container text-on-secondary-container border border-secondary-container"
            : sku.in_stock
            ? "bg-secondary hover:bg-[#005a12] text-on-secondary active:scale-95 shadow-sm"
            : "bg-surface-container text-on-surface-variant cursor-not-allowed"
        }`}
      >
        {inCart ? "✓ Added" : sku.in_stock ? "ADD" : "Out of Stock"}
      </button>
    </div>
  );
}

// ── Suggestion Card ───────────────────────────────────────────────────────────
function SuggestionCard({ sug, onAdd, inCart, showReason }: {
  sug: EnrichedSuggestion; onAdd: (skuId: string) => void; inCart: boolean; showReason: boolean;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-sm shadow-[0px_4px_12px_rgba(0,0,0,0.05)] relative overflow-hidden">
      <div className="absolute inset-0 bg-primary-container opacity-5 pointer-events-none"></div>
      <div className="flex items-start gap-2 relative z-10">
        <span className="text-xl mt-0.5">{SKU_EMOJI[sug.l1] ?? "📦"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-label-md text-label-md text-on-surface line-clamp-2">{sug.sku_name}</p>
          {/* EC-A9: Reason at full contrast, never de-emphasised */}
          {showReason && sug.fact_text && (
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">{sug.fact_text}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="font-body-md text-body-md font-bold text-on-surface">₹{sug.price}</span>
            <button
              onClick={() => onAdd(sug.sku_id)}
              className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all ${
                inCart
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-secondary hover:bg-[#005a12] text-on-secondary active:scale-95 shadow-sm"
              }`}
            >
              {inCart ? "✓" : "ADD"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Persona Panel ─────────────────────────────────────────────────────────────
function PersonaPanel({ personaKey, persona }: {
  personaKey: PersonaKey;
  persona: { orders_90_days: number; purchased_l1s: string[] };
}) {
  const neverPurchased = L1_CATEGORIES.filter(l1 => !persona.purchased_l1s.includes(l1));
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-sm text-on-primary-container"><span className="material-symbols-outlined text-[18px]">person</span></div>
        <div>
          <p className="font-label-md text-label-md text-on-surface">Demo Persona</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {personaKey === "user_segment_a_hero" ? "Segment A — Hero" : "Segment B — Suppression"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-container rounded-lg p-2 text-center">
          <p className="font-headline-sm text-headline-sm text-on-surface">{persona.orders_90_days}</p>
          <p className="font-label-md text-label-md text-on-surface-variant">orders (90d)</p>
        </div>
        <div className="bg-surface-container rounded-lg p-2 text-center">
          <p className="font-headline-sm text-headline-sm text-on-surface">{persona.purchased_l1s.length}</p>
          <p className="font-label-md text-label-md text-on-surface-variant">categories</p>
        </div>
      </div>
      <div>
        <p className="font-label-md text-label-md text-on-surface-variant uppercase mb-1.5">Buys from</p>
        <div className="flex flex-wrap gap-1">
          {persona.purchased_l1s.map(l1 => (
            <span key={l1} className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-xs rounded-full border border-secondary-fixed">{l1}</span>
          ))}
        </div>
      </div>
      <div>
        <p className="font-label-md text-label-md text-on-surface-variant uppercase mb-1.5">Never purchased</p>
        <div className="flex flex-wrap gap-1">
          {neverPurchased.map(l1 => (
            <span key={l1} className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-xs rounded-full">{l1}</span>
          ))}
        </div>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant italic">Add a product to see the Occasion Engine fire.</p>
    </div>
  );
}

// ── Discovery Rail ────────────────────────────────────────────────────────────
function DiscoveryRail({
  occasion, cartSkuIds, onAddSuggestion, isLoading, showReason,
}: {
  occasion: OccasionResult | null;
  lastAnchor: Sku | null;
  cartSkuIds: Set<string>;
  onAddSuggestion: (skuId: string) => void;
  onDismiss: () => void;
  personaKey: PersonaKey;
  persona: { orders_90_days: number; purchased_l1s: string[] };
  renderTimeMs: number | null;
  isLoading: boolean;
  showReason: boolean;
}) {
  if (!isLoading && !occasion) return null;

  return (
    <aside className="flex flex-col flex-1" aria-live="polite">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-2xl">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : occasion ? (
        <div className="p-gutter space-y-md animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">sparkles</span>
            <p className="font-headline-sm text-headline-sm text-on-surface font-bold">{occasion.headline}</p>
          </div>
          <div className="space-y-sm">
            {occasion.suggestions.map(sug => (
              <SuggestionCard key={sug.sku_id} sug={sug} onAdd={onAddSuggestion}
                inCart={cartSkuIds.has(sug.sku_id)} showReason={showReason} />
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

// ── P13-12: Full Metrics Panel ────────────────────────────────────────────────
function MetricsPanel({
  impressions, newL1Adds, dismissals, baseL1Count, currentL1Count,
  lastRenderMs, networkCalls, checkoutStarted, occasionStats,
}: {
  impressions: number;
  newL1Adds: number;
  dismissals: number;
  baseL1Count: number;
  currentL1Count: number;
  lastRenderMs: number | null;
  networkCalls: number;
  checkoutStarted: boolean;
  occasionStats: OccasionStats[];
}) {
  // P13-4 / P13-6: Unique new L1 count (deduplicated)
  const dismissalRate = impressions > 0 ? Math.round((dismissals / impressions) * 100) : 0;
  const addRate = impressions > 0 ? Math.round((newL1Adds / impressions) * 100) : 0;

  return (
    <div className="border-t border-neutral-100 flex-shrink-0">
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Session Metrics</p>
      </div>

      {/* P13-13: Categories N→N+1 — the most legible CER expression */}
      <div className="mx-4 mb-2 bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 text-center">
        <p className="text-base font-extrabold text-yellow-800">
          Categories: {baseL1Count} → {currentL1Count}
        </p>
        <p className="text-xs text-yellow-600">CER contribution this session</p>
      </div>

      {/* Core metrics grid */}
      <div className="px-4 pb-2 grid grid-cols-2 gap-2">
        <div className="text-center bg-neutral-50 rounded-lg p-2">
          <p className="text-lg font-bold text-neutral-800">{impressions}</p>
          <p className="text-xs text-neutral-500">Impressions</p>
          <p className="text-xs text-neutral-400">on render · EC-X7</p>
        </div>
        <div className="text-center bg-neutral-50 rounded-lg p-2">
          <p className="text-lg font-bold text-green-600">{newL1Adds}</p>
          <p className="text-xs text-neutral-500">New-L1 adds</p>
          <p className="text-xs text-neutral-400">unique per session</p>
        </div>
        <div className="text-center bg-neutral-50 rounded-lg p-2">
          <p className="text-lg font-bold text-neutral-700">{addRate}%</p>
          <p className="text-xs text-neutral-500">Add rate</p>
        </div>
        <div className="text-center bg-neutral-50 rounded-lg p-2">
          <p className="text-lg font-bold text-red-500">{dismissalRate}%</p>
          <p className="text-xs text-neutral-500">Dismissal rate</p>
        </div>
      </div>

      {/* P13-15/16: Render time + network calls */}
      <div className="px-4 pb-2 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-neutral-50 rounded-lg p-2">
          <p className={`font-bold font-mono ${lastRenderMs !== null && lastRenderMs < 300 ? "text-green-600" : lastRenderMs !== null ? "text-red-600" : "text-neutral-400"}`}>
            {lastRenderMs !== null ? `${lastRenderMs}ms` : "—"}
          </p>
          <p className="text-neutral-500">Sheet render</p>
          <p className="text-neutral-400">budget: 300ms R8</p>
        </div>
        <div className="bg-neutral-50 rounded-lg p-2">
          <p className="font-bold font-mono text-neutral-700">{networkCalls}</p>
          <p className="text-neutral-500">API calls</p>
          <p className="text-neutral-400">0=precomputed · DF-B</p>
        </div>
      </div>

      {/* P13-8: C60 scaffold */}
      <div className="px-4 pb-2">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-xs">
          <p className="font-semibold text-blue-700">C60 Scaffold</p>
          <p className="text-blue-600 mt-0.5">
            {newL1Adds > 0
              ? `${newL1Adds} new L1(s) added this session — C60 window starts on first real purchase.`
              : "No new categories yet. C60 window starts on first cross-L1 purchase."}
          </p>
        </div>
      </div>

      {/* P13-9: Per-occasion precision */}
      {occasionStats.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Occasion Precision</p>
          <div className="space-y-1">
            {occasionStats.map(stat => (
              <div key={stat.occasion_id} className="flex items-center justify-between bg-neutral-50 rounded-lg px-2 py-1.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-700 truncate">{stat.headline}</p>
                  <p className="text-xs text-neutral-400">{stat.impressions} impression{stat.impressions !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <p className={`text-xs font-bold ${stat.adds > 0 ? "text-green-600" : "text-neutral-400"}`}>
                    {stat.adds}/{stat.impressions}
                  </p>
                  <p className="text-xs text-neutral-400">adds</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── P13-14: Trigger Log ───────────────────────────────────────────────────────
function TriggerLog({ log }: { log: TriggerLogEntry[] }) {
  if (log.length === 0) return null;
  const OUTCOME_STYLE: Record<string, string> = {
    RENDERED: "bg-green-50 text-green-800",
    BLOCKED_SENSITIVE: "bg-red-50 text-red-800 font-bold",
    BLOCKED_FILTERED: "bg-orange-50 text-orange-800",
    BLOCKED_TIMEOUT: "bg-red-50 text-red-700",
    NO_OCCASION: "bg-neutral-50 text-neutral-500",
    DISMISSED: "bg-neutral-50 text-neutral-400",
  };
  return (
    <div className="border-t border-neutral-100 px-4 py-3 flex-shrink-0">
      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Trigger Log</p>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {[...log].reverse().map((entry, i) => (
          <div key={i} className={`text-xs rounded-lg p-2 font-mono ${OUTCOME_STYLE[entry.outcome] ?? "bg-neutral-50 text-neutral-500"}`}>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-bold">{entry.outcome}</span>
              {entry.rule && <span className="opacity-70">· {entry.rule}</span>}
              <span className="opacity-50">· {entry.anchor_l1}</span>
            </div>
            {entry.debug && <div className="mt-0.5 opacity-70 text-xs">{entry.debug}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Demo Page ────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [personaKey, setPersonaKey] = useState<PersonaKey>("user_segment_a_hero");
  const [cart, setCart] = useState<Sku[]>([]);
  const [activeL1, setActiveL1] = useState<string>("Staples");
  const [occasion, setOccasion] = useState<OccasionResult | null>(null);
  const [lastAnchor, setLastAnchor] = useState<Sku | null>(null);
  const [triggerLog, setTriggerLog] = useState<TriggerLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reasonVisible, setReasonVisible] = useState(true);
  // P13 metrics
  const [impressions, setImpressions] = useState(0);
  const [newL1Adds, setNewL1Adds] = useState(0);
  const [dismissals, setDismissals] = useState(0);  // P13-11
  const [networkCalls, setNetworkCalls] = useState(0);
  const [lastRenderMs, setLastRenderMs] = useState<number | null>(null);
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [occasionStats, setOccasionStats] = useState<OccasionStats[]>([]); // P13-9
  const [currentOccasionId, setCurrentOccasionId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persona = PERSONAS[personaKey];
  const baseL1Count = persona.purchased_l1s.length;
  const cartSkuIds = new Set(cart.map(s => s.sku_id));
  const earnedL1s = new Set([...persona.purchased_l1s, ...cart.map(s => s.l1_category)]);
  const uniqueNewL1sInCart = [...new Set(cart.map(s => s.l1_category).filter(l1 => !persona.purchased_l1s.includes(l1)))];
  const currentL1Count = baseL1Count + uniqueNewL1sInCart.length;
  const filteredSkus = ALL_SKUS.filter(s => s.l1_category === activeL1);

  const fireEngine = useCallback(async (newCart: Sku[]) => {
    if (newCart.length === 0) return;
    const anchor = newCart[newCart.length - 1];
    setLastAnchor(anchor);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setOccasion(null);
      const t0 = performance.now();

      try {
        const isMulti = newCart.length > 1;
        if (isMulti) setNetworkCalls(c => c + 1);

        const res = await fetch("/api/occasion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart: newCart, persona }),
        });

        const data: OccasionResult | null = await res.json();
        const elapsed = Math.round(performance.now() - t0);
        setLastRenderMs(elapsed);

        if (data && data.suggestions?.length > 0) {
          setOccasion(data);
          setCurrentOccasionId(data.occasion_id);
          // P13-1: Log impression ON RENDER, not on request (EC-X7)
          setImpressions(c => c + 1);
          // P13-9: Update per-occasion stats
          setOccasionStats(prev => {
            const existing = prev.find(s => s.occasion_id === data.occasion_id);
            if (existing) {
              return prev.map(s => s.occasion_id === data.occasion_id
                ? { ...s, impressions: s.impressions + 1 }
                : s);
            }
            return [...prev, { occasion_id: data.occasion_id, headline: data.headline, impressions: 1, adds: 0 }];
          });
          setTriggerLog(prev => [...prev, {
            ts: Date.now(), anchor_sku: anchor.sku_id, anchor_l1: anchor.l1_category,
            outcome: "RENDERED",
            rule: isMulti ? "live-inference" : "precomputed",
            debug: `${elapsed}ms · ${data.suggestions.length} suggestions · ${data.occasion_id}`,
          }]);
        } else {
          const isSensitive = anchor.l1_category.toLowerCase().includes("pharma") ||
            anchor.l1_category.toLowerCase().includes("baby");
          setCurrentOccasionId(null);
          setTriggerLog(prev => [...prev, {
            ts: Date.now(), anchor_sku: anchor.sku_id, anchor_l1: anchor.l1_category,
            outcome: isSensitive ? "BLOCKED_SENSITIVE" : "NO_OCCASION",
            rule: isSensitive ? "EC-S1 denylist — 0 inference requests made" : "no entry / all filtered (R1–R4)",
            debug: isSensitive ? "anchor: " + anchor.sku_id + " · denylist: SENSITIVE · → blocked before any model call" : `${elapsed}ms`,
          }]);
        }
      } catch {
        setCurrentOccasionId(null);
        setTriggerLog(prev => [...prev, {
          ts: Date.now(), anchor_sku: anchor.sku_id, anchor_l1: anchor.l1_category,
          outcome: "BLOCKED_TIMEOUT", rule: "R8 — 300ms budget blown",
        }]);
      } finally {
        setIsLoading(false);
      }
    }, 800); // EC-T3: 800ms debounce
  }, [persona]);

  // P13-3: Add to cart (with reversal support via remove)
  const handleAddToCart = useCallback((sku: Sku) => {
    if (cartSkuIds.has(sku.sku_id)) return;
    const isNewL1 = !earnedL1s.has(sku.l1_category);
    const newCart = [...cart, sku];
    setCart(newCart);
    // P13-2: new-L1 add rate; P13-6: count L1 once per order (unique)
    if (isNewL1) {
      setNewL1Adds(c => c + 1);
      // P13-9: Credit this add to the current occasion
      if (currentOccasionId) {
        setOccasionStats(prev => prev.map(s =>
          s.occasion_id === currentOccasionId ? { ...s, adds: s.adds + 1 } : s
        ));
      }
      // P13-8: C60 event scaffold
      recordC60(sku.l1_category);
    }
    fireEngine(newCart);
  }, [cart, cartSkuIds, earnedL1s, fireEngine, currentOccasionId]);

  // P13-3: Remove from cart (reverses CER metrics)
  const handleRemoveFromCart = useCallback((skuId: string) => {
    const sku = cart.find(s => s.sku_id === skuId);
    if (!sku) return;
    const newCart = cart.filter(s => s.sku_id !== skuId);
    setCart(newCart);
    // Reverse the new-L1 add if that L1 is now gone from cart
    const l1StillInCart = newCart.some(s => s.l1_category === sku.l1_category);
    const wasNewL1 = !persona.purchased_l1s.includes(sku.l1_category);
    if (wasNewL1 && !l1StillInCart) {
      // P13-3: EC-X1 reversal
      setNewL1Adds(c => Math.max(0, c - 1));
    }
    if (newCart.length === 0) setOccasion(null);
  }, [cart, persona.purchased_l1s]);

  const handleAddSuggestion = useCallback((skuId: string) => {
    const sku = ALL_SKUS.find(s => s.sku_id === skuId);
    if (!sku || cartSkuIds.has(skuId)) return;
    handleAddToCart(sku);
  }, [cartSkuIds, handleAddToCart]);

  // P13-11: Dismissal tracking
  const handleDismiss = useCallback(() => {
    setOccasion(null);
    setCurrentOccasionId(null);
    setDismissals(c => c + 1);
    setTriggerLog(prev => [...prev, {
      ts: Date.now(),
      anchor_sku: lastAnchor?.sku_id ?? "—",
      anchor_l1: lastAnchor?.l1_category ?? "—",
      outcome: "DISMISSED",
      rule: "user dismissed",
    }]);
  }, [lastAnchor]);

  const resetDemo = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCart([]); setOccasion(null); setLastAnchor(null); setTriggerLog([]);
    setImpressions(0); setNewL1Adds(0); setDismissals(0); setNetworkCalls(0);
    setLastRenderMs(null); setCheckoutStarted(false); setOccasionStats([]);
    setCurrentOccasionId(null);
    sessionStorage.removeItem("c60_events");
  };

  const switchPersona = (key: PersonaKey) => { setPersonaKey(key); resetDemo(); };

  const totalCartValue = cart.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="min-h-screen bg-surface flex flex-col font-inter">
      {/* Nav */}
      <header className="bg-surface-container-lowest border-b border-surface-container-high px-gutter py-sm flex items-center justify-between flex-shrink-0 z-10 h-[72px]">
        <div className="flex items-center gap-2 font-headline-md text-headline-md font-black text-primary">
          <span className="text-secondary text-2xl font-bold">blinkit</span>
        </div>
        
        {/* Cart */}
        <div className="flex items-center gap-1.5 font-label-lg text-label-lg font-bold text-on-surface bg-primary-container text-on-primary-container px-4 py-2 rounded-xl">
          <span className="material-symbols-outlined text-[20px]">shopping_cart</span> <span>{cart.length > 0 ? `₹${totalCartValue}` : "My Cart"}</span>
        </div>
      </header>

      {/* Body: main + rail */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-88px)]">
        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-surface-container-lowest">
          {/* Order Again */}
          <section className="border-b border-surface-container-highest px-gutter py-md">
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase mb-sm">Order Again</h2>
            <div className="flex gap-sm overflow-x-auto pb-1 scroll-hidden">
              {ALL_SKUS.filter(s => persona.purchased_l1s.includes(s.l1_category)).slice(0, 6).map(sku => (
                <ProductCard key={sku.sku_id} sku={sku} onAdd={handleAddToCart} inCart={cartSkuIds.has(sku.sku_id)} />
              ))}
            </div>
          </section>

          {/* Category tabs */}
          <div className="border-b border-surface-container-highest px-gutter py-2 flex gap-2 overflow-x-auto scroll-hidden">
            {L1_CATEGORIES.map(l1 => (
              <button key={l1} onClick={() => setActiveL1(l1)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full font-label-md text-label-md transition-colors ${
                  activeL1 === l1 ? "bg-inverse-surface text-inverse-on-surface" : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                }`}>
                {l1}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <section className="px-gutter py-lg">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-1">{activeL1}</h2>
            {/* P12-17: Sparse PDP note — no ratings visible */}
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-md italic">No ratings or reviews available.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-sm">
              {filteredSkus.map(sku => (
                <ProductCard key={sku.sku_id} sku={sku} onAdd={handleAddToCart} inCart={cartSkuIds.has(sku.sku_id)} />
              ))}
            </div>
          </section>

          {/* Removed original Cart summary to move it to the right rail */}

        {/* Right rail wrapper (Customer-facing Cart & Suggestions) */}
        <div className="w-80 lg:w-[400px] flex-shrink-0 h-full flex flex-col bg-surface-container-lowest border-l border-surface-container-high overflow-y-auto">
          
          {/* Consumer Cart summary */}
          <div className="px-gutter py-md border-b border-surface-container-highest bg-surface-container-lowest">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-sm">
              My Cart ({cart.length} items)
            </h2>
            {cart.length === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant">Your cart is empty.</p>
            ) : (
              <div className="space-y-sm mb-md">
                {cart.map(sku => (
                  <div key={sku.sku_id} className="flex items-center justify-between font-label-md text-label-md bg-surface-container rounded-lg px-3 py-2">
                    <span className="text-on-surface font-medium">{sku.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-on-surface-variant font-bold">₹{sku.price}</span>
                      <button onClick={() => handleRemoveFromCart(sku.sku_id)}
                        className="text-on-surface-variant hover:text-error transition-colors flex items-center">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cart.length > 0 && (
              <button
                onClick={() => setCheckoutStarted(true)}
                className="w-full py-md bg-secondary text-on-secondary font-label-lg text-label-lg font-bold rounded-xl hover:bg-[#005a12] transition-colors active:scale-95 shadow-sm flex items-center justify-between px-4"
              >
                <span>{checkoutStarted ? "Processing..." : `₹${totalCartValue}`}</span>
                <span>{checkoutStarted ? "✓" : "Proceed to Checkout >"}</span>
              </button>
            )}
          </div>

          <DiscoveryRail
            occasion={occasion}
            lastAnchor={lastAnchor}
            cartSkuIds={cartSkuIds}
            onAddSuggestion={handleAddSuggestion}
            onDismiss={handleDismiss}
            personaKey={personaKey}
            persona={persona}
            renderTimeMs={null}
            isLoading={isLoading}
            showReason={true}
          />
        </div>
      </div>
    </div>
  );
}
