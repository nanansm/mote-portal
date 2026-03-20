import { Router } from "express";
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm";
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

/** Parse date params, defaulting to current calendar month */
function parseDateRange(query: Record<string, any>): { startDate: string; endDate: string; label: string } {
  if (query.startDate && query.endDate) {
    const start = query.startDate as string;
    const end = query.endDate as string;
    const startLabel = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endLabel = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return { startDate: start, endDate: end, label: `${startLabel} – ${endLabel}` };
  }
  // Default: current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const label = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return {
    startDate: firstDay.toISOString().split("T")[0],
    endDate: lastDay.toISOString().split("T")[0],
    label,
  };
}

router.get("/dashboard", async (req, res) => {
  try {
    const db = getDb();
    const clientId = await getClientId(req.user!.userId);
    if (!clientId) {
      res.status(404).json({ error: "Client profile not found" });
      return;
    }

    const { startDate, endDate, label } = parseDateRange(req.query as Record<string, any>);

    // Get all campaigns for this client
    const campaigns = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.clientId, clientId));

    // Aggregate metrics per platform
    const metaSpend: number[] = [];
    const kolSpend: number[] = [];
    const totalImpressions: Record<string, number> = {};
    const totalReach: Record<string, number> = {};
    const totalEngagements: Record<string, number> = {};
    const totalClicks: Record<string, number> = {};
    const totalFollowers: Record<string, number> = {};
    const dailySpendMap: Record<string, number> = {};

    const campaignSummaries: any[] = [];

    for (const campaign of campaigns) {
      const metrics = await db
        .select()
        .from(schema.campaignMetrics)
        .where(
          and(
            eq(schema.campaignMetrics.campaignId, campaign.id),
            gte(schema.campaignMetrics.date, startDate as unknown as Date),
            lte(schema.campaignMetrics.date, endDate as unknown as Date)
          )
        );

      let camSpend = 0, camImpressions = 0, camClicks = 0, camConversions = 0, camRevenue = 0;

      for (const m of metrics) {
        const spend = parseFloat(String(m.spend || 0));
        const impressions = m.impressions || 0;
        const reach = m.reach || 0;
        const clicks = m.clicks || 0;
        const engagements = m.engagements || 0;
        const followers = m.followers || 0;
        const revenue = parseFloat(String(m.revenue || 0));

        camSpend += spend;
        camImpressions += impressions;
        camClicks += clicks;
        camConversions += m.conversions || 0;
        camRevenue += revenue;

        totalImpressions[campaign.platform] = (totalImpressions[campaign.platform] || 0) + impressions;
        totalReach[campaign.platform] = (totalReach[campaign.platform] || 0) + reach;
        totalEngagements[campaign.platform] = (totalEngagements[campaign.platform] || 0) + engagements;
        totalClicks[campaign.platform] = (totalClicks[campaign.platform] || 0) + clicks;
        totalFollowers[campaign.platform] = (totalFollowers[campaign.platform] || 0) + followers;

        const dateStr = String(m.date).split("T")[0];
        dailySpendMap[dateStr] = (dailySpendMap[dateStr] || 0) + spend;

        if (campaign.platform === "kol") kolSpend.push(spend);
        else metaSpend.push(spend);
      }

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

    // Aggregate 11 dashboard metrics
    const contentImpressionPlatforms = ["meta", "organic_instagram", "organic_tiktok", "kol"];
    const contentImpression = contentImpressionPlatforms.reduce((s, p) => s + (totalImpressions[p] || 0), 0);
    const audienceReach = contentImpressionPlatforms.reduce((s, p) => s + (totalReach[p] || 0), 0);
    const postInteraction = contentImpressionPlatforms.reduce((s, p) => s + (totalEngagements[p] || 0), 0);
    const clickLink = ["meta", "organic_instagram", "organic_tiktok"].reduce((s, p) => s + (totalClicks[p] || 0), 0);
    const audienceFollow = ["organic_tiktok", "organic_instagram"].reduce((s, p) => s + (totalFollowers[p] || 0), 0);

    const marketingSpent = Object.values(totalImpressions).length > 0
      ? campaigns.reduce((sum, c) => {
          // We'll sum from dailySpendMap for all platforms
          return sum;
        }, 0) + metaSpend.reduce((a, b) => a + b, 0) + kolSpend.reduce((a, b) => a + b, 0)
      : 0;

    // Actually calculate marketingSpent as sum of ALL spend from campaign_metrics in range
    let totalMarketingSpent = 0;
    for (const [, vals] of Object.entries(dailySpendMap)) {
      totalMarketingSpent += vals;
    }

    // Fetch omset + whatsapp leads from client_daily_data
    const dailyDataRows = await db
      .select()
      .from(schema.clientDailyData)
      .where(
        and(
          eq(schema.clientDailyData.clientId, clientId),
          gte(schema.clientDailyData.date, startDate),
          lte(schema.clientDailyData.date, endDate)
        )
      );

    const realOmset = dailyDataRows.reduce((sum, r) => sum + parseFloat(String(r.realOmset || 0)), 0);
    const whatsappLeads = dailyDataRows.reduce((sum, r) => sum + (r.whatsappLeads || 0), 0);

    // Calculated metrics
    const marketingCostPercent = realOmset > 0 ? (totalMarketingSpent / realOmset) * 100 : 0;
    const engagementRate = audienceReach > 0 ? (postInteraction / audienceReach) * 100 : 0;
    const ctr = contentImpression > 0 ? (clickLink / contentImpression) * 100 : 0;

    // Build daily spend array
    const dayCount = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dailySpend = [];
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
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

    res.json({
      data: {
        period: { startDate, endDate, label },
        metrics: {
          realOmset,
          marketingSpent: totalMarketingSpent,
          marketingCostPercent,
          contentImpression,
          audienceReach,
          postInteraction,
          engagementRate,
          audienceFollow,
          clickLink,
          ctr,
          whatsappLeads,
        },
        charts: {
          dailySpend,
          impressionsByPlatform: Object.entries(totalImpressions).map(([platform, impressions]) => ({
            platform,
            impressions,
          })),
          reachByPlatform: Object.entries(totalReach).map(([platform, reach]) => ({
            platform,
            reach,
          })),
        },
        campaigns: campaignSummaries,
        kolActivations: kolRows.map((k) => ({
          creatorName: k.creatorName,
          platform: k.platform,
          reach: k.reach,
          engagements: k.engagements,
          contentUrl: k.contentUrl,
        })),
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
