/**
 * Signal scoring engine.
 * Scores each story 0-100 and produces a human-readable reasons[] array
 * so the frontend can display "Why am I seeing this?"
 */

export interface UserPrefs {
  /** Team IDs the user has favorited (e.g. ["steelers", "rockets"]) */
  favoriteTeamIds: string[];
  /** Story type categories the user has previously liked/saved (e.g. ["TRADE", "INJURY"]) */
  likedCategories: string[];
  /** Specific story IDs the user has liked or saved */
  likedStoryIds: string[];
}

export interface SignalResult {
  signalScore: number;
  reasons: string[];
}

/**
 * Story types considered "high-value" transaction news.
 * Trades, injuries, signings, and releases are the most actionable
 * updates for a sports fan — they change the team roster.
 */
const TRANSACTION_TYPES = new Set(["TRADE", "INJURY", "SIGNING", "RELEASE"]);

/**
 * Hardcoded trending story IDs for mock purposes.
 * In production these would come from a trending/engagement service.
 * These represent the "big play" highlight moments most likely to go viral.
 */
const TRENDING_STORY_IDS = new Set([
  "steelers-hl-0", // Pickett 52-yard bomb
  "rockets-hl-0",  // Green's clutch three
  "astros-hl-0",   // Altuve grand slam
  "rockets-score", // Rockets win over Warriors
]);

/**
 * Parse the various timestamp/date string formats used in the mock data.
 *
 * Handles:
 *   - ISO date strings: "2026-05-28"
 *   - Long date strings: "May 28, 2026"
 *   - Short date strings: "Sun, Jun 1"  (assumes current year)
 *   - Game-clock strings: "Q4 2:14", "Q3 8:55", "5th inning", "7 IP"
 *     → treated as game-day (returns today's date for recency scoring)
 *
 * Returns null if unparseable.
 */
function parseStoryDate(raw: string): Date | null {
  if (!raw) return null;

  // Game-clock patterns → treat as today (recent game)
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

  // Standard parseable strings ("May 28, 2026" / ISO)
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

/**
 * Core scoring function.
 *
 * Weights:
 *   Favorite team              +40
 *   Trade/injury/transaction   +25
 *   Trending                   +12
 *   Similar to past saves/likes +15
 *   Recency (within 24 h)      +10
 *   Decay (older than 3 days)  -20
 *
 * Final score is clamped to [0, 100].
 */
export function calculateSignalScore(
  story: {
    id: string;
    teamId: string;
    type: string;
    /** Raw timestamp or date string from the mock data */
    dateStr: string;
  },
  userPrefs: UserPrefs
): SignalResult {
  let score = 0;
  const reasons: string[] = [];

  // ── +40  Favorite team ───────────────────────────────────────────────────
  if (userPrefs.favoriteTeamIds.includes(story.teamId)) {
    score += 40;
    reasons.push("Favorite Team +40");
  }

  // ── +25  Trade / injury / transaction news ───────────────────────────────
  if (TRANSACTION_TYPES.has(story.type)) {
    score += 25;
    reasons.push("Trade & Transaction News +25");
  }

  // ── +12  Trending ────────────────────────────────────────────────────────
  if (TRENDING_STORY_IDS.has(story.id)) {
    score += 12;
    reasons.push("Trending +12");
  }

  // ── +15  Similar to past saves / likes ───────────────────────────────────
  const matchedCategory = userPrefs.likedCategories.includes(story.type);
  const matchedStory = userPrefs.likedStoryIds.includes(story.id);
  if (matchedCategory || matchedStory) {
    score += 15;
    reasons.push("Similar to Your Interests +15");
  }

  // ── Recency / decay ──────────────────────────────────────────────────────
  const storyDate = parseStoryDate(story.dateStr);
  if (storyDate) {
    const now = new Date();
    const ageMs = now.getTime() - storyDate.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays <= 1) {
      score += 10;
      reasons.push("Recent (within 24h) +10");
    } else if (ageDays > 3) {
      score -= 20;
      reasons.push("Older Story -20");
    }
    // Between 1–3 days: no modifier (neutral recency)
  }

  // Clamp to [0, 100]
  score = Math.max(0, Math.min(100, score));

  return { signalScore: score, reasons };
}
