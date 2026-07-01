import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

/**
 * GET /api/captures
 * Query params:
 *   userId — required, owner of the captured signals
 */
router.get("/captures", async (req, res) => {
  try {
    const userId = (req.query.userId as string | undefined)?.trim();

    if (!userId) {
      return res.status(400).json({ message: "userId query param is required" });
    }

    const { data, error } = await supabase
      .from("signals")
      .select("signal_id, headline, summary, signal_score, reasons, created_at")
      .eq("source_domain", "captured")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json(data ?? []);
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

/**
 * DELETE /api/captures/:signalId
 * Query params:
 *   userId — required, must match the signal's owner
 */
router.delete("/captures/:signalId", async (req, res) => {
  try {
    const { signalId } = req.params;
    const userId = (req.query.userId as string | undefined)?.trim();

    if (!userId) {
      return res.status(400).json({ message: "userId query param is required" });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from("signals")
      .select("signal_id, user_id")
      .eq("signal_id", signalId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ message: "Capture not found" });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this capture" });
    }

    const { error: deleteErr } = await supabase
      .from("signals")
      .delete()
      .eq("signal_id", signalId);

    if (deleteErr) throw deleteErr;

    return res.json({ deleted: true });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
