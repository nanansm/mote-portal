import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardData } from "../../../shared/types";

export function useDashboard(startDate: string, endDate: string) {
  return useQuery<{ data: DashboardData }>({
    queryKey: ["dashboard", startDate, endDate],
    queryFn: () => api.get(`/api/client/dashboard?startDate=${startDate}&endDate=${endDate}`),
    staleTime: 1000 * 60 * 2,
  });
}
