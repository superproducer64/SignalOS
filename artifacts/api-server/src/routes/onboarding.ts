import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.post("/onboarding", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const { data: authData, error: authErr } = await supabase.auth.getUser(
      authHeader.slice("Bearer ".length)
    );
    if (authErr || !authData.user) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    const userId = authData.user.id;

    const { name, email, ageRange, demographicType, interests } = req.body as {
      name: string;
      email: string;
      ageRange?: string;
      demographicType?: string;
      interests?: Record<string, { selected: string[]; freeText: string }>;
    };

    if (!email?.trim() || !name?.trim()) {
      return res.status(400).json({ message: "name and email are required" });
    }

    // Upsert the users row keyed by the authenticated Supabase user ID
    const { data: existing } = await supabase
      .from("users")
      .select("user_id")
      .eq("user_id", userId)
      .limit(1);

    if (existing && existing.length > 0) {
      const { error: updateErr } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          email: email.trim(),
          age_range: ageRange ?? null,
          demographic_type: demographicType ?? null,
          onboarding_complete: true,
        })
        .eq("user_id", userId);
      if (updateErr) throw updateErr;
    } else {
      const { error: createErr } = await supabase.from("users").insert({
        user_id: userId,
        email: email.trim(),
        name: name.trim(),
        age_range: ageRange ?? null,
        demographic_type: demographicType ?? null,
        onboarding_complete: true,
      });
      if (createErr) throw createErr;
    }

    // Clear and re-insert interest preferences only (demographic fields now live on users row)
    await supabase
      .from("preferences")
      .delete()
      .eq("user_id", userId)
      .in("preference_type", ["interest", "interest_note"]);

    const prefs: {
      user_id: string;
      preference_type: string;
      preference_value: string;
      weight: number;
    }[] = [];

    if (interests) {
      for (const [category, data] of Object.entries(interests)) {
        for (const sub of data.selected ?? []) {
          prefs.push({
            user_id: userId,
            preference_type: "interest",
            preference_value: `${category}:${sub}`,
            weight: 1,
          });
        }
        if (data.freeText?.trim()) {
          prefs.push({
            user_id: userId,
            preference_type: "interest_note",
            preference_value: `${category}:${data.freeText.trim()}`,
            weight: 1,
          });
        }
      }
    }

    if (prefs.length > 0) {
      const { error: prefsErr } = await supabase.from("preferences").insert(prefs);
      if (prefsErr) throw prefsErr;
    }

    return res.json({ userId, message: "Onboarding complete" });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
