import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

const VALID_ACTIONS = new Set(["dismissed", "less_like_this"]);

/**
 * POST /api/signal-actions
 * Body: { userId, signalId, action, source_domain, category }
 * One action per user+signal — re-posting overwrites the prior action.
 */
router.post("/signal-actions", async (req, res) => {
  try {
    const { userId, signalId, action, source_domain, category } = req.body as {
      userId?: string;
      signalId?: string;
      action?: string;
      source_domain?: string;
      category?: string;
    };

    if (!userId || !signalId || !action) {
      return res
        .status(400)
        .json({ message: "userId, signalId, and action are required" });
    }

    if (!VALID_ACTIONS.has(action)) {
      return res
        .status(400)
        .json({ message: `action must be one of: ${[...VALID_ACTIONS].join(", ")}` });
    }

    const { error } = await supabase
      .from("user_signal_actions")
      .upsert(
        {
          user_id: userId,
          signal_id: signalId,
          action,
          source_domain: source_domain ?? null,
          category: category ?? null,
        },
        { onConflict: "user_id,signal_id" }
      );

    if (error) throw error;

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

/**
 * GET /api/signal-actions
 * Query params:
 *   userId — required, owner of the actions
 */
router.get("/signal-actions", async (req, res) => {
  try {
    const userId = (req.query.userId as string | undefined)?.trim();

    if (!userId) {
      return res.status(400).json({ message: "userId query param is required" });
    }

    const { data, error } = await supabase
      .from("user_signal_actions")
      .select("action_id, signal_id, action, source_domain, category, created_at")
      .eq("user_id", userId);

    if (error) throw error;

    return res.json(data ?? []);
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
