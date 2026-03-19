import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "admin" | "client";
  lastSignedIn: string | null;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{ data: User }>({
    queryKey: ["auth", "me"],
    queryFn: () => api.get("/api/auth/me"),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post("/api/auth/logout", {}),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  return {
    user: data?.data ?? null,
    isLoading,
    isAuthenticated: !!data?.data,
    isAdmin: data?.data?.role === "admin",
    error,
    logout: logoutMutation.mutate,
  };
}
