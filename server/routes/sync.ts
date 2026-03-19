import { Router } from "express";
import { requireAdmin } from "../_core/middleware";
import { syncMeta } from "../services/meta";
import { syncGoogle } from "../services/google";
import { syncTiktok } from "../services/tiktok";
import { syncSheets } from "../services/sheets";

const router = Router();
router.use(requireAdmin);

router.post("/meta/:clientId", async (req, res) => {
  try {
    await syncMeta(req.params.clientId);
    res.json({ success: true, message: "Meta sync completed" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Sync failed" });
  }
});

router.post("/google/:clientId", async (req, res) => {
  try {
    await syncGoogle(req.params.clientId);
    res.json({ success: true, message: "Google Ads sync completed" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Sync failed" });
  }
});

router.post("/tiktok/:clientId", async (req, res) => {
  try {
    await syncTiktok(req.params.clientId);
    res.json({ success: true, message: "TikTok sync completed" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Sync failed" });
  }
});

router.post("/sheets/:clientId", async (req, res) => {
  try {
    await syncSheets(req.params.clientId);
    res.json({ success: true, message: "Google Sheets sync completed" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Sync failed" });
  }
});

export default router;
