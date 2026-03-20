import { useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { MetricCard } from "@/components/shared/MetricCard";
import { FullPageSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from "recharts";
import {
  DollarSign, Eye, MousePointer, TrendingUp, Users, MessageCircle, BarChart2, Target
} from "lucide-react";
import { formatIDR, formatNumber, formatPercent, platformLabel, platformColor, getPlatformBgClass, getStatusBgClass } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const COLORS = ['#F4D23A', '#BDF24A', '#69C9D0', '#A855F7', '#F97316', '#06B6D4', '#EC4899'];

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

type DateRange = "7d" | "30d" | "90d";

export function MyDashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState<DateRange>("30d");
  const daysMap: Record<DateRange, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const { data, isLoading, error } = useDashboard(daysMap[range]);

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

  const pieData = d.impressionsByPlatform.filter((p: any) => p.impressions && p.impressions > 0);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream">Hi, {brandName} 👋</h1>
          <p className="text-cream/50 mt-0.5">Your brand performance overview — real time.</p>
        </div>
        {/* Date range selector */}
        <div className="flex items-center gap-1 rounded-xl border border-yellow/20 bg-navy p-1">
          {(["7d", "30d", "90d"] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${range === r ? "bg-yellow text-green-dark font-semibold" : "text-cream/60 hover:text-cream hover:bg-yellow/10"}`}
            >
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Spend" value={formatIDR(d.summary.totalSpend)} icon={DollarSign} accent="yellow" />
        <MetricCard title="Impressions" value={formatNumber(d.summary.totalImpressions)} icon={Eye} accent="lime" />
        <MetricCard title="Reach" value={formatNumber(d.summary.totalReach)} icon={Users} accent="cream" />
        <MetricCard title="Overall ROAS" value={`${d.summary.overallROAS.toFixed(2)}x`} icon={TrendingUp} accent="yellow" />
        <MetricCard title="Clicks" value={formatNumber(d.summary.totalClicks)} icon={MousePointer} accent="lime" />
        <MetricCard title="Conversions" value={formatNumber(d.summary.totalConversions)} icon={Target} accent="cream" />
        <MetricCard title="Engagements" value={formatNumber(d.summary.totalEngagements)} icon={BarChart2} accent="yellow" />
        <MetricCard title="WhatsApp Leads" value={formatNumber(d.whatsappLeads)} icon={MessageCircle} accent="lime" />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Daily spend - takes 3 cols */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={d.dailySpend} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4D23A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F4D23A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4D23A1A" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fill: "#F7F4EE60", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fill: "#F7F4EE60", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="spend" name="Spend (IDR)" stroke="#F4D23A" strokeWidth={2} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Impressions by platform - takes 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Platform</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-cream/40 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} dataKey="impressions" nameKey="platform" paddingAngle={2}>
                    {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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

      {/* Budget by platform */}
      {d.budgetByPlatform.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Budget Allocation by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={d.budgetByPlatform.map((b: any) => ({ ...b, name: platformLabel(b.platform) }))} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4D23A1A" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#F7F4EE60", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fill: "#F7F4EE60", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="budget" name="Budget (IDR)" radius={[6, 6, 0, 0]}>
                  {d.budgetByPlatform.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Campaigns table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-yellow/[0.12] overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-yellow/10 bg-navy/60">
                  {["Campaign", "Platform", "Status", "Spend", "Impressions", "Clicks", "CTR", "ROAS"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.campaigns.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-cream/40">No campaigns yet</td></tr>
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
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-cream">{formatNumber(kol.reach || 0)}</p>
                      <p className="text-xs text-cream/40">Reach</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-cream">{formatNumber(kol.engagements || 0)}</p>
                      <p className="text-xs text-cream/40">Engagements</p>
                    </div>
                    {kol.contentUrl && (
                      <a href={kol.contentUrl} target="_blank" rel="noreferrer" className="text-xs text-yellow hover:underline">View →</a>
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
