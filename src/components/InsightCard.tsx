"use client";

import { useState } from "react";

export interface InsightData {
  insight_id: string;
  theme_id: string;
  title: string;
  description: string;
  confidence_score: number;
  document_ids: string[];
  quotes: string[];
  falsifier: string;
  answers_brief_question: number;
  is_competitor_only: boolean;
  source_entropy: number;
  rank_score: number;
}

export default function InsightCard({ insight }: { insight: InsightData }) {
  const [expanded, setExpanded] = useState(false);

  const lowConfidence = insight.confidence_score < 0.6;
  const lowEntropy = insight.source_entropy < 0.5;

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 mb-4 bg-white dark:bg-neutral-900 shadow-sm transition-all">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
          {insight.title}
        </h3>
        <div className="flex gap-2 flex-shrink-0 ml-4">
          {insight.is_competitor_only && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md">
              Competitor Only
            </span>
          )}
          {lowConfidence && (
            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-md">
              Low Confidence
            </span>
          )}
          {lowEntropy && (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md">
              Single Source
            </span>
          )}
        </div>
      </div>

      <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
        {insight.description}
      </p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
      >
        {expanded ? "Hide Evidence" : "View Evidence & Quotes"}
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Verbatim Quotes ({insight.quotes.length})
            </h4>
            <div className="space-y-2">
              {insight.quotes.map((q, i) => (
                <blockquote
                  key={i}
                  className="pl-3 border-l-2 border-blue-500 text-sm text-neutral-700 dark:text-neutral-300 italic"
                >
                  &quot;{q}&quot;
                </blockquote>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Falsifier
            </h4>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {insight.falsifier}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Cited Documents
            </h4>
            <div className="flex flex-wrap gap-1">
              {insight.document_ids.map((id) => (
                <span
                  key={id}
                  className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] rounded font-mono"
                  title={id}
                >
                  {id.substring(0, 8)}...
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
