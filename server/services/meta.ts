import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "../_core/db";

export async function syncMeta(clientId: string): Promise<void> {
  const db = getDb();

  const credentials = await db
    .select()
    .from(schema.apiCredentials)
    .where(
      and(
        eq(schema.apiCredentials.clientId, clientId),
        eq(schema.apiCredentials.platform, "meta"),
        eq(schema.apiCredentials.isActive, true)
      )
    )
    .limit(1);

  if (!credentials[0]) {
    throw new Error("No active Meta credentials found for this client");
  }

  const { accessToken, accountId } = credentials[0];
  if (!accessToken || !accountId) {
    throw new Error("Meta access token or account ID missing");
  }

  // Fetch campaigns from Meta Marketing API
  const campaignsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/campaigns?fields=id,name,objective,status,daily_budget,lifetime_budget&access_token=${accessToken}`;
  const campaignsResp = await fetch(campaignsUrl);
  if (!campaignsResp.ok) {
    throw new Error(`Meta API error: ${await campaignsResp.text()}`);
  }
  const campaignsData = (await campaignsResp.json()) as { data: any[] };

  for (const metaCampaign of campaignsData.data || []) {
    // Upsert campaign
    const existing = await db
      .select()
      .from(schema.campaigns)
      .where(
        and(
          eq(schema.campaigns.clientId, clientId),
          eq(schema.campaigns.externalCampaignId, metaCampaign.id)
        )
      )
      .limit(1);

    let campaignId: string;

    if (!existing[0]) {
      campaignId = nanoid();
      await db.insert(schema.campaigns).values({
        id: campaignId,
        clientId,
        name: metaCampaign.name,
        platform: "meta",
        externalCampaignId: metaCampaign.id,
        objective: metaCampaign.objective,
        budget: metaCampaign.lifetime_budget || metaCampaign.daily_budget || "0",
        status:
          metaCampaign.status === "ACTIVE"
            ? "active"
            : metaCampaign.status === "PAUSED"
            ? "paused"
            : "completed",
      });
    } else {
      campaignId = existing[0].id;
      await db
        .update(schema.campaigns)
        .set({
          name: metaCampaign.name,
          status:
            metaCampaign.status === "ACTIVE"
              ? "active"
              : metaCampaign.status === "PAUSED"
              ? "paused"
              : "completed",
        })
        .where(eq(schema.campaigns.id, campaignId));
    }

    // Fetch insights
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString().split("T")[0];

    const insightsUrl = `https://graph.facebook.com/v18.0/${metaCampaign.id}/insights?fields=date_start,impressions,reach,clicks,spend,actions,ctr,cpc,cpm&time_range={"since":"${since}","until":"${today}"}&time_increment=1&access_token=${accessToken}`;
    const insightsResp = await fetch(insightsUrl);
    if (!insightsResp.ok) continue;

    const insightsData = (await insightsResp.json()) as { data: any[] };

    for (const insight of insightsData.data || []) {
      const conversions =
        (insight.actions || [])
          .filter((a: any) => a.action_type === "purchase" || a.action_type === "lead")
          .reduce((sum: number, a: any) => sum + parseInt(a.value || "0"), 0);

      const spend = parseFloat(insight.spend || "0");
      const revenue = conversions * spend * 3; // placeholder ROAS estimate

      const metricId = nanoid();
      await db.insert(schema.campaignMetrics).values({
        id: metricId,
        campaignId,
        date: insight.date_start,
        impressions: parseInt(insight.impressions || "0"),
        reach: parseInt(insight.reach || "0"),
        clicks: parseInt(insight.clicks || "0"),
        spend: insight.spend || "0",
        ctr: insight.ctr || "0",
        cpc: insight.cpc || "0",
        cpm: insight.cpm || "0",
        conversions,
        revenue: String(revenue),
        source: "api",
        rawData: insight,
      });
    }
  }
}
