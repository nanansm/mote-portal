import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "../_core/db";

const SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY || "";

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

async function fetchTab(spreadsheetId: string, tabName: string): Promise<string[][] | null> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}?key=${SHEETS_API_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    console.warn(`Failed to fetch tab "${tabName}" from ${spreadsheetId}: ${await resp.text()}`);
    return null;
  }
  const data = (await resp.json()) as { values?: string[][] };
  return data.values || null;
}

function parseRow(row: string[], headers: string[], col: string): string {
  const idx = headers.findIndex((h) => h === col);
  return idx >= 0 ? (row[idx] || "").trim() : "";
}

function parseNum(row: string[], headers: string[], col: string): number {
  return parseInt(parseRow(row, headers, col) || "0", 10) || 0;
}

function parseDecimal(row: string[], headers: string[], col: string): string {
  const val = parseRow(row, headers, col).replace(/[^0-9.]/g, "");
  return val || "0";
}

/** Find or create a campaign for sheet data */
async function getOrCreateCampaign(
  clientId: string,
  name: string,
  platform: "organic_tiktok" | "kol"
): Promise<string> {
  const db = getDb();
  const existing = await db
    .select({ id: schema.campaigns.id })
    .from(schema.campaigns)
    .where(
      and(
        eq(schema.campaigns.clientId, clientId),
        eq(schema.campaigns.name, name),
        eq(schema.campaigns.platform, platform)
      )
    )
    .limit(1);

  if (existing[0]) return existing[0].id;

  const id = nanoid();
  await db.insert(schema.campaigns).values({
    id,
    clientId,
    name,
    platform,
    status: "active",
  });
  return id;
}

/** Upsert campaign_metrics: check (campaignId, date) before insert */
async function upsertMetric(
  campaignId: string,
  date: string,
  values: {
    impressions?: number;
    reach?: number;
    clicks?: number;
    engagements?: number;
    followers?: number;
    spend?: string;
    rawData?: any;
  }
): Promise<void> {
  const db = getDb();
  const existing = await db
    .select({ id: schema.campaignMetrics.id })
    .from(schema.campaignMetrics)
    .where(
      and(
        eq(schema.campaignMetrics.campaignId, campaignId),
        eq(schema.campaignMetrics.date, date as unknown as Date)
      )
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(schema.campaignMetrics)
      .set({
        impressions: values.impressions ?? 0,
        reach: values.reach ?? 0,
        clicks: values.clicks ?? 0,
        engagements: values.engagements ?? 0,
        followers: values.followers ?? 0,
        spend: values.spend ?? "0",
        source: "google_sheet",
        rawData: values.rawData,
      })
      .where(eq(schema.campaignMetrics.id, existing[0].id));
  } else {
    await db.insert(schema.campaignMetrics).values({
      id: nanoid(),
      campaignId,
      date,
      impressions: values.impressions ?? 0,
      reach: values.reach ?? 0,
      clicks: values.clicks ?? 0,
      engagements: values.engagements ?? 0,
      followers: values.followers ?? 0,
      spend: values.spend ?? "0",
      source: "google_sheet",
      rawData: values.rawData,
    });
  }
}

/** Sync tiktok_organic tab */
async function syncTiktokOrganic(clientId: string, spreadsheetId: string): Promise<number> {
  const rows = await fetchTab(spreadsheetId, "tiktok_organic");
  if (!rows || rows.length < 2) return 0;

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const campaignId = await getOrCreateCampaign(clientId, "TikTok Organic", "organic_tiktok");

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const date = parseRow(row, headers, "date");
    if (!date) continue;

    await upsertMetric(campaignId, date, {
      impressions: parseNum(row, headers, "impressions"),
      reach: parseNum(row, headers, "reach"),
      clicks: parseNum(row, headers, "click_links"),
      engagements: parseNum(row, headers, "post_interaction"),
      followers: parseNum(row, headers, "audience_follow"),
      rawData: { row, headers },
    });
    count++;
  }
  return count;
}

/** Sync omset tab → client_daily_data */
async function syncOmset(clientId: string, spreadsheetId: string): Promise<number> {
  const rows = await fetchTab(spreadsheetId, "omset");
  if (!rows || rows.length < 2) return 0;

  const db = getDb();
  const headers = rows[0].map((h) => h.toLowerCase().trim());

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const date = parseRow(row, headers, "date");
    if (!date) continue;

    const realOmset = parseDecimal(row, headers, "real_omset");
    const notes = parseRow(row, headers, "notes");

    await db
      .insert(schema.clientDailyData)
      .values({
        id: nanoid(),
        clientId,
        date,
        realOmset,
        whatsappLeads: 0,
        notes,
      })
      .onDuplicateKeyUpdate({
        set: { realOmset, notes },
      });
    count++;
  }
  return count;
}

/** Sync kol tab */
async function syncKol(clientId: string, spreadsheetId: string): Promise<number> {
  const rows = await fetchTab(spreadsheetId, "kol");
  if (!rows || rows.length < 2) return 0;

  const headers = rows[0].map((h) => h.toLowerCase().trim());

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const date = parseRow(row, headers, "date");
    const creatorName = parseRow(row, headers, "creator_name");
    if (!date || !creatorName) continue;

    // Create per-creator campaign
    const campaignName = `KOL - ${creatorName}`;
    const campaignId = await getOrCreateCampaign(clientId, campaignName, "kol");

    await upsertMetric(campaignId, date, {
      impressions: parseNum(row, headers, "impressions"),
      reach: parseNum(row, headers, "reach"),
      clicks: parseNum(row, headers, "click_links"),
      engagements: parseNum(row, headers, "post_interaction"),
      spend: parseDecimal(row, headers, "spend"),
      rawData: { row, headers, creatorName },
    });
    count++;
  }
  return count;
}

/** Sync whatsapp_lead tab → client_daily_data */
async function syncWhatsappLeads(clientId: string, spreadsheetId: string): Promise<number> {
  const rows = await fetchTab(spreadsheetId, "whatsapp_lead");
  if (!rows || rows.length < 2) return 0;

  const db = getDb();
  const headers = rows[0].map((h) => h.toLowerCase().trim());

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const date = parseRow(row, headers, "date");
    if (!date) continue;

    const leadCount = parseNum(row, headers, "lead_count");
    const notes = parseRow(row, headers, "notes");

    await db
      .insert(schema.clientDailyData)
      .values({
        id: nanoid(),
        clientId,
        date,
        realOmset: "0",
        whatsappLeads: leadCount,
        notes,
      })
      .onDuplicateKeyUpdate({
        set: { whatsappLeads: leadCount, notes },
      });
    count++;
  }
  return count;
}

export interface SyncSheetsResult {
  tiktokRows: number;
  omsetRows: number;
  kolRows: number;
  whatsappRows: number;
}

export async function syncSheets(clientId: string): Promise<SyncSheetsResult> {
  const db = getDb();

  const configs = await db
    .select()
    .from(schema.googleSheetConfigs)
    .where(
      and(
        eq(schema.googleSheetConfigs.clientId, clientId),
        eq(schema.googleSheetConfigs.isActive, true)
      )
    )
    .limit(1);

  if (!configs[0]) {
    throw new Error("No active Google Sheet config found for this client");
  }

  const config = configs[0];
  const spreadsheetId = extractSpreadsheetId(config.sheetUrl);
  if (!spreadsheetId) {
    throw new Error("Invalid Google Spreadsheet URL");
  }

  const now = new Date();

  const [tiktokRows, omsetRows, kolRows, whatsappRows] = await Promise.all([
    syncTiktokOrganic(clientId, spreadsheetId).catch((e) => { console.error("TikTok organic sync error:", e); return 0; }),
    syncOmset(clientId, spreadsheetId).catch((e) => { console.error("Omset sync error:", e); return 0; }),
    syncKol(clientId, spreadsheetId).catch((e) => { console.error("KOL sync error:", e); return 0; }),
    syncWhatsappLeads(clientId, spreadsheetId).catch((e) => { console.error("WhatsApp leads sync error:", e); return 0; }),
  ]);

  // Update sync timestamps
  await db
    .update(schema.googleSheetConfigs)
    .set({
      lastSyncedAt: now,
      tiktokSyncedAt: tiktokRows > 0 ? now : config.tiktokSyncedAt,
      omsetSyncedAt: omsetRows > 0 ? now : config.omsetSyncedAt,
      kolSyncedAt: kolRows > 0 ? now : config.kolSyncedAt,
      whatsappSyncedAt: whatsappRows > 0 ? now : config.whatsappSyncedAt,
    })
    .where(eq(schema.googleSheetConfigs.id, config.id));

  return { tiktokRows, omsetRows, kolRows, whatsappRows };
}
