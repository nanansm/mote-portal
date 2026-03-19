import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatIDR, platformLabel, getPlatformBgClass, getStatusBgClass } from "@/lib/utils";
import { Plus, Pencil, Trash2, Megaphone, Search } from "lucide-react";
import { PLATFORM_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget: string;
  currency: string;
  clientId: string;
  brandName: string;
  startDate: string | null;
  endDate: string | null;
  objective: string | null;
}

const emptyForm = {
  clientId: "",
  name: "",
  platform: "meta",
  objective: "",
  budget: "",
  currency: "IDR",
  startDate: "",
  endDate: "",
  status: "draft",
};

export function AdminCampaigns() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data, isLoading } = useQuery<{ data: Campaign[] }>({
    queryKey: ["admin", "campaigns"],
    queryFn: () => api.get("/api/admin/campaigns"),
  });
  const { data: clientsData } = useQuery<{ data: any[] }>({
    queryKey: ["admin", "clients"],
    queryFn: () => api.get("/api/admin/clients"),
  });

  const createMutation = useMutation({
    mutationFn: (b: typeof form) => api.post("/api/admin/campaigns", b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      setOpen(false);
      setForm(emptyForm);
    },
  });
  const updateMutation = useMutation({
    mutationFn: (b: Partial<typeof form>) => api.put(`/api/admin/campaigns/${editing?.id}`, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "campaigns"] }),
  });

  const clients = clientsData?.data || [];
  const campaigns = (data?.data || []).filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.brandName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPlatform && c.platform !== filterPlatform) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  function openEdit(c: Campaign) {
    setEditing(c);
    setForm({
      clientId: c.clientId,
      name: c.name,
      platform: c.platform,
      objective: c.objective || "",
      budget: c.budget || "",
      currency: c.currency,
      startDate: c.startDate || "",
      endDate: c.endDate || "",
      status: c.status,
    });
    setOpen(true);
  }

  const ns = "flex h-10 w-full rounded-xl border border-yellow/20 bg-navy px-4 py-2 text-sm text-cream focus:outline-none focus:border-yellow";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cream">Campaigns</h1>
          <p className="text-cream/50 mt-0.5">{data?.data.length || 0} campaigns across all clients</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}
        >
          <Plus className="h-4 w-4" />New Campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/30" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-56"
          />
        </div>
        <select
          className={`${ns} w-40`}
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
        >
          <option value="">All platforms</option>
          {PLATFORM_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select
          className={`${ns} w-36`}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns found"
          description="Create your first campaign or adjust your filters."
          action={{ label: "New Campaign", onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="rounded-xl border border-yellow/[0.15] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-yellow/10 bg-navy/60">
                {["Campaign", "Platform", "Status", "Budget", "Dates", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-yellow/10 hover:bg-yellow/[0.04] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-cream">{c.name}</p>
                    <p className="text-xs text-cream/40">{c.brandName}</p>
                  </td>
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
                  <td className="px-4 py-3 text-cream/70">{formatIDR(parseFloat(c.budget || "0"))}</td>
                  <td className="px-4 py-3 text-xs text-cream/40">
                    {c.startDate
                      ? new Date(c.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                      : "—"}
                    {c.endDate && ` → ${new Date(c.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-full p-1.5 text-cream/40 hover:text-yellow hover:bg-yellow/10 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(c.id)}
                        className="rounded-full p-1.5 text-cream/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Campaign" : "New Campaign"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {!editing && (
              <div className="space-y-1.5">
                <Label>Client</Label>
                <select
                  className={ns}
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                >
                  <option value="">Select client...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.brandName}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Campaign Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <select className={ns} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                  {PLATFORM_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select className={ns} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Budget (IDR)</Label>
                <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Objective</Label>
                <Input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => editing ? updateMutation.mutate(form) : createMutation.mutate(form)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
