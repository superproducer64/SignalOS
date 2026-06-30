import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

/**
 * GET /api/signals
 * Query params:
 *   domains  — comma-separated list of source_domain values (required)
 *   userId   — when provided, also returns captured signals for this user
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

    return res.json(data ?? []);
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
