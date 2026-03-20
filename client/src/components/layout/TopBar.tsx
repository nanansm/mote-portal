import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-yellow/10 bg-navy px-4 md:px-6">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-green-dark">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <span className="text-yellow font-bold text-sm tracking-tight">mote<span className="text-lime">.</span></span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 sm:gap-3">
        <button className="relative flex h-8 w-8 items-center justify-center rounded-full text-cream/50 hover:bg-yellow/10 hover:text-yellow transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-yellow" />
        </button>
        <div className="flex items-center gap-2 rounded-full border border-yellow/20 bg-green-dark px-2.5 py-1.5">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow text-green-dark text-[10px] font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden sm:inline text-xs font-medium text-cream">{user?.name?.split(" ")[0]}</span>
          <span className="h-1 w-1 rounded-full bg-lime" />
        </div>
      </div>
    </header>
  );
}
