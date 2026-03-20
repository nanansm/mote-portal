import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { MetricCard } from "@/components/shared/MetricCard";
import { formatIDR, formatNumber, platformLabel, getPlatformBgClass, getStatusBgClass } from "@/lib/utils";
import { RefreshCw, Plus, Trash2, ArrowLeft, Key } from "lucide-react";
import { PLATFORM_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";

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

export function AdminClientDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: clientData, isLoading } = useQuery<{ data: any }>({
    queryKey: ["admin", "client", id],
    queryFn: () => api.get(`/api/admin/clients/${id}`),
  });
  const { data: campaignsData } = useQuery<{ data: any[] }>({
    queryKey: ["admin", "campaigns", id],
    queryFn: () => api.get(`/api/admin/campaigns?clientId=${id}`),
  });
  const { data: kolData } = useQuery<{ data: any[] }>({
    queryKey: ["admin", "kol", id],
    queryFn: () => api.get(`/api/admin/kol/${id}`),
  });
  const { data: sheetsData } = useQuery<{ data: any[] }>({
    queryKey: ["admin", "sheets", id],
    queryFn: () => api.get(`/api/admin/sheets/${id}`),
  });
  const { data: credsData } = useQuery<{ data: any[] }>({
    queryKey: ["admin", "creds", id],
    queryFn: () => api.get(`/api/admin/credentials/${id}`),
  });

  const syncMutation = useMutation({
    mutationFn: (platform: string) => api.post(`/api/sync/${platform}/${id}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "campaigns", id] }),
  });

  // Campaign form
  const [camOpen, setCamOpen] = useState(false);
  const [camForm, setCamForm] = useState({
    name: "", platform: "meta", objective: "", budget: "", status: "draft", startDate: "", endDate: "",
  });
  const createCamMutation = useMutation({
    mutationFn: (body: typeof camForm) => api.post("/api/admin/campaigns", { ...body, clientId: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "campaigns", id] });
      setCamOpen(false);
    },
  });

  // Metric form
  const [metOpen, setMetOpen] = useState(false);
  const [selCampaign, setSelCampaign] = useState("");
  const [metForm, setMetForm] = useState({
    date: "", impressions: "", reach: "", clicks: "", spend: "", conversions: "", engagements: "", source: "manual",
  });
  const createMetMutation = useMutation({
    mutationFn: (body: typeof metForm) => api.post(`/api/admin/campaigns/${selCampaign}/metrics`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "campaigns", id] });
      setMetOpen(false);
    },
  });

  // KOL form
  const [kolOpen, setKolOpen] = useState(false);
  const [kolForm, setKolForm] = useState({
    creatorName: "", platform: "instagram", reach: "", engagements: "", contentUrl: "", activationDate: "",
  });
  const createKolMutation = useMutation({
    mutationFn: (b: typeof kolForm) => api.post(`/api/admin/kol/${id}`, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "kol", id] });
      setKolOpen(false);
    },
  });
  const deleteKolMutation = useMutation({
    mutationFn: (kId: string) => api.delete(`/api/admin/kol/${kId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "kol", id] }),
  });

  // Sheet form
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetForm, setSheetForm] = useState({ sheetUrl: "", sheetName: "" });
  const createSheetMutation = useMutation({
    mutationFn: (b: typeof sheetForm) => api.post(`/api/admin/sheets/${id}`, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sheets", id] });
      setSheetOpen(false);
    },
  });

  // Metrics date range
  const [metricsDays, setMetricsDays] = useState(30);
  const { data: dashData } = useQuery<{ data: any }>({
    queryKey: ["admin", "client-dashboard", id, metricsDays],
    queryFn: () => api.get(`/api/admin/clients/${id}/dashboard?days=${metricsDays}`),
  });

  // API Cred form
  const [credOpen, setCredOpen] = useState(false);
  const [credForm, setCredForm] = useState({ platform: "meta", accessToken: "", refreshToken: "", accountId: "", igAccountId: "" });
  const createCredMutation = useMutation({
    mutationFn: (b: typeof credForm) => api.post(`/api/admin/credentials/${id}`, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "creds", id] });
      setCredOpen(false);
    },
  });
  const deleteCredMutation = useMutation({
    mutationFn: (cId: string) => api.delete(`/api/admin/credentials/${cId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "creds", id] }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const client = clientData?.data;
  const campaigns = campaignsData?.data || [];
  const kols = kolData?.data || [];
  const sheets = sheetsData?.data || [];
  const creds = credsData?.data || [];

  const totalBudget = campaigns.reduce((s: number, c: any) => s + parseFloat(c.budget || "0"), 0);
  const activeCampaigns = campaigns.filter((c: any) => c.status === "active").length;

  const ns = "flex h-10 w-full rounded-xl border border-yellow/20 bg-navy px-4 py-2 text-sm text-cream focus:outline-none focus:border-yellow";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          to="/admin/clients"
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-yellow/20 text-cream/50 hover:text-yellow hover:border-yellow/40 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow/20 text-yellow text-xl font-bold">
              {client?.brandName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-cream">{client?.brandName}</h1>
              <p className="text-cream/50 text-sm">{client?.industry} · {client?.contactEmail}</p>
            </div>
            <span className={`ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${client?.isActive ? "bg-lime/20 text-lime border-lime/30" : "bg-cream/10 text-cream/50 border-cream/20"}`}>
              {client?.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Total Budget" value={formatIDR(totalBudget)} icon={undefined} accent="yellow" />
        <MetricCard title="Active Campaigns" value={String(activeCampaigns)} subtitle={`of ${campaigns.length} total`} icon={undefined} accent="lime" />
        <MetricCard title="KOL Activations" value={String(kols.length)} icon={undefined} accent="cream" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="campaigns">
        <TabsList className="flex-wrap">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="kol">KOL</TabsTrigger>
          <TabsTrigger value="credentials">API Credentials</TabsTrigger>
          <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
        </TabsList>

        {/* Campaigns */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Campaigns ({campaigns.length})</CardTitle>
              <Button size="sm" className="gap-1.5" onClick={() => setCamOpen(true)}>
                <Plus className="h-3.5 w-3.5" />Add Campaign
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-yellow/[0.15] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-yellow/10 bg-navy/60">
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">Platform</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c: any) => (
                      <tr key={c.id} className="border-b border-yellow/10 hover:bg-yellow/[0.04] transition-colors">
                        <td className="px-4 py-3 font-medium text-cream">{c.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPlatformBgClass(c.platform)}`}>
                            {platformLabel(c.platform)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBgClass(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-cream/70">
                          {formatIDR(parseFloat(c.budget || "0"))}
                        </td>
                      </tr>
                    ))}
                    {campaigns.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-cream/40">No campaigns yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics */}
        <TabsContent value="metrics">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Performance Summary</CardTitle>
                <div className="flex items-center gap-1 rounded-xl border border-yellow/20 bg-navy p-1">
                  {([7, 30, 90] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setMetricsDays(d)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${metricsDays === d ? "bg-yellow text-green-dark font-semibold" : "text-cream/60 hover:text-cream hover:bg-yellow/10"}`}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {dashData?.data ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-yellow/15 bg-navy/40 p-4">
                      <p className="text-xs text-cream/50 mb-1">Total Spend</p>
                      <p className="text-lg font-bold text-yellow">{formatIDR(dashData.data.summary.totalSpend)}</p>
                    </div>
                    <div className="rounded-xl border border-yellow/15 bg-navy/40 p-4">
                      <p className="text-xs text-cream/50 mb-1">Impressions</p>
                      <p className="text-lg font-bold text-cream">{formatNumber(dashData.data.summary.totalImpressions)}</p>
                    </div>
                    <div className="rounded-xl border border-yellow/15 bg-navy/40 p-4">
                      <p className="text-xs text-cream/50 mb-1">Clicks</p>
                      <p className="text-lg font-bold text-cream">{formatNumber(dashData.data.summary.totalClicks)}</p>
                    </div>
                    <div className="rounded-xl border border-yellow/15 bg-navy/40 p-4">
                      <p className="text-xs text-cream/50 mb-1">Conversions</p>
                      <p className="text-lg font-bold text-cream">{formatNumber(dashData.data.summary.totalConversions)}</p>
                    </div>
                    <div className="rounded-xl border border-yellow/15 bg-navy/40 p-4">
                      <p className="text-xs text-cream/50 mb-1">Reach</p>
                      <p className="text-lg font-bold text-cream">{formatNumber(dashData.data.summary.totalReach)}</p>
                    </div>
                    <div className="rounded-xl border border-yellow/15 bg-navy/40 p-4">
                      <p className="text-xs text-cream/50 mb-1">Engagements</p>
                      <p className="text-lg font-bold text-cream">{formatNumber(dashData.data.summary.totalEngagements)}</p>
                    </div>
                    <div className="rounded-xl border border-yellow/15 bg-navy/40 p-4">
                      <p className="text-xs text-cream/50 mb-1">Overall ROAS</p>
                      <p className="text-lg font-bold text-yellow">{dashData.data.summary.overallROAS.toFixed(2)}x</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-cream/40 text-sm text-center py-4">Loading metrics...</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Manual Metrics Entry</CardTitle>
                <Button size="sm" className="gap-1.5" onClick={() => setMetOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />Add Metrics
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-cream/50 text-sm">
                  Select a campaign and enter daily metrics manually. For automatic sync use the Sync tab.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* KOL */}
        <TabsContent value="kol">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">KOL Activations ({kols.length})</CardTitle>
              <Button size="sm" className="gap-1.5" onClick={() => setKolOpen(true)}>
                <Plus className="h-3.5 w-3.5" />Add KOL
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {kols.map((kol: any) => (
                  <div
                    key={kol.id}
                    className="flex items-center justify-between rounded-xl border border-yellow/[0.12] bg-navy/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 text-purple-300 text-sm font-bold">
                        {kol.creatorName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-cream text-sm">{kol.creatorName}</p>
                        <p className="text-xs text-cream/40 capitalize">{kol.platform}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-xs text-right">
                        <p className="font-semibold text-cream">{formatNumber(kol.reach || 0)}</p>
                        <p className="text-cream/40">Reach</p>
                      </div>
                      <div className="text-xs text-right">
                        <p className="font-semibold text-cream">{formatNumber(kol.engagements || 0)}</p>
                        <p className="text-cream/40">Engagements</p>
                      </div>
                      {kol.contentUrl && (
                        <a href={kol.contentUrl} target="_blank" rel="noreferrer" className="text-yellow text-xs hover:underline">
                          View
                        </a>
                      )}
                      <button
                        onClick={() => deleteKolMutation.mutate(kol.id)}
                        className="rounded-full p-1.5 text-cream/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {kols.length === 0 && (
                  <p className="text-center py-8 text-cream/40 text-sm">No KOL activations yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Credentials */}
        <TabsContent value="credentials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">API Credentials</CardTitle>
              <Button size="sm" className="gap-1.5" onClick={() => setCredOpen(true)}>
                <Key className="h-3.5 w-3.5" />Add Credential
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {creds.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-yellow/[0.12] bg-navy/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPlatformBgClass(c.platform)}`}>
                        {c.platform}
                      </span>
                      <div>
                        <p className="text-sm text-cream">Account ID: {c.accountId || "—"}</p>
                        {c.igAccountId && (
                          <p className="text-xs text-cream/60">IG Account: {c.igAccountId}</p>
                        )}
                        <p className="text-xs text-cream/40">
                          Token: {c.accessToken ? `${c.accessToken.slice(0, 12)}...` : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${c.isActive ? "bg-lime/20 text-lime border-lime/30" : "bg-cream/10 text-cream/40 border-cream/20"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                      <button
                        onClick={() => deleteCredMutation.mutate(c.id)}
                        className="rounded-full p-1.5 text-cream/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {creds.length === 0 && (
                  <p className="text-center py-8 text-cream/40 text-sm">No API credentials configured</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sheets */}
        <TabsContent value="sheets">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Google Sheet Configs</CardTitle>
              <Button size="sm" className="gap-1.5" onClick={() => setSheetOpen(true)}>
                <Plus className="h-3.5 w-3.5" />Add Sheet
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sheets.map((s: any) => (
                  <div key={s.id} className="rounded-xl border border-yellow/[0.12] bg-navy/40 px-4 py-3">
                    <p className="font-medium text-cream text-sm">{s.sheetName || "Unnamed Sheet"}</p>
                    <a
                      href={s.sheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-yellow hover:underline truncate block mt-0.5"
                    >
                      {s.sheetUrl}
                    </a>
                    <p className="text-xs text-cream/40 mt-1">
                      {s.lastSyncedAt
                        ? `Last synced: ${new Date(s.lastSyncedAt).toLocaleString("id-ID")}`
                        : "Never synced"}
                    </p>
                  </div>
                ))}
                {sheets.length === 0 && (
                  <p className="text-center py-8 text-cream/40 text-sm">No sheets configured</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync */}
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Synchronization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-cream/50 text-sm">
                Trigger a manual sync from connected platforms. API credentials must be configured first.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: "meta", label: "Meta Ads", color: "bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20" },
                  { key: "instagram", label: "Instagram Organic", color: "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20" },
                  { key: "google", label: "Google Ads", color: "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20" },
                  { key: "tiktok", label: "TikTok Ads", color: "bg-pink-500/10 border-pink-500/30 text-pink-300 hover:bg-pink-500/20" },
                  { key: "sheets", label: "Google Sheets", color: "bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20" },
                ].map((p) => (
                  <button
                    key={p.key}
                    disabled={syncMutation.isPending}
                    onClick={() => syncMutation.mutate(p.key)}
                    className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${p.color} disabled:opacity-50`}
                  >
                    <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Sync {p.label}</p>
                      <p className="text-xs opacity-70">Pull latest campaign data</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={camOpen} onOpenChange={setCamOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Campaign</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={camForm.name} onChange={(e) => setCamForm({ ...camForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <select className={ns} value={camForm.platform} onChange={(e) => setCamForm({ ...camForm, platform: e.target.value })}>
                  {PLATFORM_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select className={ns} value={camForm.status} onChange={(e) => setCamForm({ ...camForm, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Budget (IDR)</Label>
                <Input type="number" value={camForm.budget} onChange={(e) => setCamForm({ ...camForm, budget: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Objective</Label>
                <Input value={camForm.objective} onChange={(e) => setCamForm({ ...camForm, objective: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={camForm.startDate} onChange={(e) => setCamForm({ ...camForm, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={camForm.endDate} onChange={(e) => setCamForm({ ...camForm, endDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCamOpen(false)}>Cancel</Button>
            <Button onClick={() => createCamMutation.mutate(camForm)} disabled={createCamMutation.isPending}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={metOpen} onOpenChange={setMetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Metrics</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Campaign</Label>
              <select className={ns} value={selCampaign} onChange={(e) => setSelCampaign(e.target.value)}>
                <option value="">Select campaign...</option>
                {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={metForm.date} onChange={(e) => setMetForm({ ...metForm, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["impressions", "reach", "clicks", "spend", "conversions", "engagements"].map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label className="capitalize">{field}</Label>
                  <Input
                    type="number"
                    value={(metForm as any)[field]}
                    onChange={(e) => setMetForm({ ...metForm, [field]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMetMutation.mutate(metForm)}
              disabled={createMetMutation.isPending || !selCampaign}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={kolOpen} onOpenChange={setKolOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add KOL Activation</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Creator Name</Label>
              <Input value={kolForm.creatorName} onChange={(e) => setKolForm({ ...kolForm, creatorName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <select className={ns} value={kolForm.platform} onChange={(e) => setKolForm({ ...kolForm, platform: e.target.value })}>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Reach</Label>
                <Input type="number" value={kolForm.reach} onChange={(e) => setKolForm({ ...kolForm, reach: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Engagements</Label>
                <Input type="number" value={kolForm.engagements} onChange={(e) => setKolForm({ ...kolForm, engagements: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Content URL</Label>
              <Input value={kolForm.contentUrl} onChange={(e) => setKolForm({ ...kolForm, contentUrl: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Activation Date</Label>
              <Input type="date" value={kolForm.activationDate} onChange={(e) => setKolForm({ ...kolForm, activationDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKolOpen(false)}>Cancel</Button>
            <Button onClick={() => createKolMutation.mutate(kolForm)} disabled={createKolMutation.isPending}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={credOpen} onOpenChange={setCredOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add API Credential</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <select className={ns} value={credForm.platform} onChange={(e) => setCredForm({ ...credForm, platform: e.target.value })}>
                <option value="meta">Meta</option>
                <option value="google">Google</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Account ID {credForm.platform === "meta" ? "(Meta Ads Account ID)" : ""}</Label>
              <Input value={credForm.accountId} onChange={(e) => setCredForm({ ...credForm, accountId: e.target.value })} placeholder={credForm.platform === "meta" ? "e.g. act_123456789" : ""} />
            </div>
            {credForm.platform === "meta" && (
              <div className="space-y-1.5">
                <Label>Instagram Business Account ID</Label>
                <Input value={credForm.igAccountId} onChange={(e) => setCredForm({ ...credForm, igAccountId: e.target.value })} placeholder="e.g. 17841400455970027" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Access Token</Label>
              <Input value={credForm.accessToken} onChange={(e) => setCredForm({ ...credForm, accessToken: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Refresh Token (optional)</Label>
              <Input value={credForm.refreshToken} onChange={(e) => setCredForm({ ...credForm, refreshToken: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCredOpen(false)}>Cancel</Button>
            <Button onClick={() => createCredMutation.mutate(credForm)} disabled={createCredMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Google Sheet</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Sheet URL</Label>
              <Input
                value={sheetForm.sheetUrl}
                onChange={(e) => setSheetForm({ ...sheetForm, sheetUrl: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tab Name</Label>
              <Input
                value={sheetForm.sheetName}
                onChange={(e) => setSheetForm({ ...sheetForm, sheetName: e.target.value })}
                placeholder="Sheet1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button onClick={() => createSheetMutation.mutate(sheetForm)} disabled={createSheetMutation.isPending}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
