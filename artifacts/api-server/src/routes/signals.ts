import { Router } from "express";
import { supabase } from "../lib/supabase";
import { calculateSignalScore, UserPrefs } from "../lib/signal-score";

const router = Router();

type SignalRow = {
  signal_id: string;
  user_id: string | null;
  source_domain: string;
  category: string;
  headline: string;
  summary: string;
  signal_score: number;
  reasons: string[];
  created_at: string;
};

/** Loads a user's interests and dismiss actions and shapes them into UserPrefs. */
async function fetchUserPrefs(userId: string): Promise<UserPrefs> {
  const [{ data: preferences, error: prefsErr }, { data: actions, error: actionsErr }] =
    await Promise.all([
      supabase
        .from("preferences")
        .select("preference_value")
        .eq("user_id", userId)
        .eq("preference_type", "interest"),
      supabase
        .from("user_signal_actions")
        .select("source_domain, category")
        .eq("user_id", userId),
    ]);

  if (prefsErr) throw prefsErr;
  if (actionsErr) throw actionsErr;

  const matchedPreferenceValues = (preferences ?? []).map(
    (p: { preference_value: string }) => p.preference_value
  );

  const dismissedDomains = (actions ?? [])
    .map((a: { source_domain: string | null }) => a.source_domain)
    .filter((d): d is string => !!d);

  const dismissedCategories = (actions ?? [])
    .map((a: { category: string | null }) => a.category)
    .filter((c): c is string => !!c);

  return {
    matchedPreferenceValues,
    likedCategories: [],
    likedSignalIds: [],
    dismissedDomains,
    dismissedCategories,
  };
}

/**
 * GET /api/signals
 * Query params:
 *   domains  — comma-separated list of source_domain values (required)
 *   userId   — when provided, also returns captured signals for this user,
 *              and re-scores every returned signal against that user's
 *              preferences and dismiss actions
 *   limit    — max items to return (default 40, max 100)
 */
router.get("/signals", async (req, res) => {
  try {
    const raw = (req.query.domains as string) ?? "";
    const domains = raw
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    if (domains.length === 0) {
      return res.status(400).json({ message: "domains query param is required" });
    }

    const userId = (req.query.userId as string | undefined)?.trim() || undefined;

    const limit = Math.min(
      100,
      Math.max(1, parseInt((req.query.limit as string) ?? "40", 10) || 40)
    );

    let query = supabase
      .from("signals")
      .select(
        "signal_id, user_id, source_domain, category, headline, summary, signal_score, reasons, created_at"
      )
      .order("signal_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.or(
        `source_domain.in.(${domains.join(",")}),and(source_domain.eq.captured,user_id.eq.${userId})`
      );
    } else {
      query = query.in("source_domain", domains);
    }

    const { data, error } = await query;

    if (error) throw error;

    const signals = (data ?? []) as SignalRow[];

    if (!userId) {
      return res.json(signals);
    }

    const userPrefs = await fetchUserPrefs(userId);

    const personalized = signals.map((signal) => {
      const { signalScore, reasons } = calculateSignalScore(
        {
          id: signal.signal_id,
          entityKey: signal.source_domain,
          type: signal.category,
          dateStr: signal.created_at,
          sourceDomain: signal.source_domain,
        },
        userPrefs
      );
      return { ...signal, signal_score: signalScore, reasons };
    });

    personalized.sort((a, b) => {
      if (b.signal_score !== a.signal_score) return b.signal_score - a.signal_score;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return res.json(personalized);
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
