import validationData from "@data/processed/validation.json";
import failuresData from "@data/qa/failures.json";

export default function ValidationScorecardPage() {
  const report = validationData as Record<string, unknown>;
  const failures = failuresData as Record<string, unknown>[];

  if (!report) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-medium text-neutral-600">No report found.</h2>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
          Validation Scorecard
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Automated integrity checks from Phase 6. Every generated insight must pass these gates to be surfaced.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            V4.1 Groundedness
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-green-600 dark:text-green-500">
              {report.v4_1_groundedness_pass_rate.toFixed(1)}%
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Verbatim quote match rate against raw corpus text.
          </p>
        </div>

        <div className={`border rounded-xl p-6 shadow-sm ${report.v4_7_adversarial_pass ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800' : 'bg-red-50 border-red-200'}`}>
          <div className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            V4.7 Adversarial Test
          </div>
          <div className="flex items-baseline gap-2">
            <div className={`text-4xl font-bold ${report.v4_7_adversarial_pass ? 'text-green-600 dark:text-green-500' : 'text-red-600'}`}>
              {report.v4_7_adversarial_pass ? "PASSED" : "FAILED"}
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            LLM negative control (refusal to hallucinate fabricated themes).
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            V4.2 Coverage
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-neutral-800 dark:text-neutral-200">
              {report.v4_2_coverage_percentage.toFixed(1)}%
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Percentage of total corpus assigned to a valid theme.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            V4.3 Source Diversity
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-neutral-800 dark:text-neutral-200">
              {report.v4_3_avg_source_entropy.toFixed(2)}
            </div>
            <span className="text-sm text-neutral-500">avg entropy</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Shannon entropy across sources. Low entropy = single source bias.
          </p>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          Quarantine Log ({failures.length})
        </h3>
        {failures.length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-400 italic">No insights were quarantined.</p>
        ) : (
          <div className="space-y-4">
            {failures.map((f: Record<string, unknown>, idx: number) => (
              <div key={idx} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-bold bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100 rounded">
                    QUARANTINED
                  </span>
                  <span className="text-sm font-medium text-red-800 dark:text-red-400">
                    {f.reason}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {f.raw.title}
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {f.raw.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
