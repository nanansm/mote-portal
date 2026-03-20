import {
  mysqlTable,
  varchar,
  text,
  int,
  boolean,
  timestamp,
  date,
  decimal,
  json,
  mysqlEnum,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  googleId: varchar("google_id", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  avatar: varchar("avatar", { length: 500 }),
  role: mysqlEnum("role", ["admin", "client"]).notNull().default("client"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("last_signed_in"),
});

export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  brandName: varchar("brand_name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 255 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  website: varchar("website", { length: 500 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const campaigns = mysqlTable("campaigns", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id),
  name: varchar("name", { length: 255 }).notNull(),
  platform: mysqlEnum("platform", [
    "meta",
    "google",
    "tiktok",
    "kol",
    "organic_instagram",
    "organic_tiktok",
    "whatsapp_lead",
    "manual",
  ]).notNull(),
  externalCampaignId: varchar("external_campaign_id", { length: 255 }),
  objective: varchar("objective", { length: 255 }),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("IDR").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: mysqlEnum("status", ["active", "paused", "completed", "draft"]).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const campaignMetrics = mysqlTable("campaign_metrics", {
  id: varchar("id", { length: 36 }).primaryKey(),
  campaignId: varchar("campaign_id", { length: 36 }).notNull().references(() => campaigns.id),
  date: date("date").notNull(),
  impressions: int("impressions").default(0),
  reach: int("reach").default(0),
  clicks: int("clicks").default(0),
  engagements: int("engagements").default(0),
  conversions: int("conversions").default(0),
  followers: int("followers").default(0),
  spend: decimal("spend", { precision: 15, scale: 2 }).default("0"),
  revenue: decimal("revenue", { precision: 15, scale: 2 }).default("0"),
  ctr: decimal("ctr", { precision: 10, scale: 4 }).default("0"),
  cpc: decimal("cpc", { precision: 15, scale: 2 }).default("0"),
  cpm: decimal("cpm", { precision: 15, scale: 2 }).default("0"),
  roas: decimal("roas", { precision: 10, scale: 4 }).default("0"),
  conversionRate: decimal("conversion_rate", { precision: 10, scale: 4 }).default("0"),
  rawData: json("raw_data"),
  source: mysqlEnum("source", ["api", "google_sheet", "manual"]).default("manual"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiCredentials = mysqlTable("api_credentials", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id),
  platform: mysqlEnum("platform", ["meta", "google", "tiktok"]).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accountId: varchar("account_id", { length: 255 }),
  igAccountId: varchar("ig_account_id", { length: 255 }),
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id),
  title: varchar("title", { length: 255 }).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  llmInsights: text("llm_insights"),
  pdfUrl: varchar("pdf_url", { length: 500 }),
  pdfKey: varchar("pdf_key", { length: 500 }),
  status: mysqlEnum("status", ["generating", "ready", "failed"]).notNull().default("generating"),
  generatedBy: varchar("generated_by", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const kolActivations = mysqlTable("kol_activations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id),
  campaignId: varchar("campaign_id", { length: 36 }).references(() => campaigns.id),
  creatorName: varchar("creator_name", { length: 255 }).notNull(),
  platform: mysqlEnum("platform", ["instagram", "tiktok"]).notNull(),
  contentUrl: varchar("content_url", { length: 500 }),
  reach: int("reach").default(0),
  engagements: int("engagements").default(0),
  notes: text("notes"),
  activationDate: date("activation_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const googleSheetConfigs = mysqlTable("google_sheet_configs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id),
  sheetUrl: varchar("sheet_url", { length: 500 }).notNull(),
  sheetName: varchar("sheet_name", { length: 255 }),
  lastSyncedAt: timestamp("last_synced_at"),
  tiktokSyncedAt: timestamp("tiktok_synced_at"),
  omsetSyncedAt: timestamp("omset_synced_at"),
  kolSyncedAt: timestamp("kol_synced_at"),
  whatsappSyncedAt: timestamp("whatsapp_synced_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Stores daily omset (revenue) and whatsapp lead data synced from Google Sheets
export const clientDailyData = mysqlTable(
  "client_daily_data",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
    realOmset: decimal("real_omset", { precision: 15, scale: 2 }).default("0"),
    whatsappLeads: int("whatsapp_leads").default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    uniqClientDate: uniqueIndex("client_daily_data_client_date_idx").on(table.clientId, table.date),
  })
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  client: one(clients, { fields: [users.id], references: [clients.userId] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  campaigns: many(campaigns),
  apiCredentials: many(apiCredentials),
  reports: many(reports),
  kolActivations: many(kolActivations),
  googleSheetConfigs: many(googleSheetConfigs),
  dailyData: many(clientDailyData),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  client: one(clients, { fields: [campaigns.clientId], references: [clients.id] }),
  metrics: many(campaignMetrics),
  kolActivations: many(kolActivations),
}));

export const campaignMetricsRelations = relations(campaignMetrics, ({ one }) => ({
  campaign: one(campaigns, { fields: [campaignMetrics.campaignId], references: [campaigns.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  client: one(clients, { fields: [reports.clientId], references: [clients.id] }),
  generatedByUser: one(users, { fields: [reports.generatedBy], references: [users.id] }),
}));

export const kolActivationsRelations = relations(kolActivations, ({ one }) => ({
  client: one(clients, { fields: [kolActivations.clientId], references: [clients.id] }),
  campaign: one(campaigns, { fields: [kolActivations.campaignId], references: [campaigns.id] }),
}));

export const clientDailyDataRelations = relations(clientDailyData, ({ one }) => ({
  client: one(clients, { fields: [clientDailyData.clientId], references: [clients.id] }),
}));
