import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "../_core/db";

export async function syncGoogle(clientId: string): Promise<void> {
  const db = getDb();

  const credentials = await db
    .select()
    .from(schema.apiCredentials)
    .where(
      and(
        eq(schema.apiCredentials.clientId, clientId),
        eq(schema.apiCredentials.platform, "google"),
        eq(schema.apiCredentials.isActive, true)
      )
    )
    .limit(1);

  if (!credentials[0]) {
    throw new Error("No active Google credentials found for this client");
  }

  const { accessToken, accountId } = credentials[0];
  if (!accessToken || !accountId) {
    throw new Error("Google access token or account ID missing");
  }

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().split("T")[0];

  // Google Ads API query
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm
    FROM campaign
    WHERE segments.date BETWEEN '${since}' AND '${today}'
  `;

  const response = await fetch(
    `https://googleads.googleapis.com/v14/customers/${accountId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Ads API error: ${await response.text()}`);
  }

  const rows = (await response.json()) as any[];

  for (const batchResult of rows) {
    for (const row of batchResult?.results || []) {
      const campaign = row.campaign;
      const metrics = row.metrics;
      const segments = row.segments;

      // Upsert campaign
      const existing = await db
        .select()
        .from(schema.campaigns)
        .where(
          and(
            eq(schema.campaigns.clientId, clientId),
            eq(schema.campaigns.externalCampaignId, String(campaign.id))
          )
        )
        .limit(1);

      let campaignId: string;
      if (!existing[0]) {
        campaignId = nanoid();
        await db.insert(schema.campaigns).values({
          id: campaignId,
          clientId,
          name: campaign.name,
          platform: "google",
          externalCampaignId: String(campaign.id),
          status: campaign.status === "ENABLED" ? "active" : "paused",
        });
      } else {
        campaignId = existing[0].id;
      }

      const spend = (metrics.costMicros || 0) / 1_000_000;
      const cpc = (metrics.averageCpc || 0) / 1_000_000;
      const cpm = (metrics.averageCpm || 0) / 1_000_000;

      const metricId = nanoid();
      await db.insert(schema.campaignMetrics).values({
        id: metricId,
        campaignId,
        date: segments.date,
        impressions: metrics.impressions || 0,
        clicks: metrics.clicks || 0,
        conversions: Math.round(metrics.conversions || 0),
        spend: String(spend),
        ctr: String((metrics.ctr || 0) * 100),
        cpc: String(cpc),
        cpm: String(cpm),
        source: "api",
        rawData: row,
      });
    }
  }
}
