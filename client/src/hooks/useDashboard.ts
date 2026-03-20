import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardData } from "../../../shared/types";

export function useDashboard(days: number = 30) {
  return useQuery<{ data: DashboardData }>({
    queryKey: ["dashboard", days],
    queryFn: () => api.get(`/api/client/dashboard?days=${days}`),
    staleTime: 1000 * 60 * 2,
  });
}
