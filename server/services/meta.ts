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
      const actions: any[] = insight.actions || [];

      // Fix 3: engagements = post_engagement action
      const engagements = actions
        .filter((a: any) => a.action_type === "post_engagement")
        .reduce((sum: number, a: any) => sum + parseInt(a.value || "0"), 0);

      // Fix 4: conversions = sum of ALL action values (total results)
      const conversions = actions
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
        engagements,
        conversions,
        spend: insight.spend || "0",
        ctr: insight.ctr || "0",
        cpc: insight.cpc || "0",
        cpm: insight.cpm || "0",
        revenue: String(revenue),
        source: "api",
        rawData: insight,
      });
    }
  }
}

export async function syncInstagram(clientId: string): Promise<void> {
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

  const { accessToken, igAccountId } = credentials[0];
  if (!accessToken || !igAccountId) {
    throw new Error("Meta access token or Instagram Business Account ID missing");
  }

  // Ensure there's an organic_instagram campaign entry for this client
  const existingCampaign = await db
    .select()
    .from(schema.campaigns)
    .where(
      and(
        eq(schema.campaigns.clientId, clientId),
        eq(schema.campaigns.platform, "organic_instagram")
      )
    )
    .limit(1);

  let campaignId: string;
  if (!existingCampaign[0]) {
    campaignId = nanoid();
    await db.insert(schema.campaigns).values({
      id: campaignId,
      clientId,
      name: "Instagram Organic",
      platform: "organic_instagram",
      status: "active",
    });
  } else {
    campaignId = existingCampaign[0].id;
  }

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().split("T")[0];

  // Fetch account-level insights (impressions, reach, profile_views, follower_count)
  const insightsUrl = `https://graph.facebook.com/v18.0/${igAccountId}/insights?metric=impressions,reach,profile_views&period=day&since=${since}&until=${today}&access_token=${accessToken}`;
  const insightsResp = await fetch(insightsUrl);
  if (!insightsResp.ok) {
    throw new Error(`Instagram Insights API error: ${await insightsResp.text()}`);
  }
  const insightsData = (await insightsResp.json()) as { data: any[] };

  // Organize insights by date
  const byDate: Record<string, { impressions: number; reach: number }> = {};
  for (const metric of insightsData.data || []) {
    const metricName: string = metric.name;
    for (const point of metric.values || []) {
      const dateStr = String(point.end_time).split("T")[0];
      if (!byDate[dateStr]) byDate[dateStr] = { impressions: 0, reach: 0 };
      if (metricName === "impressions") byDate[dateStr].impressions = point.value || 0;
      if (metricName === "reach") byDate[dateStr].reach = point.value || 0;
    }
  }

  // Fetch media posts for engagement data
  const mediaUrl = `https://graph.facebook.com/v18.0/${igAccountId}/media?fields=id,timestamp,like_count,comments_count,impressions,reach&limit=100&access_token=${accessToken}`;
  const mediaResp = await fetch(mediaUrl);

  // Aggregate post engagement by date
  const engagementByDate: Record<string, number> = {};
  if (mediaResp.ok) {
    const mediaData = (await mediaResp.json()) as { data: any[] };
    for (const post of mediaData.data || []) {
      const dateStr = String(post.timestamp).split("T")[0];
      if (dateStr >= since && dateStr <= today) {
        const eng = (post.like_count || 0) + (post.comments_count || 0);
        engagementByDate[dateStr] = (engagementByDate[dateStr] || 0) + eng;
      }
    }
  }

  // Insert daily metrics
  for (const [dateStr, vals] of Object.entries(byDate)) {
    const metricId = nanoid();
    await db.insert(schema.campaignMetrics).values({
      id: metricId,
      campaignId,
      date: dateStr,
      impressions: vals.impressions,
      reach: vals.reach,
      engagements: engagementByDate[dateStr] || 0,
      source: "api",
    });
  }
}
