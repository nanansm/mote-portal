export const PLATFORM_OPTIONS = [
  { value: "meta", label: "Meta Ads" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok Ads" },
  { value: "kol", label: "KOL" },
  { value: "organic_instagram", label: "IG Organic" },
  { value: "organic_tiktok", label: "TikTok Organic" },
  { value: "whatsapp_lead", label: "WhatsApp Lead" },
  { value: "manual", label: "Manual" },
] as const;

export const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "draft", label: "Draft" },
] as const;

export const KOL_PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
] as const;
