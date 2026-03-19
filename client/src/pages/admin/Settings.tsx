import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DataTable, Column } from "@/components/shared/DataTable";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  createdAt: string;
  lastSignedIn: string | null;
}

export function AdminSettings() {
  const { data, isLoading } = useQuery<{ data: User[] }>({
    queryKey: ["admin", "users"],
    queryFn: () => api.get("/api/admin/users"),
  });

  const users = data?.data || [];

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "User",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.avatar ? (
            <img
              src={row.avatar}
              className="h-8 w-8 rounded-full ring-2 ring-yellow/20"
              alt={row.name}
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow/20 text-yellow text-xs font-bold">
              {row.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-cream text-sm">{row.name}</p>
            <p className="text-xs text-cream/40">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${row.role === "admin" ? "bg-yellow/20 text-yellow border-yellow/40" : "bg-cream/10 text-cream/60 border-cream/20"}`}>
          {row.role}
        </span>
      ),
    },
    {
      key: "lastSignedIn",
      header: "Last Sign In",
      render: (row) => (
        <span className="text-cream/50 text-sm">
          {row.lastSignedIn
            ? new Date(row.lastSignedIn).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
            : "Never"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (row) => (
        <span className="text-cream/50 text-sm">
          {new Date(row.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-cream">Settings</h1>
        <p className="text-cream/50 mt-0.5">System configuration and user management</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
          <CardDescription>
            All registered users. To promote a user to admin, update their role directly in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              keyExtractor={(u) => u.id}
              emptyMessage="No users registered yet."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Information</CardTitle>
          <CardDescription>Runtime configuration</CardDescription>
        </CardHeader>
        <CardContent>
          {[
            { label: "App Version", value: "1.0.0" },
            { label: "Platform", value: "Mote Kreatif SaaS Dashboard" },
            { label: "Stack", value: "React · Node.js · MySQL · Drizzle ORM" },
            { label: "Auth", value: "Google OAuth 2.0 + JWT" },
            { label: "Deployment", value: "Easypanel (Docker)" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex justify-between py-3 border-b border-yellow/10 last:border-0"
            >
              <span className="text-cream/50 text-sm">{item.label}</span>
              <span className="text-cream font-mono text-sm">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
