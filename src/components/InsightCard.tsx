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
    <div className="border border-surface-container-high rounded-xl p-md mb-md bg-surface-container-lowest shadow-[0px_4px_12px_rgba(0,0,0,0.05)] transition-all">
      <div className="flex justify-between items-start mb-sm">
        <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight">
          {insight.title}
        </h3>
        <div className="flex gap-2 flex-shrink-0 ml-md">
          {insight.is_competitor_only && (
            <span className="px-2 py-1 font-label-md text-label-md bg-error-container text-on-error-container rounded-md">
              Competitor Only
            </span>
          )}
          {lowConfidence && (
            <span className="px-2 py-1 font-label-md text-label-md bg-primary-container text-on-primary-container rounded-md">
              Low Confidence
            </span>
          )}
          {lowEntropy && (
            <span className="px-2 py-1 font-label-md text-label-md bg-primary-container text-on-primary-container rounded-md">
              Single Source
            </span>
          )}
        </div>
      </div>

      <p className="text-on-surface-variant font-body-sm text-body-sm mb-md">
        {insight.description}
      </p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="font-label-md text-label-md text-primary hover:underline focus:outline-none"
      >
        {expanded ? "Hide Evidence" : "View Evidence & Quotes"}
      </button>

      {expanded && (
        <div className="mt-md pt-md border-t border-surface-container-high space-y-md">
          <div>
            <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
              Verbatim Quotes ({insight.quotes.length})
            </h4>
            <div className="space-y-2">
              {insight.quotes.map((q, i) => (
                <blockquote
                  key={i}
                  className="pl-3 border-l-2 border-primary font-body-sm text-body-sm text-on-surface-variant italic"
                >
                  &quot;{q}&quot;
                </blockquote>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Falsifier
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface">
              {insight.falsifier}
            </p>
          </div>

          <div>
            <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Cited Documents
            </h4>
            <div className="flex flex-wrap gap-1">
              {insight.document_ids.map((id) => (
                <span
                  key={id}
                  className="px-1.5 py-0.5 bg-surface-container text-on-surface-variant text-[10px] rounded font-mono"
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
