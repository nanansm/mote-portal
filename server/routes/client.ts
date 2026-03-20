import { Router } from "express";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { requireAuth } from "../_core/middleware";
import { getDb, schema } from "../_core/db";

const router = Router();
router.use(requireAuth);

// Helper: get clientId from userId
async function getClientId(userId: string): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ id: schema.clients.id })
    .from(schema.clients)
    .where(eq(schema.clients.userId, userId))
    .limit(1);
  return rows[0]?.id ?? null;
}

router.get("/dashboard", async (req, res) => {
  try {
    const db = getDb();
    const clientId = await getClientId(req.user!.userId);
    if (!clientId) {
      res.status(404).json({ error: "Client profile not found" });
      return;
    }

    const days = Math.min(Math.max(parseInt(req.query.days as string || "30"), 1), 365);

    // Get all campaigns for this client
    const campaigns = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.clientId, clientId));

    // Date range based on `days` param
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Aggregate metrics across all campaigns
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalReach = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalRevenue = 0;
    let totalEngagements = 0;

    const dailySpendMap: Record<string, number> = {};
    const impressionsByPlatform: Record<string, number> = {};
    const budgetByPlatform: Record<string, number> = {};

    const campaignSummaries = [];

    for (const campaign of campaigns) {
      const metrics = await db
        .select()
        .from(schema.campaignMetrics)
        .where(
          and(
            eq(schema.campaignMetrics.campaignId, campaign.id),
            gte(schema.campaignMetrics.date, startDateStr as unknown as Date)
          )
        );

      let camSpend = 0;
      let camImpressions = 0;
      let camClicks = 0;
      let camConversions = 0;
      let camRevenue = 0;

      for (const m of metrics) {
        const spend = parseFloat(String(m.spend || 0));
        const impressions = m.impressions || 0;
        const clicks = m.clicks || 0;
        const conversions = m.conversions || 0;
        const revenue = parseFloat(String(m.revenue || 0));
        const reach = m.reach || 0;
        const engagements = m.engagements || 0;

        totalSpend += spend;
        totalImpressions += impressions;
        totalReach += reach;
        totalClicks += clicks;
        totalConversions += conversions;
        totalRevenue += revenue;
        totalEngagements += engagements;

        camSpend += spend;
        camImpressions += impressions;
        camClicks += clicks;
        camConversions += conversions;
        camRevenue += revenue;

        const dateStr = String(m.date).split("T")[0];
        dailySpendMap[dateStr] = (dailySpendMap[dateStr] || 0) + spend;

        impressionsByPlatform[campaign.platform] =
          (impressionsByPlatform[campaign.platform] || 0) + impressions;
      }

      budgetByPlatform[campaign.platform] =
        (budgetByPlatform[campaign.platform] || 0) +
        parseFloat(String(campaign.budget || 0));

      const ctr = camImpressions > 0 ? (camClicks / camImpressions) * 100 : 0;
      const roas = camSpend > 0 ? camRevenue / camSpend : 0;

      campaignSummaries.push({
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status,
        spend: camSpend,
        impressions: camImpressions,
        clicks: camClicks,
        ctr,
        roas,
      });
    }

    // Daily spend array for the selected date range
    const dailySpend = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dailySpend.push({ date: dateStr, spend: dailySpendMap[dateStr] || 0 });
    }

    // KOL activations
    const kolRows = await db
      .select()
      .from(schema.kolActivations)
      .where(eq(schema.kolActivations.clientId, clientId))
      .orderBy(desc(schema.kolActivations.activationDate))
      .limit(10);

    // WhatsApp leads (count campaigns with platform = whatsapp_lead)
    const waLeadCampaigns = campaigns.filter((c) => c.platform === "whatsapp_lead");
    let whatsappLeads = 0;
    for (const c of waLeadCampaigns) {
      const metricsRows = await db
        .select({ conversions: schema.campaignMetrics.conversions })
        .from(schema.campaignMetrics)
        .where(
          and(
            eq(schema.campaignMetrics.campaignId, c.id),
            gte(schema.campaignMetrics.date, startDateStr as unknown as Date)
          )
        );
      whatsappLeads += metricsRows.reduce((sum, m) => sum + (m.conversions || 0), 0);
    }

    const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    res.json({
      data: {
        summary: {
          totalSpend,
          totalImpressions,
          totalReach,
          totalClicks,
          totalConversions,
          overallROAS,
          totalEngagements,
        },
        dailySpend,
        impressionsByPlatform: Object.entries(impressionsByPlatform).map(([platform, impressions]) => ({
          platform,
          impressions,
        })),
        budgetByPlatform: Object.entries(budgetByPlatform).map(([platform, budget]) => ({
          platform,
          budget,
        })),
        campaigns: campaignSummaries,
        kolActivations: kolRows.map((k) => ({
          creatorName: k.creatorName,
          platform: k.platform,
          reach: k.reach,
          engagements: k.engagements,
          contentUrl: k.contentUrl,
        })),
        whatsappLeads,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/campaigns", async (req, res) => {
  try {
    const db = getDb();
    const clientId = await getClientId(req.user!.userId);
    if (!clientId) {
      res.status(404).json({ error: "Client profile not found" });
      return;
    }
    const campaigns = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.clientId, clientId))
      .orderBy(desc(schema.campaigns.createdAt));
    res.json({ data: campaigns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/campaigns/:id", async (req, res) => {
  try {
    const db = getDb();
    const clientId = await getClientId(req.user!.userId);
    if (!clientId) {
      res.status(404).json({ error: "Client profile not found" });
      return;
    }
    const campaign = await db
      .select()
      .from(schema.campaigns)
      .where(
        and(
          eq(schema.campaigns.id, req.params.id),
          eq(schema.campaigns.clientId, clientId)
        )
      )
      .limit(1);

    if (!campaign[0]) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    const metrics = await db
      .select()
      .from(schema.campaignMetrics)
      .where(eq(schema.campaignMetrics.campaignId, req.params.id))
      .orderBy(desc(schema.campaignMetrics.date));

    res.json({ data: { ...campaign[0], metrics } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports", async (req, res) => {
  try {
    const db = getDb();
    const clientId = await getClientId(req.user!.userId);
    if (!clientId) {
      res.status(404).json({ error: "Client profile not found" });
      return;
    }
    const reports = await db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.clientId, clientId))
      .orderBy(desc(schema.reports.createdAt));
    res.json({ data: reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const db = getDb();
    const clientId = await getClientId(req.user!.userId);
    if (!clientId) {
      res.status(404).json({ error: "Client profile not found" });
      return;
    }
    const client = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, clientId))
      .limit(1);
    res.json({ data: client[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
