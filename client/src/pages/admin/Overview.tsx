import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MetricCard } from "@/components/shared/MetricCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import { Building2, Megaphone, FileText, TrendingUp } from "lucide-react";
import { formatIDR, formatNumber, platformLabel, getPlatformBgClass, getStatusBgClass } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-yellow/20 bg-navy px-4 py-3 shadow-xl">
      <p className="text-xs text-cream/50 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value?.toLocaleString?.() ?? p.value}
        </p>
      ))}
    </div>
  );
}

const PLATFORM_COLORS = ['#F4D23A', '#BDF24A', '#69C9D0', '#A855F7', '#F97316', '#06B6D4'];

export function AdminOverview() {
  const { user } = useAuth();

  const { data: clientsData, isLoading: cLoading } = useQuery<{ data: any[] }>({
    queryKey: ["admin", "clients"],
    queryFn: () => api.get("/api/admin/clients"),
  });
  const { data: campaignsData, isLoading: camLoading } = useQuery<{ data: any[] }>({
    queryKey: ["admin", "campaigns"],
    queryFn: () => api.get("/api/admin/campaigns"),
  });
  const { data: reportsData } = useQuery<{ data: any[] }>({
    queryKey: ["admin", "reports"],
    queryFn: () => api.get("/api/admin/reports"),
  });

  const clients = clientsData?.data || [];
  const campaigns = campaignsData?.data || [];
  const reports = reportsData?.data || [];

  const activeClients = clients.filter((c) => c.isActive).length;
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

  const platformCounts: Record<string, number> = {};
  campaigns.forEach((c) => {
    platformCounts[c.platform] = (platformCounts[c.platform] || 0) + 1;
  });
  const platformData = Object.entries(platformCounts).map(([platform, count]) => ({
    platform: platformLabel(platform),
    count,
    key: platform,
  }));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (cLoading || camLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cream">
          {greeting()}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-cream/50 mt-1">Here's what's happening across all clients today.</p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Clients"
          value={String(clients.length)}
          subtitle={`${activeClients} active`}
          icon={Building2}
          accent="yellow"
        />
        <MetricCard
          title="Active Campaigns"
          value={String(activeCampaigns)}
          subtitle={`of ${campaigns.length} total`}
          icon={Megaphone}
          accent="lime"
        />
        <MetricCard
          title="Reports Generated"
          value={String(reports.length)}
          subtitle={`${reports.filter((r) => r.status === "generating").length} generating`}
          icon={FileText}
          accent="cream"
        />
        <MetricCard
          title="Platforms Active"
          value={String(Object.keys(platformCounts).length)}
          subtitle="across all clients"
          icon={TrendingUp}
          accent="yellow"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Campaigns by Platform */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaigns by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            {platformData.length === 0 ? (
              <p className="text-cream/40 text-sm text-center py-8">No campaigns yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={platformData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4D23A1A" vertical={false} />
                  <XAxis
                    dataKey="platform"
                    tick={{ fill: "#F7F4EE80", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#F7F4EE80", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Campaigns" radius={[6, 6, 0, 0]}>
                    {platformData.map((_, i) => (
                      <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Clients</CardTitle>
            <Link to="/admin/clients" className="text-xs text-yellow hover:underline">View all →</Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {clients.slice(0, 6).map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-yellow/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow/20 text-yellow text-xs font-bold">
                    {client.brandName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cream">{client.brandName}</p>
                    <p className="text-xs text-cream/40">{client.userEmail}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${client.isActive ? "bg-lime/20 text-lime border-lime/30" : "bg-cream/10 text-cream/50 border-cream/20"}`}>
                  {client.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
            {clients.length === 0 && (
              <p className="text-cream/40 text-sm text-center py-8">No clients yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Campaigns</CardTitle>
          <Link to="/admin/campaigns" className="text-xs text-yellow hover:underline">View all →</Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {campaigns.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-yellow/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div>
                    <p className="text-sm font-medium text-cream">{c.name}</p>
                    <p className="text-xs text-cream/40">{c.brandName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPlatformBgClass(c.platform)}`}>
                    {platformLabel(c.platform)}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBgClass(c.status)}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && (
              <p className="text-cream/40 text-sm text-center py-8">No campaigns yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
