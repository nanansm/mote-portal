import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getStatusBgClass } from "@/lib/utils";
import { FileText, Download, Plus, CheckCircle, Clock, XCircle } from "lucide-react";

export function AdminReports() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ clientId: "", title: "", periodStart: "", periodEnd: "" });

  const { data: reportsData, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ["admin", "reports"],
    queryFn: () => api.get("/api/admin/reports"),
  });
  const { data: clientsData } = useQuery<{ data: any[] }>({
    queryKey: ["admin", "clients"],
    queryFn: () => api.get("/api/admin/clients"),
  });

  const generateMutation = useMutation({
    mutationFn: (b: typeof form) =>
      api.post(`/api/reports/generate/${b.clientId}`, {
        title: b.title,
        periodStart: b.periodStart,
        periodEnd: b.periodEnd,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      setOpen(false);
      setForm({ clientId: "", title: "", periodStart: "", periodEnd: "" });
    },
  });
  const downloadMutation = useMutation({
    mutationFn: (reportId: string) => api.get<{ data: { url: string } }>(`/api/reports/download/${reportId}`),
    onSuccess: (res) => window.open(res.data.url, "_blank"),
  });

  const reports = reportsData?.data || [];
  const clients = clientsData?.data || [];

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "ready") return <CheckCircle className="h-4 w-4 text-lime" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-red-400" />;
    return <Clock className="h-4 w-4 text-yellow animate-pulse" />;
  };

  const ns = "flex h-10 w-full rounded-xl border border-yellow/20 bg-navy px-4 py-2 text-sm text-cream focus:outline-none focus:border-yellow";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cream">Reports</h1>
          <p className="text-cream/50 mt-0.5">{reports.length} reports generated</p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />Generate Report
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Generate a performance report for a client."
          action={{ label: "Generate Report", onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-4 rounded-xl border border-yellow/[0.15] bg-[#113B2A] p-5 transition-all hover:border-yellow/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow/10">
                <FileText className="h-5 w-5 text-yellow" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-cream text-sm">{r.title}</p>
                <p className="text-xs text-cream/40 mt-0.5">
                  {new Date(r.periodStart).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} —{" "}
                  {new Date(r.periodEnd).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-xs text-cream/30 mt-0.5">
                  Generated: {new Date(r.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <StatusIcon status={r.status} />
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBgClass(r.status)}`}>
                    {r.status}
                  </span>
                </div>
                {r.status === "ready" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadMutation.mutate(r.id)}
                    disabled={downloadMutation.isPending}
                    className="gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />Download
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Performance Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
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
            <div className="space-y-1.5">
              <Label>Report Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="March 2025 Performance Report"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Period Start</Label>
                <Input
                  type="date"
                  value={form.periodStart}
                  onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Period End</Label>
                <Input
                  type="date"
                  value={form.periodEnd}
                  onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => generateMutation.mutate(form)}
              disabled={generateMutation.isPending || !form.clientId || !form.title}
            >
              {generateMutation.isPending ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
