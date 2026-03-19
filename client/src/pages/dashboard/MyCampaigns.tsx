import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatIDR, platformLabel, getPlatformBgClass, getStatusBgClass } from "@/lib/utils";
import { Megaphone, ChevronDown, ChevronUp } from "lucide-react";

interface Campaign {
  id: string; name: string; platform: string; status: string;
  budget: string; currency: string; startDate: string | null;
  endDate: string | null; objective: string | null;
}

export function MyCampaigns() {
  const { data, isLoading } = useQuery<{ data: Campaign[] }>({
    queryKey: ["client", "campaigns"],
    queryFn: () => api.get("/api/client/campaigns"),
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const campaigns = data?.data || [];
  const active = campaigns.filter((c) => c.status === "active");
  const others = campaigns.filter((c) => c.status !== "active");

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cream">Campaigns</h1>
        <p className="text-cream/50 mt-0.5">{campaigns.length} campaigns · {active.length} active</p>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Your account manager will set up campaigns for you. Contact us to get started."
        />
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-cream/40 mb-3">Active</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {active.map((c) => <CampaignCard key={c.id} campaign={c} expanded={expandedId === c.id} onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)} />)}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-cream/40 mb-3">Other Campaigns</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {others.map((c) => <CampaignCard key={c.id} campaign={c} expanded={expandedId === c.id} onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign: c, expanded, onToggle }: { campaign: Campaign; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-yellow/[0.15] bg-[#113B2A] transition-all hover:border-yellow/30">
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-cream truncate">{c.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPlatformBgClass(c.platform)}`}>{platformLabel(c.platform)}</span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBgClass(c.status)}`}>{c.status}</span>
            </div>
          </div>
          <button onClick={onToggle} className="text-cream/40 hover:text-yellow transition-colors mt-1">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-cream/40">Budget</p>
            <p className="text-base font-bold text-yellow mt-0.5">{formatIDR(parseFloat(c.budget || "0"))}</p>
          </div>
          {c.objective && (
            <span className="inline-flex items-center rounded-full border border-cream/10 bg-cream/5 px-2 py-0.5 text-xs text-cream/50">
              {c.objective}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-yellow/10 px-5 py-4 space-y-2">
          {[
            { label: "Start Date", value: c.startDate ? new Date(c.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—" },
            { label: "End Date", value: c.endDate ? new Date(c.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—" },
            { label: "Currency", value: c.currency },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-cream/40">{item.label}</span>
              <span className="text-cream/70">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
