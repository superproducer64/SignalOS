import { Router } from "express";
import { runCollector } from "../lib/run-collector";

const router = Router();

/**
 * POST /api/admin/collect
 * Triggers the signal collector against all active sources.
 * Returns a per-source summary of fetched / inserted / skipped counts.
 */
router.post("/admin/collect", async (_req, res) => {
  try {
    const results = await runCollector();
    const totalInserted = results.reduce((n, r) => n + r.inserted, 0);
    const totalFetched = results.reduce((n, r) => n + r.fetched, 0);
    const errors = results.filter((r) => r.error);

    return res.json({
      ok: errors.length === 0,
      totalFetched,
      totalInserted,
      sources: results,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

export default router;
