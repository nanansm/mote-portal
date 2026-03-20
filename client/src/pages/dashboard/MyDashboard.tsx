import { useState, useMemo } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { MetricCard } from "@/components/shared/MetricCard";
import { FullPageSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  DollarSign, Eye, MousePointer, TrendingUp, Users, MessageCircle,
  BarChart2, Target, Heart, ChevronDown, Calendar
} from "lucide-react";
import {
  formatIDR, formatNumber, formatPercent, platformLabel, platformColor,
  getPlatformBgClass, getStatusBgClass
} from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const PLATFORM_COLORS: Record<string, string> = {
  meta: '#1877F2',
  organic_instagram: '#E1306C',
  organic_tiktok: '#010101',
  kol: '#BDF24A',
  google: '#34A853',
  tiktok: '#010101',
  manual: '#F4D23A',
};
const FALLBACK_COLORS = ['#F4D23A', '#BDF24A', '#69C9D0', '#A855F7', '#F97316'];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-yellow/20 bg-navy px-4 py-3 shadow-xl">
      <p className="text-xs text-cream/50 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString("id-ID") : p.value}
        </p>
      ))}
    </div>
  );
}

type FilterType = "this_month" | "last_month" | "custom";

function getDateRange(type: FilterType, customStart?: string, customEnd?: string): {
  startDate: string; endDate: string; label: string;
} {
  const now = new Date();
  if (type === "this_month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startDate: first.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
      label: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }
  if (type === "last_month") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: first.toISOString().split("T")[0],
      endDate: last.toISOString().split("T")[0],
      label: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }
  const start = customStart || now.toISOString().split("T")[0];
  const end = customEnd || now.toISOString().split("T")[0];
  const startLabel = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return { startDate: start, endDate: end, label: `${startLabel} – ${endLabel}` };
}

export function MyDashboard() {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<FilterType>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const { startDate, endDate, label } = useMemo(
    () => getDateRange(filterType, customStart, customEnd),
    [filterType, customStart, customEnd]
  );

  const { data, isLoading, error } = useDashboard(startDate, endDate);

  const { data: profileData } = useQuery<{ data: any }>({
    queryKey: ["client", "profile"],
    queryFn: () => api.get("/api/client/profile"),
  });

  if (isLoading) return <FullPageSpinner />;
  if (error) return (
    <div className="flex items-center justify-center py-20">
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center max-w-sm">
        <p className="text-red-400 font-semibold">Failed to load dashboard</p>
        <p className="text-cream/50 text-sm mt-1">{error.message}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-yellow text-sm hover:underline">Try again</button>
      </div>
    </div>
  );

  const d = data?.data;
  if (!d) return null;

  const brandName = profileData?.data?.brandName || user?.name?.split(" ")[0] || "there";
  const m = d.metrics;

  const pieData = d.charts.impressionsByPlatform.filter((p: any) => p.impressions && p.impressions > 0);

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Greeting */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-cream">Hi, {brandName} 👋</h1>
          <p className="text-cream/50 mt-0.5 text-sm">{d.period.label} · Your brand performance overview</p>
        </div>

        {/* Date filter */}
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 rounded-xl border border-yellow/20 bg-navy p-1">
            {(["this_month", "last_month"] as FilterType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setFilterType(t); setShowCustom(false); }}
                className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  filterType === t && !showCustom
                    ? "bg-yellow text-green-dark font-semibold"
                    : "text-cream/60 hover:text-cream hover:bg-yellow/10"
                }`}
              >
                {t === "this_month" ? "This Month" : "Last Month"}
              </button>
            ))}
            <button
              onClick={() => { setShowCustom(!showCustom); if (!showCustom) setFilterType("custom"); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                showCustom
                  ? "bg-yellow text-green-dark font-semibold"
                  : "text-cream/60 hover:text-cream hover:bg-yellow/10"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Custom
            </button>
          </div>
          {showCustom && (
            <div className="flex items-center gap-2 rounded-xl border border-yellow/20 bg-navy p-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => { setCustomStart(e.target.value); setFilterType("custom"); }}
                className="rounded-lg border border-yellow/20 bg-green-dark px-2 py-1 text-xs text-cream focus:outline-none focus:border-yellow"
              />
              <span className="text-cream/40 text-xs">–</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => { setCustomEnd(e.target.value); setFilterType("custom"); }}
                className="rounded-lg border border-yellow/20 bg-green-dark px-2 py-1 text-xs text-cream focus:outline-none focus:border-yellow"
              />
            </div>
          )}
        </div>
      </div>

      {/* 11 Metric Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Real Omset"
          value={formatIDR(m.realOmset)}
          icon={DollarSign}
          accent="yellow"
        />
        <MetricCard
          title="Marketing Spent"
          value={formatIDR(m.marketingSpent)}
          icon={TrendingUp}
          accent="lime"
        />
        <MetricCard
          title="Marketing Cost %"
          value={formatPercent(m.marketingCostPercent)}
          icon={Target}
          accent="cream"
          subtitle="of revenue"
        />
        <MetricCard
          title="Content Impression"
          value={formatNumber(m.contentImpression)}
          icon={Eye}
          accent="yellow"
        />
        <MetricCard
          title="Audience Reach"
          value={formatNumber(m.audienceReach)}
          icon={Users}
          accent="lime"
        />
        <MetricCard
          title="Post Interaction"
          value={formatNumber(m.postInteraction)}
          icon={Heart}
          accent="cream"
        />
        <MetricCard
          title="Engagement Rate"
          value={formatPercent(m.engagementRate)}
          icon={BarChart2}
          accent="yellow"
          subtitle="by reach"
        />
        <MetricCard
          title="Audience Follow"
          value={formatNumber(m.audienceFollow)}
          icon={Users}
          accent="lime"
        />
        <MetricCard
          title="Click Link"
          value={formatNumber(m.clickLink)}
          icon={MousePointer}
          accent="cream"
        />
        <MetricCard
          title="CTR"
          value={formatPercent(m.ctr)}
          icon={TrendingUp}
          accent="yellow"
          subtitle="click through rate"
        />
        <MetricCard
          title="Lead WhatsApp"
          value={formatNumber(m.whatsappLeads)}
          icon={MessageCircle}
          accent="lime"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={d.charts.dailySpend} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4D23A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F4D23A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4D23A1A" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fill: "#F7F4EE60", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fill: "#F7F4EE60", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="spend" name="Spend (IDR)" stroke="#F4D23A" strokeWidth={2} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Platform</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-cream/40 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} dataKey="impressions" nameKey="platform" paddingAngle={2}>
                    {pieData.map((entry: any, i: number) => (
                      <Cell key={i} fill={PLATFORM_COLORS[entry.platform] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0];
                      return (
                        <div className="rounded-xl border border-yellow/20 bg-navy px-4 py-3 shadow-xl">
                          <p className="text-xs text-cream/50">{platformLabel(p.name as string)}</p>
                          <p className="text-sm font-bold text-yellow">{formatNumber(p.value as number)}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    formatter={(v) => <span className="text-xs text-cream/60">{platformLabel(v)}</span>}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-yellow/[0.12] overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-yellow/10 bg-navy/60">
                  {["Campaign", "Platform", "Status", "Spend", "Impressions", "Clicks", "CTR", "ROAS"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.campaigns.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-cream/40">No campaigns yet</td></tr>
                ) : d.campaigns.map((c: any) => (
                  <tr key={c.id} className="border-b border-yellow/10 last:border-0 hover:bg-yellow/[0.04] transition-colors">
                    <td className="px-4 py-3 font-medium text-cream">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPlatformBgClass(c.platform)}`}>{platformLabel(c.platform)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBgClass(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-cream/70">{formatIDR(c.spend)}</td>
                    <td className="px-4 py-3 text-cream/70">{formatNumber(c.impressions)}</td>
                    <td className="px-4 py-3 text-cream/70">{formatNumber(c.clicks)}</td>
                    <td className="px-4 py-3 text-cream/70">{c.ctr.toFixed(2)}%</td>
                    <td className="px-4 py-3 font-semibold text-yellow">{c.roas.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* KOL Activations */}
      {d.kolActivations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">KOL Activations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {d.kolActivations.map((kol: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-yellow/[0.1] bg-navy/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 text-purple-300 font-bold text-sm">
                      {kol.creatorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-cream text-sm">{kol.creatorName}</p>
                      <p className="text-xs text-cream/40 capitalize">{kol.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-cream">{formatNumber(kol.reach || 0)}</p>
                      <p className="text-xs text-cream/40">Reach</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-cream">{formatNumber(kol.engagements || 0)}</p>
                      <p className="text-xs text-cream/40">Engagements</p>
                    </div>
                    {kol.contentUrl && (
                      <a href={kol.contentUrl} target="_blank" rel="noreferrer" className="text-xs text-yellow hover:underline hidden sm:block">View →</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
