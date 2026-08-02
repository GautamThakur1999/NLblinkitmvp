import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-8">
      <div className="max-w-xl text-center space-y-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-yellow-400 text-4xl">⚡</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Blinkit <span className="text-yellow-400">Occasion Engine</span>
          </h1>
        </div>
        <p className="text-neutral-400 text-base leading-relaxed">
          An AI-native feature that infers the occasion behind an add-to-cart event and surfaces
          1–2 items from a different category — each with the reason it matters.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-black bg-yellow-400 hover:bg-yellow-300 rounded-2xl transition-colors shadow-lg"
          >
            🛒 Launch Demo
          </Link>
          <Link
            href="/insights"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-white/10 hover:bg-white/20 rounded-2xl transition-colors border border-white/20"
          >
            📊 Insights Explorer
          </Link>
        </div>
        <p className="text-xs text-neutral-600">
          Blinkit AI Category Expansion · Part 4 MVP · Synthetic demo data
        </p>
      </div>
    </div>
  );
}
