import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Megaphone, FileText, User,
  Settings, LogOut, MoreHorizontal, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const clientItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/dashboard/reports", label: "Reports", icon: FileText },
  { to: "/dashboard/profile", label: "Profile", icon: User },
];

const adminItems = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/admin/reports", label: "Reports", icon: FileText },
];

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = isAdmin ? adminItems : clientItems;

  return (
    <>
      {/* Slide-up overlay for admin "More" */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMoreOpen(false)} />
          <div className="relative z-10 rounded-t-2xl bg-[#113B2A] border-t border-yellow/20 px-4 pt-4 pb-8 space-y-2"
               style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-cream">More</p>
              <button onClick={() => setMoreOpen(false)} className="p-1 text-cream/50 hover:text-cream">
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavLink
              to="/admin/settings"
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive ? "bg-yellow text-green-dark" : "text-cream/70 hover:bg-yellow/10 hover:text-cream"
              )}
            >
              <Settings className="h-4 w-4" />Settings
            </NavLink>
            <button
              onClick={() => { logout(); setMoreOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />Logout
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-yellow/20 bg-[#113B2A] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              isActive ? "text-yellow" : "text-cream/50"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-cream/50"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        )}
      </nav>
    </>
  );
}
