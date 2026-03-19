import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullPageSpinner } from "@/components/shared/LoadingSpinner";

export function LoginPage() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, isAdmin, navigate]);

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#113B2A] p-12 relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-20 right-10 h-40 w-40 rounded-full bg-yellow/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 h-56 w-56 rounded-full bg-lime/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full border border-yellow/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full border border-yellow/[0.07]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-green-dark">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="text-yellow font-bold text-lg tracking-tight">mote kreatif<span className="text-lime">.</span></span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold leading-tight mb-6">
            <span className="text-yellow">Aktivasi Brand</span>
            <br />
            <span className="text-cream">Terukur &</span>
            <br />
            <span className="text-lime">Transparan.</span>
          </h1>
          <p className="text-cream/60 text-lg leading-relaxed max-w-md">
            Monitor performa kampanye brand aktivasi Anda secara real-time. Data dari semua platform dalam satu dashboard terpadu.
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { value: "50+", label: "Brand Clients" },
              { value: "Rp 10B+", label: "Ad Spend Managed" },
              { value: "200+", label: "Campaigns" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-yellow">{stat.value}</p>
                <p className="text-xs text-cream/50 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-cream/30 text-xs">
          © 2025 Mote Kreatif Digital Agency. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-navy px-8 py-12">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-green-dark">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="text-yellow font-bold text-lg">mote kreatif<span className="text-lime">.</span></span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-cream mb-2">Welcome back</h2>
            <p className="text-cream/50">Sign in to access your brand dashboard</p>
          </div>

          <button
            onClick={() => { window.location.href = "/api/auth/google"; }}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-gray-800 font-semibold text-base shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {window.location.search.includes("error=oauth") && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
              Authentication failed. Please try again.
            </div>
          )}

          <p className="mt-8 text-center text-xs text-cream/30 leading-relaxed">
            Access is restricted to authorized Mote Kreatif clients.<br />
            Contact your account manager if you need access.
          </p>
        </div>

        <p className="mt-12 text-cream/20 text-xs">Powered by Mote Kreatif</p>
      </div>
    </div>
  );
}
