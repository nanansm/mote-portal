import { NavLink } from "react-router-dom";
import { LayoutDashboard, Megaphone, FileText, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/dashboard/reports", label: "Reports", icon: FileText },
  { to: "/dashboard/profile", label: "Profile", icon: User },
];

export function ClientSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden md:flex flex-col bg-[#113B2A] w-16 lg:w-60 transition-all duration-200">
      <div className="flex h-16 items-center justify-center lg:justify-start gap-2 px-0 lg:px-5 border-b border-yellow/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow shrink-0">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-green-dark">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="hidden lg:block">
            <span className="text-yellow font-bold text-sm tracking-tight">mote kreatif</span>
            <span className="text-lime">.</span>
            <p className="text-cream/40 text-[10px] -mt-0.5 truncate max-w-[110px]">{user?.name || "Client"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-2 lg:p-3 pt-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-center lg:justify-start gap-3 rounded-xl px-0 lg:px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-yellow text-green-dark font-semibold"
                  : "text-cream/60 hover:bg-yellow/10 hover:text-cream"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-yellow/10 p-2 lg:p-3">
        <div className="flex items-center justify-center lg:justify-start gap-3 rounded-xl p-2">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover ring-2 ring-yellow/20 shrink-0" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow text-green-dark text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0 hidden lg:block">
            <p className="text-xs font-semibold text-cream truncate">{user?.name}</p>
            <p className="text-[10px] text-cream/40 truncate">{user?.email}</p>
          </div>
          <button onClick={() => logout()} title="Logout" className="hidden lg:flex rounded-lg p-1.5 text-cream/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
