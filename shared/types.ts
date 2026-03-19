export type Role = "admin" | "client";
export type Platform = "meta" | "google" | "tiktok" | "kol" | "organic_instagram" | "organic_tiktok" | "whatsapp_lead" | "manual";
export type CampaignStatus = "active" | "paused" | "completed" | "draft";
export type ReportStatus = "generating" | "ready" | "failed";
export type SyncSource = "api" | "google_sheet" | "manual";
export type KolPlatform = "instagram" | "tiktok";
export type CredentialPlatform = "meta" | "google" | "tiktok";

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface DashboardSummary {
  totalSpend: number;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  totalConversions: number;
  overallROAS: number;
  totalEngagements: number;
}

export interface DailySpend {
  date: string;
  spend: number;
}

export interface PlatformMetric {
  platform: string;
  impressions?: number;
  budget?: number;
}

export interface CampaignSummary {
  id: string;
  name: string;
  platform: Platform;
  status: CampaignStatus;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  roas: number;
}

export interface KolSummary {
  creatorName: string;
  platform: KolPlatform;
  reach: number;
  engagements: number;
  contentUrl: string | null;
}

export interface DashboardData {
  summary: DashboardSummary;
  dailySpend: DailySpend[];
  impressionsByPlatform: PlatformMetric[];
  budgetByPlatform: PlatformMetric[];
  campaigns: CampaignSummary[];
  kolActivations: KolSummary[];
  whatsappLeads: number;
}
