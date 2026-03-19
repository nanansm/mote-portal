import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Alias kept for backwards compatibility */
export function formatCurrency(value: number, currency = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("id-ID");
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    meta: "Meta Ads",
    google: "Google Ads",
    tiktok: "TikTok Ads",
    kol: "KOL",
    organic_instagram: "IG Organic",
    organic_tiktok: "TikTok Organic",
    whatsapp_lead: "WhatsApp Lead",
    manual: "Manual",
    instagram: "Instagram",
  };
  return labels[platform] || platform;
}

export function platformColor(platform: string): string {
  const colors: Record<string, string> = {
    meta: "#1877F2",
    google: "#EA4335",
    tiktok: "#69C9D0",
    kol: "#A855F7",
    organic_instagram: "#F97316",
    organic_tiktok: "#06B6D4",
    whatsapp_lead: "#25D366",
    manual: "#9CA3AF",
    instagram: "#E1306C",
  };
  return colors[platform] || "#9CA3AF";
}

export function getPlatformColor(platform: string): string {
  return platformColor(platform);
}

export function getPlatformBgClass(platform: string): string {
  const classes: Record<string, string> = {
    meta: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    google: "bg-red-500/20 text-red-300 border-red-500/30",
    tiktok: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    kol: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    organic_instagram: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    organic_tiktok: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    whatsapp_lead: "bg-green-500/20 text-green-300 border-green-500/30",
    manual: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };
  return classes[platform] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
}

export function getStatusBgClass(status: string): string {
  const classes: Record<string, string> = {
    active: "bg-lime-200 text-lime border-lime-300",
    paused: "bg-yellow-200 text-yellow border-yellow-400",
    completed: "bg-cream-10 text-cream border-cream-10",
    draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    generating: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    ready: "bg-lime-200 text-lime border-lime-300",
  };
  return classes[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

export function getStatusColor(status: string): string {
  return getStatusBgClass(status);
}
