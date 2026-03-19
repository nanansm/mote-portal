import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "../_core/db";

export async function syncTiktok(clientId: string): Promise<void> {
  const db = getDb();

  const credentials = await db
    .select()
    .from(schema.apiCredentials)
    .where(
      and(
        eq(schema.apiCredentials.clientId, clientId),
        eq(schema.apiCredentials.platform, "tiktok"),
        eq(schema.apiCredentials.isActive, true)
      )
    )
    .limit(1);

  if (!credentials[0]) {
    throw new Error("No active TikTok credentials found for this client");
  }

  const { accessToken, accountId } = credentials[0];
  if (!accessToken || !accountId) {
    throw new Error("TikTok access token or account ID missing");
  }

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().split("T")[0];

  // TikTok Ads API - get campaigns
  const campaignsResp = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id=${accountId}`,
    {
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );

  if (!campaignsResp.ok) {
    throw new Error(`TikTok API error: ${await campaignsResp.text()}`);
  }

  const campaignsData = (await campaignsResp.json()) as any;
  const tiktokCampaigns = campaignsData?.data?.list || [];

  for (const tiktokCampaign of tiktokCampaigns) {
    const existing = await db
      .select()
      .from(schema.campaigns)
      .where(
        and(
          eq(schema.campaigns.clientId, clientId),
          eq(schema.campaigns.externalCampaignId, String(tiktokCampaign.campaign_id))
        )
      )
      .limit(1);

    let campaignId: string;
    if (!existing[0]) {
      campaignId = nanoid();
      await db.insert(schema.campaigns).values({
        id: campaignId,
        clientId,
        name: tiktokCampaign.campaign_name,
        platform: "tiktok",
        externalCampaignId: String(tiktokCampaign.campaign_id),
        budget: String(tiktokCampaign.budget || 0),
        status: tiktokCampaign.operation_status === "ENABLE" ? "active" : "paused",
      });
    } else {
      campaignId = existing[0].id;
    }

    // Get insights
    const insightsResp = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?advertiser_id=${accountId}&report_type=BASIC&data_level=AUCTION_CAMPAIGN&dimensions=["campaign_id","stat_time_day"]&metrics=["spend","impressions","clicks","reach","conversions","ctr","cpc","cpm"]&start_date=${since}&end_date=${today}&campaign_ids=["${tiktokCampaign.campaign_id}"]`,
      {
        headers: {
          "Access-Token": accessToken,
        },
      }
    );

    if (!insightsResp.ok) continue;

    const insightsData = (await insightsResp.json()) as any;
    for (const row of insightsData?.data?.list || []) {
      const m = row.metrics;
      const d = row.dimensions;

      const metricId = nanoid();
      await db.insert(schema.campaignMetrics).values({
        id: metricId,
        campaignId,
        date: d.stat_time_day?.split(" ")[0],
        impressions: parseInt(m.impressions || "0"),
        reach: parseInt(m.reach || "0"),
        clicks: parseInt(m.clicks || "0"),
        conversions: parseInt(m.conversions || "0"),
        spend: m.spend || "0",
        ctr: m.ctr || "0",
        cpc: m.cpc || "0",
        cpm: m.cpm || "0",
        source: "api",
        rawData: row,
      });
    }
  }
}
