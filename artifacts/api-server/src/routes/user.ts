import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("user_id, name, email")
      .eq("user_id", userId)
      .single();

    if (userErr || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { data: prefs, error: prefsErr } = await supabase
      .from("preferences")
      .select("preference_type, preference_value")
      .eq("user_id", userId)
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
    });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
