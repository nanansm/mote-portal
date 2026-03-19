import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardData } from "../../../shared/types";

export function useDashboard() {
  return useQuery<{ data: DashboardData }>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/api/client/dashboard"),
    staleTime: 1000 * 60 * 2,
  });
}
