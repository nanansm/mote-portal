import { Router } from "express";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import OpenAI from "openai";
import { requireAuth, requireAdmin } from "../_core/middleware";
import { getDb, schema } from "../_core/db";
import { ENV } from "../_core/env";
import { uploadToS3, getPresignedUrl } from "../_core/s3";

const router = Router();

router.post("/generate/:clientId", requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { title, periodStart, periodEnd } = req.body;
    if (!title || !periodStart || !periodEnd) {
      res.status(400).json({ error: "title, periodStart, periodEnd required" });
      return;
    }

    const reportId = nanoid();
    await db.insert(schema.reports).values({
      id: reportId,
      clientId: req.params.clientId,
      title,
      periodStart,
      periodEnd,
      status: "generating",
      generatedBy: req.user!.userId,
    });

    res.status(202).json({ data: { id: reportId, status: "generating" } });

    // Async generation
    (async () => {
      try {
        // Fetch campaigns and metrics
        const campaigns = await db
          .select()
          .from(schema.campaigns)
          .where(eq(schema.campaigns.clientId, req.params.clientId));

        let summaryData = "";
        for (const c of campaigns) {
          const metrics = await db
            .select()
            .from(schema.campaignMetrics)
            .where(eq(schema.campaignMetrics.campaignId, c.id));

          const totalSpend = metrics.reduce((s, m) => s + parseFloat(String(m.spend || 0)), 0);
          const totalImpressions = metrics.reduce((s, m) => s + (m.impressions || 0), 0);
          const totalClicks = metrics.reduce((s, m) => s + (m.clicks || 0), 0);
          summaryData += `Campaign: ${c.name} (${c.platform}) - Spend: ${totalSpend} IDR, Impressions: ${totalImpressions}, Clicks: ${totalClicks}\n`;
        }

        let llmInsights = "";
        if (ENV.openaiApiKey) {
          const openai = new OpenAI({ apiKey: ENV.openaiApiKey });
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a digital marketing analyst for Mote Kreatif agency. Generate a professional performance report with insights, highlights, and recommendations in Indonesian language.",
              },
              {
                role: "user",
                content: `Generate a performance report for period ${periodStart} to ${periodEnd}.\n\nCampaign Data:\n${summaryData}\n\nProvide:\n1. Executive Summary\n2. Key Performance Highlights\n3. Platform Analysis\n4. Recommendations for next period`,
              },
            ],
          });
          llmInsights = completion.choices[0]?.message?.content || "";
        }

        // Create simple PDF as text (placeholder — in production use puppeteer or pdfkit)
        const pdfContent = Buffer.from(
          `MOTE KREATIF - Performance Report\n\nPeriod: ${periodStart} to ${periodEnd}\n\n${llmInsights || summaryData}`,
          "utf-8"
        );

        let pdfUrl = null;
        let pdfKey = null;
        if (ENV.awsBucketName) {
          pdfKey = `reports/${req.params.clientId}/${reportId}.txt`;
          pdfUrl = await uploadToS3(pdfKey, pdfContent, "text/plain");
        }

        await db
          .update(schema.reports)
          .set({ status: "ready", llmInsights, pdfUrl, pdfKey })
          .where(eq(schema.reports.id, reportId));
      } catch (genErr) {
        console.error("Report generation error:", genErr);
        await db
          .update(schema.reports)
          .set({ status: "failed" })
          .where(eq(schema.reports.id, reportId));
      }
    })();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/download/:reportId", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const report = await db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, req.params.reportId))
      .limit(1);

    if (!report[0]) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    if (report[0].status !== "ready" || !report[0].pdfKey) {
      res.status(400).json({ error: "Report not ready" });
      return;
    }

    const url = await getPresignedUrl(report[0].pdfKey, 3600);
    res.json({ data: { url } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
