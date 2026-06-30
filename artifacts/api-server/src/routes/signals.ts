import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

/**
 * GET /api/signals
 * Query params:
 *   domains  — comma-separated list of source_domain values (required)
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

    const limit = Math.min(
      100,
      Math.max(1, parseInt((req.query.limit as string) ?? "40", 10) || 40)
    );

    const { data, error } = await supabase
      .from("signals")
      .select(
        "signal_id, source_domain, category, headline, summary, signal_score, reasons, created_at"
      )
      .in("source_domain", domains)
      .order("signal_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return res.json(data ?? []);
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
