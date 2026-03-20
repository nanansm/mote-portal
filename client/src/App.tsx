import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullPageSpinner } from "@/components/shared/LoadingSpinner";

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";

import { LoginPage } from "@/pages/Login";
import { AdminOverview } from "@/pages/admin/Overview";
import { AdminClients } from "@/pages/admin/Clients";
import { AdminClientDetail } from "@/pages/admin/ClientDetail";
import { AdminCampaigns } from "@/pages/admin/Campaigns";
import { AdminReports } from "@/pages/admin/Reports";
import { AdminSettings } from "@/pages/admin/Settings";
import { MyDashboard } from "@/pages/dashboard/MyDashboard";
import { MyCampaigns } from "@/pages/dashboard/MyCampaigns";
import { MyReports } from "@/pages/dashboard/MyReports";
import { MyProfile } from "@/pages/dashboard/MyProfile";

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-navy">
      <AdminSidebar />
      {/* md: offset by icon sidebar (64px), lg: offset by full sidebar (240px) */}
      <div className="flex flex-1 flex-col md:pl-16 lg:pl-60">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 animate-fade-in">{children}</main>
      </div>
      <BottomNav isAdmin />
    </div>
  );
}

function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-navy">
      <ClientSidebar />
      {/* md: offset by icon sidebar (64px), lg: offset by full sidebar (240px) */}
      <div className="flex flex-1 flex-col md:pl-16 lg:pl-60">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 animate-fade-in">{children}</main>
      </div>
      <BottomNav isAdmin={false} />
    </div>
  );
}

function RequireAuth({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<RequireAuth admin><AdminLayout><AdminOverview /></AdminLayout></RequireAuth>} />
        <Route path="/admin/clients" element={<RequireAuth admin><AdminLayout><AdminClients /></AdminLayout></RequireAuth>} />
        <Route path="/admin/clients/:id" element={<RequireAuth admin><AdminLayout><AdminClientDetail /></AdminLayout></RequireAuth>} />
        <Route path="/admin/campaigns" element={<RequireAuth admin><AdminLayout><AdminCampaigns /></AdminLayout></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAuth admin><AdminLayout><AdminReports /></AdminLayout></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth admin><AdminLayout><AdminSettings /></AdminLayout></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><ClientLayout><MyDashboard /></ClientLayout></RequireAuth>} />
        <Route path="/dashboard/campaigns" element={<RequireAuth><ClientLayout><MyCampaigns /></ClientLayout></RequireAuth>} />
        <Route path="/dashboard/reports" element={<RequireAuth><ClientLayout><MyReports /></ClientLayout></RequireAuth>} />
        <Route path="/dashboard/profile" element={<RequireAuth><ClientLayout><MyProfile /></ClientLayout></RequireAuth>} />
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function RootRedirect() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
}
