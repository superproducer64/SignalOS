import { Router, type Request } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

/** Resolves the userId from a Supabase JWT (Authorization header) if present, falling back to the :userId path param. */
async function resolveUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) return data.user.id;
  }
  const paramUserId = req.params.userId;
  return typeof paramUserId === "string" ? paramUserId : null;
}

async function handleGetUser(req: Request, res: import("express").Response) {
  try {
    const userId = await resolveUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("user_id, name, email, onboarding_complete")
      .eq("user_id", userId)
      .single();

    if (userErr || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { data: prefs, error: prefsErr } = await supabase
      .from("preferences")
      .select("preference_type, preference_value")
      .eq("user_id", (user as { user_id: string }).user_id)
      .eq("preference_type", "interest");

    if (prefsErr) throw prefsErr;

    const interestValues = (prefs ?? []).map(
      (p: { preference_value: string }) => p.preference_value
    );

    const hasSportsInterest = interestValues.some((v: string) =>
      v.startsWith("sports:")
    );

    // Derive signal domains from non-sports interests (e.g. "technology:AI" → "technology")
    const signalDomains = [
      ...new Set(
        interestValues
          .filter((v: string) => !v.startsWith("sports:"))
          .map((v: string) => v.split(":")[0])
          .filter(Boolean)
      ),
    ];

    return res.json({
      userId: (user as { user_id: string }).user_id,
      name: (user as { name: string }).name,
      email: (user as { email: string }).email,
      interests: interestValues,
      hasSportsInterest,
      signalDomains,
      onboardingComplete: (user as { onboarding_complete: boolean }).onboarding_complete,
    });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
}

router.get("/user", handleGetUser);
router.get("/user/:userId", handleGetUser);

/**
 * GET /api/user/:userId/credibility
 * Tallies the user's captured signals into a simple "signal accuracy" stat.
 * Informational only — does not feed back into scoring.
 */
router.get("/user/:userId/credibility", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("signals")
      .select("signal_score")
      .eq("source_domain", "captured")
      .eq("user_id", userId);

    if (error) throw error;

    const scores = (data ?? []) as { signal_score: number }[];
    const total = scores.length;
    const hits = scores.filter((s) => s.signal_score > 30).length;
    const misses = total - hits;
    const accuracy = total > 0 ? hits / total : 0;

    return res.json({ total, hits, misses, accuracy });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
