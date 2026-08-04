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

type OccasionStats = {
  occasion_id: string;
  headline: string;
  impressions: number;
  adds: number;
};

type PersonaKey = "user_segment_a_hero" | "user_segment_b_suppression";
type Personas = typeof personasData.personas;

const ALL_SKUS = catalogueData.skus as Sku[];
const PERSONAS = personasData.personas as Personas;
const L1_CATEGORIES = [...new Set(ALL_SKUS.map(s => s.l1_category))].sort();

// Image mapping from the Stitch HTML
const SKU_IMAGES: Record<string, string> = {
  "sku_milk_01": "https://lh3.googleusercontent.com/aida-public/AB6AXuDKijgkh7dhMTV2PZq85N8I0lOWbMAg8Td9_xq8Elhqn4R9s0EvAmHOjtKo2nW0cDP75aNdVmllx1wOZ1HwK_lokucxrXUpsVybkhXPy2SfoRIH4f6ViO-HHbdq0L_l8N4vtE4RA1B_e6xqFK48z6ebwffCAgJi__X6-krIi1oq2jtNU0ltJMzYVPf5AcUfpT1rDpQ4k98aHOwnTqhUC-qBto1MKGtZqzxzbH7nlamz9nupaDfFWRgK",
  "sku_eggs_01": "https://lh3.googleusercontent.com/aida-public/AB6AXuC7YJawveG9eYf5j0x0oUFJ3NeE15gYibfJKaXcxqdusuo75ngTUI-emmf1IbFo3GEkDwG4ZHv4LfGXwX3Z6jeE1QLgqftsFnhHL3pcJ0zhLrg2kc_L10JYeo665Zf6AHuf3_gd61qZf5qeA6CJWDXGce3z6a5OdKsgSihtM4d_TLVbNcBL6oEgIoKq-G0cmyA9OSa7dglaTHM2mkDAH89Rt3fscVKU7NSoyQYIL2yGrgf3fGH9XRhf",
  "sku_paneer_01": "https://lh3.googleusercontent.com/aida-public/AB6AXuApWl5xKU_ThsFG0zHGBiL3Azxdpi4T2NthQaVoOeJ74oXeHTP7jb2pmdAuhjM4e1bYuMJqAK91lPTN5Wf-GzA3H8x-SCDqQRIEazjpSgBMtdwunBD_G-WT8ZJTYQZyMIqO-WsopxfP-deppcMyd89jDB-8WgQdwo53ni2IesD__Xf-PdHaJXpIwj6oNGnKbqpBZ_KRMBqnRDbtxDEyt5Exj5G9SuNqElA_bOdvY2KDSzkShaOEQpHH",
  "sku_bread_01": "https://lh3.googleusercontent.com/aida-public/AB6AXuCfph-ZBXsD8Vq8hv8wMR-QxTK5aODjWhJz357o5KJC9VA2NE8z1s7ofjejrqaZbv2WRnJI6M16Jn3SBD831Drbb0zREKNFcmsEh6E6ROiAcKJcYhd3FwG4m-ltk4eaVklFhCSaTUVOxl9vMjYdjwdpTaQz8abyrzo9YJvK--ShzRKGXWLfGWip-m2JASfHMgTwtdhNtgwcexoWvF9SBlmY7YSb_CWXk3GSG0dHHsBC607RgClnGZPE",
  "sku_cream_01": "https://lh3.googleusercontent.com/aida-public/AB6AXuBu5QgsXRFrVpnB-PsjHN376yxE4cacPkb2m-Mkllix0MyDem8QQTHIRy5Y48OwIcCuqXHQqy-eQOxoFXLxlIpeWuwxeGxbpRpIThg4e6cDdRLJ8tnV6bpvfkdY5suXVz37RA9UmvcHTmHKQjiIxOMxExo6nx20qiXeoaGYT5iG3-N9s9KLthXJU8XgNsQnlCh__g2lrpL-F3ZZp1MXgGMS3sRDy0EoziNvI2Gb3srE8dDRqn0spxYx",
  "sku_atta_01": "https://lh3.googleusercontent.com/aida-public/AB6AXuAiJFu5LODcxADiP256o-As4kcvC9unK8uk3R-ggywkRG2vd_Cf_F47r7wXnkqQYsvtozabmFSHHnjCKt13SGGAqhWWah7W64gl0ATyeuXvj_xvOW6Pk-ooHr6qrdOmg0si6jEZkxQz9XIt43Qk_yrAcn-TuvKRWnGrjSTtb1TWsDQ7fyFkr431JabvUVJfXpFEZ9gFaWizDF3k3TeTTp-32vz6LJxu7c2L0xYwNJBbh7NdEwPQ18mY",
  "sku_storage_jar_01": "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ6HmOjJ8yNUceoHKE1WMd1L6h9g_ll6Hl_DbDDq7WXae1e_aSDFXFYsT6_3nTsL_lbrgwPb9W3FZguenI2PSDUS9y3Zb67Ll8wK-d0B7Tq9ekV2SITdmZdlT08XNGm-2INiEuIne0nR4efJyrmhZwuqbNyovcm9jytcWBKrmhtqsAeP9IwIErNaQBDB-CFRfIQuynAktY31VpeWv2Duxj5Drg4UpuRMIUUlBKKgCOX52ggFcLSf_o",
  "sku_pest_strips_01": "https://lh3.googleusercontent.com/aida-public/AB6AXuApQajYklMDnRyWlvw63F6SCDbv_VYHnHmHujoXx8wRiqbUv7CwTv6uAkvUFNy4N87_xMikk5zmekDrcxH5Ga2F-QWeanLsBMPV-2GnUoOEDAtqPU0-nwbkjHdFWk2U99jgAk17hgW7b7N2RZBXBpPJuyqZz9ygUHDmVph_pdl8GZBktePXavJuUdq6w1vw_FP2gM3LREk2RUL8bv86EGKog63bxTIRUUDa2jKgpuGRMDGI7_Qe6l_M",
  "sku_dogfood_01": "https://placehold.co/400x400/f8cb46/333333?text=Dog+Food",
  "sku_absorber_01": "https://placehold.co/400x400/e2e2e2/333333?text=Moisture+Absorber",
  "sku_degreaser_01": "https://placehold.co/400x400/d2cfd0/333333?text=Degreaser",
  "sku_preg_test_01": "https://placehold.co/400x400/ffe08f/333333?text=Pregnancy+Test",
  "sku_pet_cleaner_01": "https://placehold.co/400x400/99f98f/333333?text=Pet+Cleaner",
  "sku_lint_roller_01": "https://placehold.co/400x400/f8cb46/333333?text=Lint+Roller",
  "sku_baby_cereal_01": "https://placehold.co/400x400/8ffb87/333333?text=Baby+Cereal",
  "sku_stain_remover_01": "https://placehold.co/400x400/e2e2e2/333333?text=Stain+Remover",
  "sku_oil_01": "https://placehold.co/400x400/d2cfd0/333333?text=Coconut+Oil",
  "sku_electrolyte_01": "https://placehold.co/400x400/ffe08f/333333?text=Electrolyte",
  "sku_glasses_01": "https://placehold.co/400x400/99f98f/333333?text=Disposable+Glasses",
  "sku_paracetamol_01": "https://placehold.co/400x400/f8cb46/333333?text=Paracetamol",
  "sku_egg_boiler_01": "https://placehold.co/400x400/8ffb87/333333?text=Egg+Boiler",
  "sku_egg_holder_01": "https://placehold.co/400x400/e2e2e2/333333?text=Egg+Holder",
  "sku_milk_frother_01": "https://placehold.co/400x400/d2cfd0/333333?text=Milk+Frother",
  "sku_lactase_01": "https://placehold.co/400x400/ffe08f/333333?text=Lactase",
  "sku_digestive_drops_01": "https://placehold.co/400x400/99f98f/333333?text=Digestive+Drops",
  "sku_kitchen_towel_01": "https://placehold.co/400x400/f8cb46/333333?text=Kitchen+Towel",
  "sku_sandwich_maker_01": "https://placehold.co/400x400/8ffb87/333333?text=Sandwich+Maker",
  "sku_butter_01": "https://placehold.co/400x400/e2e2e2/333333?text=Amul+Butter",
  "sku_jam_01": "https://placehold.co/400x400/d2cfd0/333333?text=Fruit+Jam",
  "sku_tandoori_marinade_01": "https://placehold.co/400x400/ffe08f/333333?text=Marinade",
  "sku_mint_chutney_01": "https://placehold.co/400x400/99f98f/333333?text=Mint+Chutney",
  "sku_ghee_01": "https://placehold.co/400x400/f8cb46/333333?text=Desi+Ghee",
  "sku_butter_dish_01": "https://placehold.co/400x400/8ffb87/333333?text=Butter+Dish",
  "sku_butter_knife_01": "https://placehold.co/400x400/e2e2e2/333333?text=Butter+Knife"
};

// Fallback logic if image is missing
const getSkuImage = (sku_id: string, l1_category: string) => {
  if (SKU_IMAGES[sku_id]) return `url('${SKU_IMAGES[sku_id]}')`;
  const colors = ["#f8cb46", "#8ffb87", "#e2e2e2", "#d2cfd0", "#ffe08f", "#99f98f"];
  const color = colors[l1_category.length % colors.length];
  return `linear-gradient(135deg, ${color}33, ${color}88)`;
};

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

export default function DemoPage() {
  const [personaKey, setPersonaKey] = useState<PersonaKey>("user_segment_a_hero");
  const persona = PERSONAS[personaKey];

  const switchPersona = (key: PersonaKey) => {
    setPersonaKey(key);
  };

  const [activeL1, setActiveL1] = useState<string>("Dairy & Breakfast");
  const filteredSkus = ALL_SKUS.filter(s => 
    activeL1 === "Dairy & Breakfast" ? (s.l1_category === "Dairy" || s.l1_category === "Bakery") : s.l1_category === activeL1
  );

  const [cart, setCart] = useState<Sku[]>([]);
  const cartSkuIds = new Set(cart.map(s => s.sku_id));

  // Occasion Engine State
  const [occasion, setOccasion] = useState<OccasionResult | null>(null);
  const [lastAnchor, setLastAnchor] = useState<Sku | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Metrics State
  const [impressions, setImpressions] = useState(0);
  const [newL1Adds, setNewL1Adds] = useState(0);
  const [dismissals, setDismissals] = useState(0);
  const [triggerLog, setTriggerLog] = useState<TriggerLogEntry[]>([]);
  const [lastRenderMs, setLastRenderMs] = useState<number | null>(null);
  const [networkCalls, setNetworkCalls] = useState(0);
  
  const [occasionStats, setOccasionStats] = useState<OccasionStats[]>([]);
  const [currentOccasionId, setCurrentOccasionId] = useState<string | null>(null);

  // Evaluator controls
  const [developerDrawerOpen, setDeveloperDrawerOpen] = useState(false);
  const [showReason, setShowReason] = useState(true);
  const [expandedDiscovery, setExpandedDiscovery] = useState(false);
  
  // Mobile UI controls
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Derived metrics
  const baseL1Count = persona.purchased_l1s.length;
  const earnedL1s = new Set(cart.filter(s => !persona.purchased_l1s.includes(s.l1_category)).map(s => s.l1_category));
  const currentL1Count = baseL1Count + earnedL1s.size;

  const renderedSuggestions = occasion ? occasion.suggestions.slice(0, expandedDiscovery ? occasion.suggestions.length : 2) : [];
  const suggestedL1s = new Set(renderedSuggestions.map(s => s.l1));
  const potentialNewL1s = new Set(
    Array.from(suggestedL1s).filter(l1 => !persona.purchased_l1s.includes(l1) && !earnedL1s.has(l1))
  );
  const projectedL1Count = currentL1Count + potentialNewL1s.size;

  const fireEngine = useCallback((newCart: Sku[]) => {
    if (newCart.length === 0) {
      setOccasion(null);
      setCurrentOccasionId(null);
      return;
    }
    const anchor = newCart[newCart.length - 1];
    setLastAnchor(anchor);
    setIsLoading(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const start = performance.now();
        
        // P13-16: Track API calls specifically
        setNetworkCalls(c => c + 1);

        const res = await fetch("/api/occasion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cart: newCart,
            persona: persona
          })
        });

        let occ = null;
        if (res.ok) {
          occ = await res.json();
        }
        
        const ms = Math.round(performance.now() - start);
        setLastRenderMs(ms);

        if (ms > 2000) {
          setTriggerLog(prev => [...prev, {
            ts: Date.now(), anchor_sku: anchor.sku_id, anchor_l1: anchor.l1_category,
            outcome: "BLOCKED_TIMEOUT", rule: "R8 — 300ms budget blown", debug: `${ms}ms`
          }]);
          setOccasion(null);
          setCurrentOccasionId(null);
          return;
        }

        if (!occ || occ.error) {
          setTriggerLog(prev => [...prev, {
            ts: Date.now(), anchor_sku: anchor.sku_id, anchor_l1: anchor.l1_category,
            outcome: "BLOCKED_FILTERED", rule: occ?.error || "Backend returned null"
          }]);
          setOccasion(null);
          setCurrentOccasionId(null);
          return;
        }

        // Filter out same-L1 and already purchased (INV-2, INV-3) client side safety check
        occ.suggestions = occ.suggestions.filter((s: EnrichedSuggestion) => 
          s.l1 !== anchor.l1_category && !persona.purchased_l1s.includes(s.l1)
        );

        if (occ.suggestions.length === 0) {
          setTriggerLog(prev => [...prev, {
            ts: Date.now(), anchor_sku: anchor.sku_id, anchor_l1: anchor.l1_category,
            outcome: "BLOCKED_FILTERED", rule: "All suggestions were same-L1 or already purchased"
          }]);
          setOccasion(null);
          setCurrentOccasionId(null);
          return;
        }

        setOccasion(occ);
        setCurrentOccasionId(occ.occasion_id);
        setImpressions(c => c + 1);
        setTriggerLog(prev => [...prev, {
          ts: Date.now(), anchor_sku: anchor.sku_id, anchor_l1: anchor.l1_category,
          outcome: "RENDERED", debug: `${ms}ms`
        }]);

        setOccasionStats(prev => {
          const existing = prev.find(s => s.occasion_id === occ.occasion_id);
          if (existing) {
            return prev.map(s => s.occasion_id === occ.occasion_id ? { ...s, impressions: s.impressions + 1 } : s);
          } else {
            return [...prev, { occasion_id: occ.occasion_id, headline: occ.headline, impressions: 1, adds: 0 }];
          }
        });

      } catch (err) {
        setTriggerLog(prev => [...prev, {
          ts: Date.now(), anchor_sku: anchor.sku_id, anchor_l1: anchor.l1_category,
          outcome: "BLOCKED_TIMEOUT", rule: "Network error",
        }]);
      } finally {
        setIsLoading(false);
      }
    }, 800);
  }, [persona, personaKey]);

  const handleAddToCart = useCallback((sku: Sku) => {
    if (cartSkuIds.has(sku.sku_id)) return;
    const isNewL1 = !earnedL1s.has(sku.l1_category) && !persona.purchased_l1s.includes(sku.l1_category);
    const newCart = [...cart, sku];
    setCart(newCart);

    if (isNewL1) {
      setNewL1Adds(c => c + 1);
      if (currentOccasionId) {
        setOccasionStats(prev => prev.map(s =>
          s.occasion_id === currentOccasionId ? { ...s, adds: s.adds + 1 } : s
        ));
      }
      recordC60(sku.l1_category);
    }
    fireEngine(newCart);
    setIsMobileCartOpen(true);
  }, [cart, cartSkuIds, earnedL1s, fireEngine, currentOccasionId, persona.purchased_l1s]);

  const handleRemoveFromCart = useCallback((skuId: string) => {
    const sku = cart.find(s => s.sku_id === skuId);
    if (!sku) return;
    const newCart = cart.filter(s => s.sku_id !== skuId);
    setCart(newCart);

    const l1StillInCart = newCart.some(s => s.l1_category === sku.l1_category);
    const wasNewL1 = !persona.purchased_l1s.includes(sku.l1_category);
    if (wasNewL1 && !l1StillInCart) {
      setNewL1Adds(c => Math.max(0, c - 1));
    }
    fireEngine(newCart);
  }, [cart, persona.purchased_l1s, fireEngine]);

  const handleAddSuggestion = useCallback((skuId: string) => {
    const sku = ALL_SKUS.find(s => s.sku_id === skuId);
    if (!sku || cartSkuIds.has(skuId)) return;
    handleAddToCart(sku);
  }, [cartSkuIds, handleAddToCart]);

  const resetDemo = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCart([]); setOccasion(null); setLastAnchor(null); setTriggerLog([]);
    setImpressions(0); setNewL1Adds(0); setDismissals(0); setNetworkCalls(0);
    setLastRenderMs(null); setOccasionStats([]);
    setCurrentOccasionId(null);
    sessionStorage.removeItem("c60_events");
  };

  const totalCartValue = cart.reduce((sum, s) => sum + s.price, 0);

  const DISPLAY_CATEGORIES = ["Staples", "Dairy & Breakfast", "Bakery", "Munchies", "Home & Office", "Cleaning", "Personal Care", "Baby Care", "Pet Care"];

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary-container min-h-screen flex flex-col relative overflow-hidden">
      
      {/* Top Bar (PantryUtility) */}
      <header className="h-[72px] w-full sticky top-0 z-40 bg-surface border-b border-surface-variant flex items-center justify-between px-gutter max-w-full mx-auto">
        <div className="flex items-center gap-stack_loose">
          <h1 className="font-h2 text-h2 text-primary tracking-tighter">Blinkit</h1>
          <div className="hidden lg:flex flex-col ml-4">
            <span className="font-label-semibold text-label-semibold text-on-surface">Deliver to Home</span>
            <div className="flex items-center gap-1">
              <span className="text-small font-small text-on-surface-variant truncate max-w-[140px]">Sector 52, Gurugram</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:block flex-1 max-w-2xl px-stack_loose">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input className="w-full h-10 pl-10 pr-4 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-container text-body font-body" placeholder="Search for atta, milk, eggs..." type="text" />
          </div>
        </div>
        
        <div className="flex items-center gap-stack_loose">
          <div className="hidden md:flex flex-col items-end">
            <span className="font-label-semibold text-label-semibold text-secondary">8 minutes</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Fast Delivery</span>
          </div>
          <button onClick={() => setIsMobileCartOpen(prev => !prev)} className="bg-primary-container text-on-primary-container px-4 py-2.5 rounded-lg flex items-center gap-3 hover:bg-opacity-90 transition-all active:scale-95">
            <span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
            <div className="flex flex-col items-start leading-tight">
              <span className="font-label-semibold text-label-semibold">{cart.length} items</span>
              <span className="text-[10px] font-bold">₹{totalCartValue}</span>
            </div>
          </button>
        </div>
      </header>

      {/* Demo Banner */}
      <div className="w-full bg-primary-fixed/30 py-1.5 border-b border-outline-variant/30 text-center flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-on-primary-fixed-variant">warning</span>
        <span className="text-[11px] font-label-semibold text-on-primary-fixed-variant tracking-wide">DEMO DATA — synthetic catalogue · not real Blinkit data</span>
      </div>

      {/* Main Content */}
      <main className="max-w-[1280px] mx-auto flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-100px)] w-full">
        
        {/* Left Column (Main Shopping) */}
        <section className="flex-1 p-gutter lg:border-r border-surface-variant overflow-y-auto pb-[60vh] lg:pb-24 hide-scrollbar">
          
          {/* Order Again */}
          <div className="mb-stack_loose">
            <div className="flex justify-between items-center mb-stack_base">
              <h2 className="font-h2 text-h2">ORDER AGAIN</h2>
              <button className="text-primary font-label-semibold text-label-semibold flex items-center hover:underline">
                View All <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
            
            <div className="flex gap-stack_base overflow-x-auto hide-scrollbar pb-2">
              {ALL_SKUS.filter(s => persona.purchased_l1s.includes(s.l1_category)).slice(0, 6).map(sku => {
                const img = getSkuImage(sku.sku_id, sku.l1_category);
                const inCart = cartSkuIds.has(sku.sku_id);
                return (
                  <div key={sku.sku_id} className="min-w-[140px] flex-shrink-0 bg-surface-container-lowest border border-outline-variant rounded-lg p-2 hover:shadow-sm transition-shadow">
                    <div className="w-full aspect-square bg-surface-container-low rounded-md mb-2 bg-cover bg-center" style={{ backgroundImage: img }}></div>
                    <span className="text-[12px] font-semibold block leading-tight truncate">{sku.name.replace(/ \d+(kg|L|g|ml|pcs)$/, '')}</span>
                    <span className="text-[10px] text-on-surface-variant block mb-2">{sku.name.match(/\d+(kg|L|g|ml|pcs)$/)?.[0] || '1 pc'}</span>
                    <div className="flex justify-between items-center">
                      <span className="text-label-semibold font-label-semibold">₹{sku.price}</span>
                      {inCart ? (
                        <div className="flex items-center gap-1 border border-secondary rounded overflow-hidden">
                          <button onClick={() => handleRemoveFromCart(sku.sku_id)} className="px-1 text-secondary hover:bg-secondary-container">-</button>
                          <span className="text-[10px] font-bold text-on-surface">1</span>
                          <button className="px-1 text-secondary hover:bg-secondary-container">+</button>
                        </div>
                      ) : (
                        <button onClick={() => handleAddToCart(sku)} className="w-7 h-7 bg-white border border-secondary text-secondary rounded-md flex items-center justify-center hover:bg-secondary-container transition-colors">
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Tabs */}
          <nav className="flex gap-2 overflow-x-auto hide-scrollbar mb-stack_loose sticky top-[0px] bg-background py-2 z-30 border-b border-surface-variant">
            {DISPLAY_CATEGORIES.map(l1 => (
              <button 
                key={l1}
                onClick={() => setActiveL1(l1)}
                className={`px-4 py-1.5 rounded-full font-label-semibold text-label-semibold whitespace-nowrap transition-colors ${
                  activeL1 === l1 ? "bg-on-surface text-surface" : "bg-surface-container-high text-on-surface-variant hover:bg-outline-variant"
                }`}
              >
                {l1}
              </button>
            ))}
          </nav>

          {/* Product Grid */}
          <div className="mb-stack_loose">
            <div className="mb-stack_base flex flex-col">
              <h2 className="font-h2 text-h2">{activeL1}</h2>
              <span className="text-small font-small italic text-on-surface-variant">No ratings or reviews available.</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-stack_base">
              {filteredSkus.map(sku => {
                const img = getSkuImage(sku.sku_id, sku.l1_category);
                const inCart = cartSkuIds.has(sku.sku_id);
                return (
                  <div key={sku.sku_id} className="group bg-surface-container-lowest border border-outline-variant rounded-xl p-3 flex flex-col h-full hover:shadow-lg transition-all duration-300">
                    <div className="w-full aspect-square bg-surface-container-low rounded-lg mb-3 overflow-hidden">
                      <div className="w-full h-full bg-cover bg-center transition-transform group-hover:scale-105" style={{ backgroundImage: img }}></div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <span className="font-body text-body text-on-surface line-clamp-2 leading-tight mb-1">{sku.name.replace(/ \d+(kg|L|g|ml|pcs)$/, '')}</span>
                      <span className="text-small font-small text-on-surface-variant mb-3">{sku.name.match(/\d+(kg|L|g|ml|pcs)$/)?.[0] || '1 pc'}</span>
                      <div className="mt-auto flex items-end justify-between">
                        <div className="flex flex-col">
                          {sku.original_price > sku.price && <span className="text-on-surface-variant line-through text-[11px]">₹{sku.original_price}</span>}
                          <span className="text-body font-label-semibold">₹{sku.price}</span>
                        </div>
                        {inCart ? (
                           <div className="flex items-center gap-1 border border-secondary rounded overflow-hidden">
                             <button onClick={() => handleRemoveFromCart(sku.sku_id)} className="px-2 py-0.5 text-secondary hover:bg-secondary-container">-</button>
                             <span className="px-1 text-[12px] font-bold text-on-surface">1</span>
                             <button className="px-2 py-0.5 text-secondary hover:bg-secondary-container">+</button>
                           </div>
                        ) : (
                          <button onClick={() => handleAddToCart(sku)} className="bg-secondary text-on-secondary px-3 py-1 rounded-lg text-label-semibold hover:brightness-110 active:scale-95 transition-all">ADD</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </section>

        {/* Right Rail (Cart + Occasion) - Bottom Sheet on Mobile */}
        <aside className={`fixed bottom-0 left-0 w-full h-auto max-h-[70vh] z-50 flex flex-col bg-surface-container-lowest shadow-[0_-4px_24px_rgba(0,0,0,0.15)] rounded-t-2xl border-t border-surface-variant lg:static lg:sticky lg:right-0 lg:top-[100px] lg:w-[320px] lg:h-[calc(100vh-100px)] lg:max-h-none lg:border-t-0 lg:border-l lg:rounded-none lg:shadow-none lg:pb-10 transition-transform duration-300 ${isMobileCartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"}`}>
          {/* Mobile Handle */}
          <div className="w-full flex justify-center py-2 lg:hidden flex-shrink-0 cursor-pointer" onClick={() => setIsMobileCartOpen(false)}>
            <div className="w-12 h-1.5 bg-on-surface-variant/20 rounded-full"></div>
          </div>
          
          {/* Top Half: My Basket */}
          <section className="flex flex-col flex-shrink-0 max-h-[30vh] lg:max-h-[50%] min-h-[30%] border-b border-surface-variant overflow-hidden">
            <div className="p-stack_loose pb-2 border-b border-surface-variant flex-shrink-0">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-h2 text-h2">My Basket</h2>
                <span className="font-label-semibold text-label-semibold bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">{cart.length} items</span>
              </div>
              {cart.length > 0 && (
                <div className="flex items-center gap-2 bg-secondary-container/30 px-3 py-2 rounded-lg mb-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">timer</span>
                  <span className="text-label-semibold font-label-semibold text-on-secondary-fixed-variant">Delivery in 8 mins</span>
                </div>
              )}
            </div>
            
            {cart.length === 0 ? (
              <div className="flex-grow flex items-center justify-center px-stack_loose py-4">
                <p className="font-body text-body text-on-surface-variant text-center opacity-80">Your cart is empty.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto hide-scrollbar p-stack_loose flex flex-col gap-4">
                {cart.map(sku => (
                  <div key={sku.sku_id} className="flex gap-3">
                    <div className="w-12 h-12 bg-surface-container-low rounded border border-outline-variant bg-cover bg-center" style={{ backgroundImage: getSkuImage(sku.sku_id, sku.l1_category) }}></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-[13px] font-semibold leading-tight">{sku.name.replace(/ \d+(kg|L|g|ml|pcs)$/, '')}</span>
                        <span className="text-[13px] font-semibold">₹{sku.price}</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant">{sku.name.match(/\d+(kg|L|g|ml|pcs)$/)?.[0] || '1 pc'}</span>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center border border-secondary rounded overflow-hidden">
                          <button onClick={() => handleRemoveFromCart(sku.sku_id)} className="px-2 py-0.5 text-secondary hover:bg-secondary-container">-</button>
                          <span className="px-2 py-0.5 text-[12px] font-bold text-on-surface">1</span>
                          <button className="px-2 py-0.5 text-secondary hover:bg-secondary-container">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </section>

          {/* Bottom Half: Persona OR Occasion */}
          <section className={`flex flex-col flex-1 min-h-0 overflow-y-auto hide-scrollbar ${occasion ? "bg-[#fffdf5] p-stack_loose" : "bg-surface-container-lowest p-stack_loose"}`}>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-full py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : occasion ? (
              <div className="border-2 border-[#f8cb46]/30 rounded-xl p-4 bg-white shadow-sm relative">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[#755b00] text-[20px]">auto_awesome</span>
                  <h3 className="font-h2 text-[20px] font-semibold text-on-surface leading-tight">{occasion.headline}</h3>
                </div>
                <div className="flex flex-col gap-4">
                  {occasion.suggestions.slice(0,2).map(sug => {
                    const img = getSkuImage(sug.sku_id, sug.l1);
                    const isAdded = cartSkuIds.has(sug.sku_id);
                    return (
                      <div key={sug.sku_id} className="flex gap-3 border-b border-surface-variant pb-4 last:border-0 last:pb-0">
                        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-surface-variant bg-cover bg-center" style={{ backgroundImage: img }}></div>
                        <div className="flex flex-col flex-grow">
                          <div className="font-bold text-small text-on-surface mb-1">{sug.sku_name}</div>
                          {showReason && <div className="text-small text-on-surface font-normal mb-2">{sug.fact_text}</div>}
                          <div className="mt-auto flex items-center justify-between">
                            <span className="font-bold text-on-surface">₹{sug.price}</span>
                            {isAdded ? (
                               <div className="flex items-center gap-1 border border-secondary rounded overflow-hidden">
                                 <button onClick={() => handleRemoveFromCart(sug.sku_id)} className="px-2 py-0.5 text-secondary hover:bg-secondary-container">-</button>
                                 <span className="px-1 text-[12px] font-bold text-on-surface">1</span>
                                 <button className="px-2 py-0.5 text-secondary hover:bg-secondary-container">+</button>
                               </div>
                            ) : (
                              <button onClick={() => handleAddSuggestion(sug.sku_id)} className="bg-secondary text-on-secondary px-3 py-1 rounded-full text-label-semibold uppercase tracking-wider">Add</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {occasion.suggestions.length > 2 && (
                  <div className="mt-6 text-center">
                    <button onClick={() => setExpandedDiscovery(true)} className="text-on-surface-variant text-small flex items-center justify-center gap-1 w-full hover:text-on-surface">
                      More for this <span className="material-symbols-outlined text-[16px]">expand_more</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Default Persona Panel matching Stitch Shopping Panel
              <div className="hidden lg:flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="font-label-semibold text-[13px] tracking-wider uppercase text-on-surface">Your Shopping</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-surface-container rounded-xl p-3">
                    <div className="font-h1 text-h1 text-on-surface">{persona.orders_90_days}</div>
                    <div className="text-label-semibold text-on-surface-variant mt-1">orders (90 days)</div>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3">
                    <div className="font-h1 text-h1 text-on-surface">{persona.purchased_l1s.length}</div>
                    <div className="text-label-semibold text-on-surface-variant mt-1">categories</div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-label-semibold tracking-wider uppercase text-on-surface-variant mb-3">You Buy From</div>
                  <div className="flex flex-wrap gap-2">
                    {persona.purchased_l1s.map(l1 => (
                      <span key={l1} className="px-3 py-1 bg-secondary-container/20 text-on-secondary-container text-label-semibold rounded-full border border-secondary-fixed-dim/50">{l1}</span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-label-semibold tracking-wider uppercase text-on-surface-variant mb-3">Not Tried Yet</div>
                  <div className="flex flex-wrap gap-2">
                    {L1_CATEGORIES.filter(l1 => !persona.purchased_l1s.includes(l1)).map(l1 => (
                      <span key={l1} className="px-3 py-1 bg-surface-container text-on-surface-variant text-label-semibold rounded-full border border-surface-variant">{l1}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Proceed to Checkout (Fixed at bottom) */}
          <div className="p-stack_loose bg-surface-container-low border-t border-surface-variant flex-shrink-0 mt-auto">
            <button className="w-full bg-secondary text-on-secondary py-3 rounded-xl font-label-semibold text-body flex items-center justify-between px-4 hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-secondary/20">
              <span>₹{totalCartValue} · Proceed to Checkout</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </aside>

      </main>

      {/* Expanded Discovery Panel Overlay */}
      {expandedDiscovery && occasion && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <header className="h-[72px] w-full bg-surface border-b border-surface-variant flex items-center justify-between px-gutter">
            <div className="flex items-center gap-stack_loose">
              <h1 className="font-h2 text-h2 text-primary tracking-tighter">Blinkit</h1>
              <nav className="flex gap-4">
                <span className="text-small font-bold text-on-surface border-b-2 border-primary py-1">Shop</span>
                <span className="text-small text-on-surface-variant py-1">Search</span>
                <span className="text-small text-on-surface-variant py-1">Orders</span>
              </nav>
            </div>
            <button className="p-2"><span className="material-symbols-outlined text-primary">shopping_cart</span></button>
          </header>
          
          <div className="flex flex-1 max-w-[1280px] w-full mx-auto">
            <main className="flex-1 p-gutter overflow-y-auto pr-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-h1 text-[40px] font-bold text-on-surface leading-tight">{occasion.headline}</h1>
                <button onClick={() => setExpandedDiscovery(false)} className="p-2 hover:bg-surface-container rounded-full"><span className="material-symbols-outlined">close</span></button>
              </div>
              
              <div className="bg-primary-fixed/10 border border-primary-container rounded-lg p-4 mb-8 text-primary font-body">
                AI-Assisted {occasion.headline} Checklist
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                {occasion.suggestions.map(sug => {
                  const img = getSkuImage(sug.sku_id, sug.l1);
                  const isAdded = cartSkuIds.has(sug.sku_id);
                  return (
                    <div key={sug.sku_id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col h-full shadow-sm">
                      <div className="w-full aspect-square rounded-lg mb-4 bg-cover bg-center bg-surface-container-low" style={{ backgroundImage: img }}></div>
                      <h3 className="font-bold text-body text-on-surface mb-1">{sug.sku_name}</h3>
                      {showReason && <p className="text-small text-on-surface-variant mb-4 flex-grow">{sug.fact_text}</p>}
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-body text-body text-on-surface">₹{sug.price}</span>
                        {isAdded ? (
                            <div className="flex items-center gap-2 border border-secondary rounded overflow-hidden">
                              <button onClick={() => handleRemoveFromCart(sug.sku_id)} className="px-3 py-1 text-secondary hover:bg-secondary-container">-</button>
                              <span className="px-2 font-bold text-on-surface">1</span>
                              <button className="px-3 py-1 text-secondary hover:bg-secondary-container">+</button>
                            </div>
                        ) : (
                          <button onClick={() => handleAddSuggestion(sug.sku_id)} className="bg-secondary text-on-secondary px-6 py-2 rounded-full font-label-semibold tracking-wider">ADD</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-12 bg-surface-container-low rounded-xl p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-outline-variant"><span className="material-symbols-outlined text-primary">verified</span></div>
                  <div>
                    <div className="text-body font-semibold">Genuine brands</div>
                    <div className="text-small text-on-surface-variant">Sourced from authorised distributors</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-outline-variant"><span className="material-symbols-outlined text-primary">fact_check</span></div>
                  <div>
                    <div className="text-body font-semibold">Quality checked</div>
                    <div className="text-small text-on-surface-variant">Every item verified before dispatch</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-outline-variant"><span className="material-symbols-outlined text-primary">schedule</span></div>
                  <div>
                    <div className="text-body font-semibold">10-minute delivery</div>
                    <div className="text-small text-on-surface-variant">Same speed as the rest of your order</div>
                  </div>
                </div>
              </div>
            </main>
            
            <aside className="w-[320px] pt-8 pl-8 border-l border-surface-variant flex flex-col">
              <div className="mb-8">
                <h2 className="font-h2 text-h2 text-primary mb-1">Deliver to Home</h2>
                <div className="text-small text-on-surface-variant">15-20 mins</div>
              </div>
              <div className="text-small text-on-surface-variant italic mb-8">
                {cart.length === 0 ? "Your cart is empty. Add items to secure your pantry." : `${cart.length} items ready for delivery.`}
              </div>
              
              <nav className="flex flex-col gap-2 mb-12">
                <button className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-surface-container-low text-on-surface-variant"><span className="material-symbols-outlined">home</span> <span className="font-body">Home</span></button>
                <button className="flex items-center gap-4 py-3 px-4 rounded-lg bg-primary-container text-on-primary-container font-bold"><span className="material-symbols-outlined">kitchen</span> <span className="font-body">Pantry</span></button>
                <button className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-surface-container-low text-on-surface-variant"><span className="material-symbols-outlined">history</span> <span className="font-body">Reorder</span></button>
                <button className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-surface-container-low text-on-surface-variant"><span className="material-symbols-outlined">sell</span> <span className="font-body">Deals</span></button>
                <button className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-surface-container-low text-on-surface-variant"><span className="material-symbols-outlined">settings</span> <span className="font-body">Settings</span></button>
              </nav>
              
              <button onClick={() => setExpandedDiscovery(false)} className="w-full bg-primary-container text-on-primary-container py-3 rounded-lg font-label-semibold">View Cart</button>
            </aside>
          </div>
        </div>
      )}

      {/* Developer Drawer (Bottom overlay replacing left rail metrics) */}
      <div className={`fixed bottom-0 left-0 w-full bg-[#1b1c1b] text-white transition-all duration-300 z-50 flex flex-col border-t border-surface-variant/30 ${developerDrawerOpen ? "h-64" : "h-12"}`}>
        {/* Drawer Header / Bar */}
        <div className="h-12 flex items-center justify-between px-gutter cursor-pointer" onClick={() => setDeveloperDrawerOpen(!developerDrawerOpen)}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#f8cb46]">terminal</span>
            <span className="font-label-semibold tracking-wider text-white">ENGINE</span>
          </div>
          
          {/* Quick Stats on collapsed bar */}
          {!developerDrawerOpen && (
            <div className="flex items-center gap-6 text-small text-gray-400">
              {lastRenderMs !== null && <span>{lastRenderMs}ms</span>}
              <span>Categories: {baseL1Count} → {currentL1Count}</span>
              <span className="material-symbols-outlined text-[18px]">expand_less</span>
            </div>
          )}
          
          {/* Controls visible when open */}
          {developerDrawerOpen && (
            <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                <button onClick={() => switchPersona("user_segment_a_hero")} className={`px-3 py-1 rounded text-small ${personaKey === "user_segment_a_hero" ? "bg-white text-black" : "text-gray-400"}`}>Default</button>
                <button onClick={() => switchPersona("user_segment_b_suppression")} className={`px-3 py-1 rounded text-small ${personaKey === "user_segment_b_suppression" ? "bg-white text-black" : "text-gray-400"}`}>New User</button>
              </div>
              <label className="flex items-center gap-2 text-small text-gray-400 cursor-pointer">
                Show reasons
                <div className={`w-8 h-4 rounded-full relative transition-colors ${showReason ? "bg-secondary" : "bg-gray-600"}`}>
                  <div className="absolute top-0.5 right-0.5"><input type="checkbox" className="sr-only" checked={showReason} onChange={() => setShowReason(!showReason)} /></div>
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${showReason ? "left-4.5" : "left-0.5"}`}></div>
                </div>
              </label>
              <button onClick={resetDemo} className="text-gray-400 hover:text-white transition-colors"><span className="material-symbols-outlined">refresh</span></button>
              <span className="material-symbols-outlined text-[18px] text-gray-400 cursor-pointer" onClick={() => setDeveloperDrawerOpen(false)}>expand_more</span>
            </div>
          )}
        </div>
        
        {/* Drawer Content */}
        {developerDrawerOpen && (
          <div className="flex-1 flex p-gutter gap-12 overflow-y-auto hide-scrollbar">
            {/* Column 1: C60 & Conversions */}
            <div className="flex flex-col gap-6 w-[280px] flex-shrink-0">
              <div>
                <div className="font-h2 text-[24px] font-bold text-white mb-1 flex items-baseline gap-2">
                  Categories {currentL1Count} <span className="material-symbols-outlined text-[20px] text-gray-400">arrow_forward</span> {projectedL1Count}
                </div>
                <div className="text-[10px] text-[#f8cb46] tracking-wider uppercase font-semibold">New Category Adoption this Session</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-bold text-[18px] text-white">{impressions}</div>
                  <div className="text-[10px] text-gray-500">Impressions</div>
                </div>
                <div>
                  <div className="font-bold text-[18px] text-white">{newL1Adds}</div>
                  <div className="text-[10px] text-gray-500">New-category adds</div>
                </div>
                <div>
                  <div className="font-bold text-[18px] text-white">{impressions > 0 ? Math.round((newL1Adds / impressions) * 100) : 0}%</div>
                  <div className="text-[10px] text-gray-500">Add rate</div>
                </div>
                <div>
                  <div className="font-bold text-[18px] text-white">{impressions > 0 ? Math.round((dismissals / impressions) * 100) : 0}%</div>
                  <div className="text-[10px] text-gray-500">Dismissal rate</div>
                </div>
              </div>
            </div>
            
            {/* Column 2: Performance */}
            <div className="flex flex-col gap-6 w-[200px] flex-shrink-0">
              <div>
                <div className={`font-h2 text-[24px] font-bold mb-1 ${lastRenderMs && lastRenderMs > 300 ? "text-[#ba1a1a]" : "text-[#8ffb87]"}`}>
                  {lastRenderMs !== null ? `${lastRenderMs}ms` : "—"}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Render · 300ms Budget</div>
              </div>
              <div>
                <div className="font-h2 text-[24px] font-bold text-white mb-1">{networkCalls}</div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">API Calls · 0 = Precomputed</div>
              </div>
            </div>
            
            {/* Column 3: Trigger Log */}
            <div className="flex-1 min-w-0 border-l border-gray-800 pl-8">
              <div className="space-y-3">
                {[...triggerLog].reverse().slice(0, 4).map((entry, i) => {
                  let badgeColor = "bg-gray-800 text-gray-400";
                  if (entry.outcome === "RENDERED") badgeColor = "bg-[#006e16]/20 text-[#8ffb87]";
                  if (entry.outcome === "BLOCKED_SENSITIVE") badgeColor = "bg-[#ba1a1a]/20 text-[#ffdad6]";
                  if (entry.outcome === "BLOCKED_FILTERED" || entry.outcome === "BLOCKED_TIMEOUT") badgeColor = "bg-[#f8cb46]/20 text-[#ffe08f]";
                  
                  return (
                    <div key={i} className="flex items-center gap-3 font-mono text-[11px]">
                      <span className={`px-2 py-0.5 rounded ${badgeColor} font-bold`}>{entry.outcome}</span>
                      <span className="text-white truncate">
                        {entry.outcome === "RENDERED" ? `${entry.anchor_l1.toLowerCase()} · ${entry.debug} · suggestions generated` :
                         entry.outcome === "NO_OCCASION" ? `${entry.rule || "no rules matched"}` :
                         entry.rule}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
