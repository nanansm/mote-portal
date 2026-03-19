import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getStatusBgClass } from "@/lib/utils";
import { FileText, Download, CheckCircle, Clock, XCircle } from "lucide-react";

interface Report {
  id: string; title: string; periodStart: string; periodEnd: string;
  status: "generating" | "ready" | "failed"; createdAt: string;
  llmInsights: string | null;
}

export function MyReports() {
  const { data, isLoading } = useQuery<{ data: Report[] }>({
    queryKey: ["client", "reports"],
    queryFn: () => api.get("/api/client/reports"),
  });

  const downloadMutation = useMutation({
    mutationFn: (reportId: string) => api.get<{ data: { url: string } }>(`/api/reports/download/${reportId}`),
    onSuccess: (res) => window.open(res.data.url, "_blank"),
  });

  const reports = data?.data || [];

  const StatusIcon = ({ status }: { status: Report["status"] }) => {
    if (status === "ready") return <CheckCircle className="h-4 w-4 text-lime" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-red-400" />;
    return <Clock className="h-4 w-4 text-yellow animate-pulse" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cream">Reports</h1>
        <p className="text-cream/50 mt-0.5">Performance reports from your account manager</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Your account manager will generate monthly performance reports for you. Check back soon!"
        />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-yellow/[0.15] bg-[#113B2A] p-5 transition-all hover:border-yellow/30 hover:shadow-md hover:shadow-navy/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow/10">
                  <FileText className="h-5 w-5 text-yellow" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-cream text-sm">{r.title}</p>
                  <p className="text-xs text-cream/40 mt-0.5">
                    Period: {new Date(r.periodStart).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} —{" "}
                    {new Date(r.periodEnd).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-xs text-cream/30 mt-0.5">
                    Generated {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
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
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  )}
                </div>
              </div>

              {/* Insights preview */}
              {r.status === "ready" && r.llmInsights && (
                <div className="mt-4 pt-4 border-t border-yellow/10">
                  <p className="text-xs font-semibold text-cream/50 uppercase tracking-wider mb-2">AI Insights Preview</p>
                  <p className="text-sm text-cream/60 line-clamp-3 leading-relaxed">{r.llmInsights}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
