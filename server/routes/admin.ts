import { Router } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
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
    if (!userId || !brandName) {
      res.status(400).json({ error: "userId and brandName are required" });
      return;
    }
    const id = nanoid();
    await db.insert(schema.clients).values({
      id,
      userId,
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
    const { platform, accessToken, refreshToken, accountId, tokenExpiresAt } = req.body;
    const id = nanoid();
    await db.insert(schema.apiCredentials).values({
      id,
      clientId: req.params.clientId,
      platform,
      accessToken,
      refreshToken,
      accountId,
      tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : undefined,
    });
    const created = await db.select().from(schema.apiCredentials).where(eq(schema.apiCredentials.id, id)).limit(1);
    res.status(201).json({ data: created[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/credentials/:id", async (req, res) => {
  try {
    const db = getDb();
    const { accessToken, refreshToken, accountId, tokenExpiresAt, isActive } = req.body;
    await db
      .update(schema.apiCredentials)
      .set({ accessToken, refreshToken, accountId, tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : undefined, isActive })
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

export default router;
