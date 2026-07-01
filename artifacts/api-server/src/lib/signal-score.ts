/**
 * Signal scoring engine — domain-agnostic.
 * Scores each signal 0-100 and produces a human-readable reasons[] array.
 */

export interface UserPrefs {
  /**
   * Any preference_value strings from the preferences table that should
   * boost this signal. For sports fans these would be team IDs; for
   * finance users these might be "finance:Stocks"; any domain works.
   * e.g. ["steelers", "rockets", "finance:Stocks"]
   */
  matchedPreferenceValues: string[];
  /** Signal categories the user has previously liked/saved (e.g. ["TRADE", "NEWS"]) */
  likedCategories: string[];
  /** Specific signal IDs the user has liked or saved */
  likedSignalIds: string[];
  /** source_domain values the user marked "Less Like This" on */
  dismissedDomains?: string[];
  /** categories the user marked "Less Like This" on */
  dismissedCategories?: string[];
}

export interface SignalResult {
  signalScore: number;
  reasons: string[];
}

/**
 * Signal types considered high-value / actionable.
 * Sports: TRADE, INJURY, SIGNING, RELEASE
 * Finance: ANALYSIS (kept in the set so finance signals get the same boost)
 * Add domain-specific types here as new verticals launch.
 */
const HIGH_VALUE_TYPES = new Set([
  "TRADE",
  "INJURY",
  "SIGNING",
  "RELEASE",
  "ANALYSIS",
]);

/**
 * Trending signal IDs (mock). In production these come from an
 * engagement / trending service. Kept generic — any signal ID can trend.
 */
const TRENDING_SIGNAL_IDS = new Set([
  "steelers-hl-0",
  "rockets-hl-0",
  "astros-hl-0",
  "rockets-score",
]);

/**
 * Parse the various timestamp/date string formats used across all domains.
 *
 * Handles:
 *   - ISO strings:        "2026-05-28"  /  "2026-05-28T14:00:00Z"
 *   - Long date strings:  "May 28, 2026"
 *   - Short date strings: "Sun, Jun 1"  (assumes current year)
 *   - Game-clock strings: "Q4 2:14", "5th inning"  → treated as today
 *
 * Returns null if unparseable.
 */
function parseSignalDate(raw: string): Date | null {
  if (!raw) return null;

  // Game-clock / live-game patterns → treat as today
  if (/^Q\d|inning|IP$|:\d{2}$/.test(raw.trim())) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // "Sun, Jun 1" → append current year
  const shortDate = raw.match(/^[A-Z][a-z]+,\s+([A-Z][a-z]+\s+\d+)$/);
  if (shortDate) {
    const parsed = new Date(`${shortDate[1]}, ${new Date().getFullYear()}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

/**
 * Core scoring function — works for any domain.
 *
 * Weights:
 *   Preference match (any domain)    +40
 *   High-value type (action news)    +25
 *   Trending                         +12
 *   Similar to past saves/likes      +15
 *   Recency (within 24 h)            +10
 *   Decay (older than 3 days)        -20
 *   Dismissed domain/category        -30
 *
 * Final score clamped to [0, 100].
 */
export function calculateSignalScore(
  signal: {
    id: string;
    /** Domain-specific entity key — team ID for sports, ticker for finance, etc. */
    entityKey: string;
    /** Signal category / type — e.g. TRADE, NEWS, ANALYSIS, HIGHLIGHT */
    type: string;
    /** ISO timestamp string or legacy date string */
    dateStr: string;
    /** Source domain — e.g. technology, finance, captured */
    sourceDomain?: string;
  },
  userPrefs: UserPrefs
): SignalResult {
  let score = 0;
  const reasons: string[] = [];

  // ── +40  Preference match (replaces sports-only "Favorite Team") ──────────
  const prefMatch = userPrefs.matchedPreferenceValues.some(
    (pref) =>
      pref === signal.entityKey ||
      pref.toLowerCase().includes(signal.entityKey.toLowerCase()) ||
      signal.entityKey.toLowerCase().includes(pref.toLowerCase())
  );
  if (prefMatch) {
    score += 40;
    reasons.push("Preference Match +40");
  }

  // ── +25  High-value / actionable signal type ──────────────────────────────
  if (HIGH_VALUE_TYPES.has(signal.type)) {
    score += 25;
    reasons.push("High-Value Signal +25");
  }

  // ── +12  Trending ─────────────────────────────────────────────────────────
  if (TRENDING_SIGNAL_IDS.has(signal.id)) {
    score += 12;
    reasons.push("Trending +12");
  }

  // ── +15  Similar to past saves / likes ───────────────────────────────────
  const matchedCategory = userPrefs.likedCategories.includes(signal.type);
  const matchedSignal = userPrefs.likedSignalIds.includes(signal.id);
  if (matchedCategory || matchedSignal) {
    score += 15;
    reasons.push("Similar to Your Interests +15");
  }

  // ── Recency / decay ───────────────────────────────────────────────────────
  const signalDate = parseSignalDate(signal.dateStr);
  if (signalDate) {
    const now = new Date();
    const ageDays =
      (now.getTime() - signalDate.getTime()) / (1000 * 60 * 60 * 24);

    if (ageDays <= 1) {
      score += 10;
      reasons.push("Recent (within 24h) +10");
    } else if (ageDays > 3) {
      score -= 20;
      reasons.push("Older Signal -20");
    }
  }

  // ── -30  Dismissed domain/category ("Less Like This") ─────────────────────
  const dismissedDomainMatch =
    !!signal.sourceDomain &&
    (userPrefs.dismissedDomains ?? []).includes(signal.sourceDomain);
  const dismissedCategoryMatch = (userPrefs.dismissedCategories ?? []).includes(
    signal.type
  );
  if (dismissedDomainMatch || dismissedCategoryMatch) {
    score -= 30;
    reasons.push("Similar to Dismissed -30");
  }

  return { signalScore: Math.max(0, Math.min(100, score)), reasons };
}
