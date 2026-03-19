import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-yellow/10 bg-navy px-6">
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-cream/50 hover:bg-yellow/10 hover:text-yellow transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-yellow" />
        </button>
        <div className="flex items-center gap-2.5 rounded-full border border-yellow/20 bg-green-dark px-3 py-1.5">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow text-green-dark text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-cream">{user?.name?.split(" ")[0]}</span>
          <span className="h-1 w-1 rounded-full bg-lime" />
        </div>
      </div>
    </header>
  );
}
