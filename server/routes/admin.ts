import { Router } from "express";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAdmin } from "../_core/middleware";
import { getDb, schema } from "../_core/db";

const router = Router();
router.use(requireAdmin);

// ── Clients ──────────────────────────────────────────────────────────────────

router.get("/clients", async (_req, res) => {
  try {
    const db = getDb();
    const clients = await db
      .select({
        id: schema.clients.id,
        brandName: schema.clients.brandName,
        industry: schema.clients.industry,
        logoUrl: schema.clients.logoUrl,
        website: schema.clients.website,
        contactEmail: schema.clients.contactEmail,
        contactPhone: schema.clients.contactPhone,
        isActive: schema.clients.isActive,
        createdAt: schema.clients.createdAt,
        userId: schema.clients.userId,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.clients)
      .leftJoin(schema.users, eq(schema.clients.userId, schema.users.id))
      .orderBy(desc(schema.clients.createdAt));
    res.json({ data: clients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/clients", async (req, res) => {
  try {
    const db = getDb();
    const { userId, brandName, industry, logoUrl, website, contactEmail, contactPhone, notes } = req.body;
    if (!brandName) {
      res.status(400).json({ error: "brandName is required" });
      return;
    }
    const id = nanoid();
    await db.insert(schema.clients).values({
      id,
      userId: userId || null,
      brandName,
      industry,
      logoUrl,
      website,
      contactEmail,
      contactPhone,
      notes,
    });
    const created = await db.select().from(schema.clients).where(eq(schema.clients.id, id)).limit(1);
    res.status(201).json({ data: created[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/clients/:id", async (req, res) => {
  try {
    const db = getDb();
    const client = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, req.params.id))
      .limit(1);
    if (!client[0]) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json({ data: client[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/clients/:id", async (req, res) => {
  try {
    const db = getDb();
    const { brandName, industry, logoUrl, website, contactEmail, contactPhone, notes, isActive } = req.body;
    await db
      .update(schema.clients)
      .set({ brandName, industry, logoUrl, website, contactEmail, contactPhone, notes, isActive })
      .where(eq(schema.clients.id, req.params.id));
    const updated = await db.select().from(schema.clients).where(eq(schema.clients.id, req.params.id)).limit(1);
    res.json({ data: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/clients/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(schema.clients).where(eq(schema.clients.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/clients/:id/dashboard", async (req, res) => {
  try {
    const db = getDb();

    // Support both days and startDate/endDate params
    let startDateStr: string;
    let endDateStr: string;
    if (req.query.startDate && req.query.endDate) {
      startDateStr = req.query.startDate as string;
      endDateStr = req.query.endDate as string;
    } else {
      const days = Math.min(Math.max(parseInt(req.query.days as string || "30"), 1), 365);
      const sd = new Date();
      sd.setDate(sd.getDate() - days);
      startDateStr = sd.toISOString().split("T")[0];
      endDateStr = new Date().toISOString().split("T")[0];
    }

    const campaigns = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.clientId, req.params.id));

    let totalSpend = 0, totalImpressions = 0, totalReach = 0, totalClicks = 0;
    let totalConversions = 0, totalRevenue = 0, totalEngagements = 0;
    const dailySpendMap: Record<string, number> = {};

    for (const campaign of campaigns) {
      const metrics = await db
        .select()
        .from(schema.campaignMetrics)
        .where(
          and(
            eq(schema.campaignMetrics.campaignId, campaign.id),
            gte(schema.campaignMetrics.date, startDateStr as unknown as Date),
            lte(schema.campaignMetrics.date, endDateStr as unknown as Date)
          )
        );
      for (const m of metrics) {
        const spend = parseFloat(String(m.spend || 0));
        totalSpend += spend;
        totalImpressions += m.impressions || 0;
        totalReach += m.reach || 0;
        totalClicks += m.clicks || 0;
        totalConversions += m.conversions || 0;
        totalRevenue += parseFloat(String(m.revenue || 0));
        totalEngagements += m.engagements || 0;
        const dateStr = m.date instanceof Date ? m.date.toISOString().split("T")[0] : String(m.date).split("T")[0];
        dailySpendMap[dateStr] = (dailySpendMap[dateStr] || 0) + spend;
      }
    }

    const dayCount = Math.round((new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dailySpend = [];
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(startDateStr);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      dailySpend.push({ date: dateStr, spend: dailySpendMap[dateStr] || 0 });
    }

    const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    res.json({
      data: {
        summary: { totalSpend, totalImpressions, totalReach, totalClicks, totalConversions, overallROAS, totalEngagements },
        dailySpend,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/clients/:id/metrics", async (req, res) => {
  try {
    const db = getDb();
    const campaigns = await db
      .select({ id: schema.campaigns.id })
      .from(schema.campaigns)
      .where(eq(schema.campaigns.clientId, req.params.id));

    const campaignIds = campaigns.map((c) => c.id);
    if (campaignIds.length === 0) {
      res.json({ data: [] });
      return;
    }

    // Fetch metrics for each campaign and flatten
    const allMetrics: any[] = [];
    for (const cid of campaignIds) {
      const metrics = await db
        .select()
        .from(schema.campaignMetrics)
        .where(eq(schema.campaignMetrics.campaignId, cid))
        .orderBy(desc(schema.campaignMetrics.date));
      allMetrics.push(...metrics);
    }

    res.json({ data: allMetrics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Campaigns ─────────────────────────────────────────────────────────────────

router.get("/campaigns", async (req, res) => {
  try {
    const db = getDb();
    const clientId = req.query.clientId as string | undefined;
    const query = db
      .select({
        id: schema.campaigns.id,
        name: schema.campaigns.name,
        platform: schema.campaigns.platform,
        status: schema.campaigns.status,
        budget: schema.campaigns.budget,
        currency: schema.campaigns.currency,
        startDate: schema.campaigns.startDate,
        endDate: schema.campaigns.endDate,
        objective: schema.campaigns.objective,
        clientId: schema.campaigns.clientId,
        brandName: schema.clients.brandName,
      })
      .from(schema.campaigns)
      .leftJoin(schema.clients, eq(schema.campaigns.clientId, schema.clients.id))
      .orderBy(desc(schema.campaigns.createdAt));

    const allCampaigns = clientId
      ? await db
          .select({
            id: schema.campaigns.id,
            name: schema.campaigns.name,
            platform: schema.campaigns.platform,
            status: schema.campaigns.status,
            budget: schema.campaigns.budget,
            currency: schema.campaigns.currency,
            startDate: schema.campaigns.startDate,
            endDate: schema.campaigns.endDate,
            objective: schema.campaigns.objective,
            clientId: schema.campaigns.clientId,
            brandName: schema.clients.brandName,
          })
          .from(schema.campaigns)
          .leftJoin(schema.clients, eq(schema.campaigns.clientId, schema.clients.id))
          .where(eq(schema.campaigns.clientId, clientId))
          .orderBy(desc(schema.campaigns.createdAt))
      : await query;

    res.json({ data: allCampaigns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/campaigns", async (req, res) => {
  try {
    const db = getDb();
    const { clientId, name, platform, objective, budget, currency, startDate, endDate, status, externalCampaignId } = req.body;
    if (!clientId || !name || !platform) {
      res.status(400).json({ error: "clientId, name, and platform are required" });
      return;
    }
    const id = nanoid();
    await db.insert(schema.campaigns).values({
      id,
      clientId,
      name,
      platform,
      objective,
      budget,
      currency: currency || "IDR",
      startDate,
      endDate,
      status: status || "draft",
      externalCampaignId,
    });
    const created = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, id)).limit(1);
    res.status(201).json({ data: created[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/campaigns/:id", async (req, res) => {
  try {
    const db = getDb();
    const { name, platform, objective, budget, currency, startDate, endDate, status } = req.body;
    await db
      .update(schema.campaigns)
      .set({ name, platform, objective, budget, currency, startDate, endDate, status })
      .where(eq(schema.campaigns.id, req.params.id));
    const updated = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, req.params.id)).limit(1);
    res.json({ data: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/campaigns/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(schema.campaigns).where(eq(schema.campaigns.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/campaigns/:id/metrics", async (req, res) => {
  try {
    const db = getDb();
    const { date, impressions, reach, clicks, engagements, conversions, spend, revenue, ctr, cpc, cpm, roas, conversionRate, source } = req.body;
    if (!date) {
      res.status(400).json({ error: "date is required" });
      return;
    }
    const id = nanoid();
    await db.insert(schema.campaignMetrics).values({
      id,
      campaignId: req.params.id,
      date,
      impressions,
      reach,
      clicks,
      engagements,
      conversions,
      spend,
      revenue,
      ctr,
      cpc,
      cpm,
      roas,
      conversionRate,
      source: source || "manual",
    });
    const created = await db.select().from(schema.campaignMetrics).where(eq(schema.campaignMetrics.id, id)).limit(1);
    res.status(201).json({ data: created[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/campaigns/:id/metrics/:metricId", async (req, res) => {
  try {
    const db = getDb();
    const { impressions, reach, clicks, engagements, conversions, spend, revenue, ctr, cpc, cpm, roas, conversionRate } = req.body;
    await db
      .update(schema.campaignMetrics)
      .set({ impressions, reach, clicks, engagements, conversions, spend, revenue, ctr, cpc, cpm, roas, conversionRate })
      .where(eq(schema.campaignMetrics.id, req.params.metricId));
    const updated = await db.select().from(schema.campaignMetrics).where(eq(schema.campaignMetrics.id, req.params.metricId)).limit(1);
    res.json({ data: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── API Credentials ───────────────────────────────────────────────────────────

router.get("/credentials/:clientId", async (req, res) => {
  try {
    const db = getDb();
    const creds = await db
      .select()
      .from(schema.apiCredentials)
      .where(eq(schema.apiCredentials.clientId, req.params.clientId));
    res.json({ data: creds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/credentials/:clientId", async (req, res) => {
  try {
    const db = getDb();
    const { platform, accessToken, refreshToken, accountId, igAccountId, tokenExpiresAt } = req.body;

    // Upsert: check if credential already exists for this clientId + platform
    const existing = await db
      .select()
      .from(schema.apiCredentials)
      .where(
        and(
          eq(schema.apiCredentials.clientId, req.params.clientId),
          eq(schema.apiCredentials.platform, platform)
        )
      )
      .limit(1);

    let resultId: string;
    if (existing[0]) {
      // Update existing credential
      resultId = existing[0].id;
      const updateData: any = { accountId, igAccountId, isActive: true };
      if (accessToken) updateData.accessToken = accessToken;
      if (refreshToken) updateData.refreshToken = refreshToken;
      if (tokenExpiresAt) updateData.tokenExpiresAt = new Date(tokenExpiresAt);
      await db.update(schema.apiCredentials).set(updateData).where(eq(schema.apiCredentials.id, resultId));
    } else {
      // Insert new credential
      resultId = nanoid();
      await db.insert(schema.apiCredentials).values({
        id: resultId,
        clientId: req.params.clientId,
        platform,
        accessToken,
        refreshToken,
        accountId,
        igAccountId,
        tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : undefined,
      });
    }

    const result = await db.select().from(schema.apiCredentials).where(eq(schema.apiCredentials.id, resultId)).limit(1);
    res.status(200).json({ data: result[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/credentials/:id", async (req, res) => {
  try {
    const db = getDb();
    const { accessToken, refreshToken, accountId, igAccountId, tokenExpiresAt, isActive } = req.body;
    await db
      .update(schema.apiCredentials)
      .set({ accessToken, refreshToken, accountId, igAccountId, tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : undefined, isActive })
      .where(eq(schema.apiCredentials.id, req.params.id));
    const updated = await db.select().from(schema.apiCredentials).where(eq(schema.apiCredentials.id, req.params.id)).limit(1);
    res.json({ data: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/credentials/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(schema.apiCredentials).where(eq(schema.apiCredentials.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── KOL Activations ───────────────────────────────────────────────────────────

router.get("/kol/:clientId", async (req, res) => {
  try {
    const db = getDb();
    const kols = await db
      .select()
      .from(schema.kolActivations)
      .where(eq(schema.kolActivations.clientId, req.params.clientId))
      .orderBy(desc(schema.kolActivations.activationDate));
    res.json({ data: kols });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/kol/:clientId", async (req, res) => {
  try {
    const db = getDb();
    const { campaignId, creatorName, platform, contentUrl, reach, engagements, notes, activationDate } = req.body;
    const id = nanoid();
    await db.insert(schema.kolActivations).values({
      id,
      clientId: req.params.clientId,
      campaignId,
      creatorName,
      platform,
      contentUrl,
      reach,
      engagements,
      notes,
      activationDate,
    });
    const created = await db.select().from(schema.kolActivations).where(eq(schema.kolActivations.id, id)).limit(1);
    res.status(201).json({ data: created[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/kol/:id", async (req, res) => {
  try {
    const db = getDb();
    const { creatorName, platform, contentUrl, reach, engagements, notes, activationDate } = req.body;
    await db
      .update(schema.kolActivations)
      .set({ creatorName, platform, contentUrl, reach, engagements, notes, activationDate })
      .where(eq(schema.kolActivations.id, req.params.id));
    const updated = await db.select().from(schema.kolActivations).where(eq(schema.kolActivations.id, req.params.id)).limit(1);
    res.json({ data: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/kol/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.delete(schema.kolActivations).where(eq(schema.kolActivations.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Google Sheet Configs ──────────────────────────────────────────────────────

router.get("/sheets/:clientId", async (req, res) => {
  try {
    const db = getDb();
    const configs = await db
      .select()
      .from(schema.googleSheetConfigs)
      .where(eq(schema.googleSheetConfigs.clientId, req.params.clientId));
    res.json({ data: configs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sheets/:clientId", async (req, res) => {
  try {
    const db = getDb();
    const { sheetUrl, sheetName } = req.body;
    const id = nanoid();
    await db.insert(schema.googleSheetConfigs).values({
      id,
      clientId: req.params.clientId,
      sheetUrl,
      sheetName,
    });
    const created = await db.select().from(schema.googleSheetConfigs).where(eq(schema.googleSheetConfigs.id, id)).limit(1);
    res.status(201).json({ data: created[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/sheets/:id", async (req, res) => {
  try {
    const db = getDb();
    const { sheetUrl, sheetName, isActive } = req.body;
    await db
      .update(schema.googleSheetConfigs)
      .set({ sheetUrl, sheetName, isActive })
      .where(eq(schema.googleSheetConfigs.id, req.params.id));
    const updated = await db.select().from(schema.googleSheetConfigs).where(eq(schema.googleSheetConfigs.id, req.params.id)).limit(1);
    res.json({ data: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Reports (admin view) ──────────────────────────────────────────────────────

router.get("/reports", async (req, res) => {
  try {
    const db = getDb();
    const clientId = req.query.clientId as string | undefined;
    const allReports = clientId
      ? await db.select().from(schema.reports).where(eq(schema.reports.clientId, clientId)).orderBy(desc(schema.reports.createdAt))
      : await db.select().from(schema.reports).orderBy(desc(schema.reports.createdAt));
    res.json({ data: allReports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Users ─────────────────────────────────────────────────────────────────────

router.get("/users", async (_req, res) => {
  try {
    const db = getDb();
    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        lastSignedIn: schema.users.lastSignedIn,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt));
    res.json({ data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Cleanup Duplicate Metrics ─────────────────────────────────────────────────

router.get("/cleanup-duplicates", async (_req, res) => {
  try {
    const db = getDb();

    // Count before
    const before = await db.execute(sql`SELECT COUNT(*) as total FROM campaign_metrics`);
    const totalBefore = Number((before[0] as any[])[0]?.total || 0);

    // Delete duplicates: keep only MAX(id) per (campaign_id, date)
    await db.execute(sql`
      DELETE cm FROM campaign_metrics cm
      WHERE cm.id NOT IN (
        SELECT id FROM (
          SELECT MAX(id) AS id FROM campaign_metrics GROUP BY campaign_id, date
        ) AS keep_ids
      )
    `);

    const after = await db.execute(sql`SELECT COUNT(*) as total FROM campaign_metrics`);
    const totalAfter = Number((after[0] as any[])[0]?.total || 0);
    const deleted = totalBefore - totalAfter;

    res.json({ deleted, totalBefore, totalAfter, message: `Cleaned up ${deleted} duplicate rows` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
