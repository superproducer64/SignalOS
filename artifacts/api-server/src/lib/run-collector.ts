import { supabase } from "./supabase";
import { getActiveSources } from "./sources-config";
import { collectFromSource } from "./collector";
import { calculateSignalScore } from "./signal-score";
import type { CollectedItem } from "./collector";

export interface CollectorRunResult {
  source: string;
  fetched: number;
  inserted: number;
  skipped: number;
  error?: string;
}

/**
 * Score a collected item with a base (non-user-specific) score.
 * Uses empty prefs so only Recency/Decay and High-Value-Type modifiers apply.
 * Per-user personalization is applied at read time.
 */
function scoreItem(item: CollectedItem): { score: number; reasons: string[] } {
  const result = calculateSignalScore(
    {
      id: `${item.source_domain}:${item.headline.slice(0, 60)}`,
      entityKey: item.source_domain,
      type: item.category,
      dateStr: item.timestamp,
    },
    { matchedPreferenceValues: [], likedCategories: [], likedSignalIds: [] }
  );
  return { score: result.signalScore, reasons: result.reasons };
}

/**
 * Fetch existing headlines for a source_domain so we can deduplicate.
 * We use headline + source_domain as a natural unique key.
 */
async function fetchExistingHeadlines(
  sourceDomain: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("signals")
    .select("headline")
    .eq("source_domain", sourceDomain)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(`Failed to fetch existing signals: ${error.message}`);
  return new Set((data ?? []).map((r: { headline: string }) => r.headline));
}

/**
 * Run the collector against all active sources.
 * Each new item is deduplicated, scored, and inserted into the signals table.
 * A null user_id is used — signals are domain-level, not user-specific at write time.
 */
export async function runCollector(): Promise<CollectorRunResult[]> {
  const sources = getActiveSources();
  const results: CollectorRunResult[] = [];

  for (const source of sources) {
    const result: CollectorRunResult = {
      source: source.sourceName,
      fetched: 0,
      inserted: 0,
      skipped: 0,
    };

    try {
      const items = await collectFromSource(source);
      result.fetched = items.length;

      const existing = await fetchExistingHeadlines(source.domain);

      const toInsert = items.filter((item) => !existing.has(item.headline));
      result.skipped = items.length - toInsert.length;

      if (toInsert.length === 0) {
        results.push(result);
        continue;
      }

      const rows = toInsert.map((item) => {
        const { score, reasons } = scoreItem(item);
        return {
          user_id: null,
          source_domain: item.source_domain,
          headline: item.headline,
          summary: item.summary,
          category: item.category,
          raw_data: item.raw_data,
          signal_score: score,
          reasons,
          created_at: item.timestamp,
        };
      });

      const { error: insertErr } = await supabase
        .from("signals")
        .insert(rows);

      if (insertErr) throw new Error(insertErr.message);

      result.inserted = rows.length;
    } catch (err) {
      result.error = (err as Error).message;
    }

    results.push(result);
  }

  return results;
}
