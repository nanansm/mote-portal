import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "../_core/db";

export async function syncSheets(clientId: string): Promise<void> {
  const db = getDb();

  const configs = await db
    .select()
    .from(schema.googleSheetConfigs)
    .where(
      and(
        eq(schema.googleSheetConfigs.clientId, clientId),
        eq(schema.googleSheetConfigs.isActive, true)
      )
    );

  if (configs.length === 0) {
    throw new Error("No active Google Sheet configs found for this client");
  }

  for (const config of configs) {
    try {
      // Extract sheet ID from URL
      const match = config.sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        console.warn(`Invalid sheet URL for config ${config.id}`);
        continue;
      }
      const sheetId = match[1];
      const sheetName = config.sheetName || "Sheet1";

      // Use Google Sheets API (requires service account or OAuth token)
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}?key=${process.env.GOOGLE_SHEETS_API_KEY || ""}`;

      const resp = await fetch(apiUrl);
      if (!resp.ok) {
        console.warn(`Failed to fetch sheet ${sheetId}: ${await resp.text()}`);
        continue;
      }

      const data = (await resp.json()) as { values?: string[][] };
      const rows = data.values || [];
      if (rows.length < 2) continue;

      const headers = rows[0].map((h) => h.toLowerCase().trim());
      const dateIdx = headers.findIndex((h) => h === "date");
      const impressionsIdx = headers.findIndex((h) => h === "impressions");
      const clicksIdx = headers.findIndex((h) => h === "clicks");
      const spendIdx = headers.findIndex((h) => h === "spend");
      const reachIdx = headers.findIndex((h) => h === "reach");
      const campaignNameIdx = headers.findIndex((h) => h === "campaign");

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const date = dateIdx >= 0 ? row[dateIdx] : null;
        if (!date) continue;

        const campaignName = campaignNameIdx >= 0 ? row[campaignNameIdx] : "Sheet Import";

        // Find or create campaign
        const existing = await db
          .select()
          .from(schema.campaigns)
          .where(
            and(
              eq(schema.campaigns.clientId, clientId),
              eq(schema.campaigns.name, campaignName),
              eq(schema.campaigns.platform, "manual")
            )
          )
          .limit(1);

        let campaignId: string;
        if (!existing[0]) {
          campaignId = nanoid();
          await db.insert(schema.campaigns).values({
            id: campaignId,
            clientId,
            name: campaignName,
            platform: "manual",
            status: "active",
          });
        } else {
          campaignId = existing[0].id;
        }

        const metricId = nanoid();
        await db.insert(schema.campaignMetrics).values({
          id: metricId,
          campaignId,
          date,
          impressions: impressionsIdx >= 0 ? parseInt(row[impressionsIdx] || "0") : 0,
          clicks: clicksIdx >= 0 ? parseInt(row[clicksIdx] || "0") : 0,
          reach: reachIdx >= 0 ? parseInt(row[reachIdx] || "0") : 0,
          spend: spendIdx >= 0 ? row[spendIdx] || "0" : "0",
          source: "google_sheet",
          rawData: { row, headers },
        });
      }

      // Update lastSyncedAt
      await db
        .update(schema.googleSheetConfigs)
        .set({ lastSyncedAt: new Date() })
        .where(eq(schema.googleSheetConfigs.id, config.id));
    } catch (err) {
      console.error(`Error syncing sheet config ${config.id}:`, err);
    }
  }
}
