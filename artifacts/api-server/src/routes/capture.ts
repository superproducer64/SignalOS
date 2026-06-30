import { Router } from "express";
import { supabase } from "../lib/supabase";
import { calculateSignalScore } from "../lib/signal-score";

const router = Router();

router.post("/capture", async (req, res) => {
  try {
    const { userId, text } = req.body as { userId?: string; text?: string };

    if (!userId || !text?.trim()) {
      return res.status(400).json({ message: "userId and text are required" });
    }

    const { data: prefs, error: prefsErr } = await supabase
      .from("preferences")
      .select("preference_value")
      .eq("user_id", userId)
      .eq("preference_type", "interest");

    if (prefsErr) throw prefsErr;

    const preferenceValues = (prefs ?? []).map(
      (p: { preference_value: string }) => p.preference_value
    );

    // Find the best-matching preference by scanning the text for domain/sub-category keywords
    const lowerText = text.toLowerCase();
    let entityKey = "captured";
    for (const pref of preferenceValues) {
      const parts = pref.split(":");
      if (parts.some((p) => p && lowerText.includes(p.toLowerCase()))) {
        entityKey = pref;
        break;
      }
    }

    const now = new Date().toISOString();
    const headline = text.trim().slice(0, 60);

    const { signalScore, reasons } = calculateSignalScore(
      { id: "capture-new", entityKey, type: "USER_NOTE", dateStr: now },
      { matchedPreferenceValues: preferenceValues, likedCategories: [], likedSignalIds: [] }
    );

    const { data: signal, error: insertErr } = await supabase
      .from("signals")
      .insert({
        source_domain: "captured",
        category: "USER_NOTE",
        headline,
        summary: text.trim(),
        user_id: userId,
        created_at: now,
        signal_score: signalScore,
        reasons,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return res.status(201).json(signal);
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
