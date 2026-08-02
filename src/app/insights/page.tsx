import InsightCard, { InsightData } from "@/components/InsightCard";
import insightsData from "@data/processed/insights.json";

// Mapping of brief question numbers to their actual text
const BRIEF_QUESTIONS: Record<number, string> = {
  1: "Why do users repeatedly buy from the same categories?",
  2: "What prevents users from exploring new categories?",
  3: "How do users discover products today?",
  4: "What role do habits play in shopping behaviour?",
  5: "What information do users need before trying a new category?",
  6: "What frustrations emerge repeatedly?",
  7: "Which user segments are more likely to experiment?",
  8: "What unmet needs emerge consistently across discussions?",
};


export default function InsightsExplorerPage() {
  const insights = insightsData as InsightData[];

  // Group insights by brief question
  const groupedInsights: Record<number, InsightData[]> = {};
  insights.forEach((insight) => {
    const q = insight.answers_brief_question || 8; // fallback to 8
    if (!groupedInsights[q]) groupedInsights[q] = [];
    groupedInsights[q].push(insight);
  });

  if (insights.length === 0) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-medium text-neutral-600 dark:text-neutral-400">
          No insights found.
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Run the engine pipeline (Phase 5) to generate insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
          8-Question View
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Direct mapping of generated insights to the core brief questions.
        </p>
      </div>

      <div className="space-y-16">
        {Object.entries(BRIEF_QUESTIONS).map(([qNumStr, qText]) => {
          const qNum = parseInt(qNumStr);
          const qInsights = groupedInsights[qNum] || [];

          if (qInsights.length === 0) return null;

          return (
            <section key={qNum} className="scroll-mt-20" id={`q${qNum}`}>
              <div className="mb-6">
                <span className="text-yellow-600 dark:text-yellow-500 font-bold text-sm tracking-widest uppercase mb-1 block">
                  Question {qNum}
                </span>
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {qText}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {qInsights.map((insight) => (
                  <InsightCard key={insight.insight_id} insight={insight} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
