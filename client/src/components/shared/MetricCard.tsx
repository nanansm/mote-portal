import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: number;
  className?: string;
  accent?: "yellow" | "lime" | "cream";
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  accent = "yellow",
}: MetricCardProps) {
  const accentClasses = {
    yellow: "bg-yellow/10 text-yellow",
    lime: "bg-lime/10 text-lime",
    cream: "bg-cream/10 text-cream",
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-yellow/[0.15] bg-[#113B2A] p-5",
        "transition-all duration-200 hover:border-yellow/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-navy/50",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow/[0.03] to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-cream/50 mb-2">{title}</p>
          <p className="text-2xl font-bold text-cream leading-none mb-1">{value}</p>
          {subtitle && <p className="text-xs text-cream/40 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-semibold", trend >= 0 ? "text-lime" : "text-red-400")}>
              <span>{trend >= 0 ? "↑" : "↓"}</span>
              <span>{Math.abs(trend).toFixed(1)}% vs last period</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", accentClasses[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
