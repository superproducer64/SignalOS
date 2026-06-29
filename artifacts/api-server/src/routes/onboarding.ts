import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.post("/onboarding", async (req, res) => {
  try {
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

    // Upsert user by email
    const { data: existing } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", email.trim())
      .limit(1);

    let userId: string;

    if (existing && existing.length > 0) {
      userId = (existing[0] as { user_id: string }).user_id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("users")
        .insert({ email: email.trim() })
        .select("user_id")
        .single();
      if (createErr) throw createErr;
      userId = (created as { user_id: string }).user_id;
    }

    // Build preference rows
    const prefTypes = ["name", "age_range", "demographic_type", "interest", "interest_note"];

    await supabase
      .from("preferences")
      .delete()
      .eq("user_id", userId)
      .in("preference_type", prefTypes);

    const prefs: { user_id: string; preference_type: string; preference_value: string; weight: number }[] = [
      { user_id: userId, preference_type: "name", preference_value: name.trim(), weight: 1 },
    ];

    if (ageRange) {
      prefs.push({ user_id: userId, preference_type: "age_range", preference_value: ageRange, weight: 1 });
    }
    if (demographicType) {
      prefs.push({ user_id: userId, preference_type: "demographic_type", preference_value: demographicType, weight: 1 });
    }

    if (interests) {
      for (const [category, data] of Object.entries(interests)) {
        for (const sub of data.selected ?? []) {
          prefs.push({ user_id: userId, preference_type: "interest", preference_value: `${category}:${sub}`, weight: 1 });
        }
        if (data.freeText?.trim()) {
          prefs.push({ user_id: userId, preference_type: "interest_note", preference_value: `${category}:${data.freeText.trim()}`, weight: 1 });
        }
      }
    }

    const { error: prefsErr } = await supabase.from("preferences").insert(prefs);
    if (prefsErr) throw prefsErr;

    return res.json({ userId, message: "Onboarding complete" });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
