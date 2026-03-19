import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Building2, Globe, Mail, Phone, Calendar, User } from "lucide-react";

interface ClientProfile {
  id: string; brandName: string; industry: string | null;
  logoUrl: string | null; website: string | null;
  contactEmail: string | null; contactPhone: string | null;
  notes: string | null; isActive: boolean;
}

export function MyProfile() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery<{ data: ClientProfile }>({
    queryKey: ["client", "profile"],
    queryFn: () => api.get("/api/client/profile"),
  });
  const profile = data?.data;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-cream">Profile</h1>
        <p className="text-cream/50 mt-0.5">Your account and brand information</p>
      </div>

      {/* User account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-yellow" />Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full ring-2 ring-yellow/30 object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow/20 text-yellow text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-bold text-cream">{user?.name}</p>
              <p className="text-cream/50 text-sm">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Calendar className="h-3.5 w-3.5 text-cream/30" />
                <p className="text-xs text-cream/40">
                  Last sign in:{" "}
                  {user?.lastSignedIn
                    ? new Date(user.lastSignedIn).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-yellow/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cream/40">Google Account</span>
              <span className="inline-flex items-center rounded-full border border-lime/30 bg-lime/20 px-2.5 py-0.5 text-xs font-semibold text-lime">Connected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand info */}
      {isLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : profile ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-yellow" />Brand Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Brand header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-navy/60 border border-yellow/10">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={profile.brandName} className="h-14 w-14 rounded-xl object-contain bg-white/5 p-1" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-yellow/20 text-yellow text-2xl font-bold">
                  {profile.brandName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-bold text-cream">{profile.brandName}</p>
                {profile.industry && (
                  <span className="inline-flex items-center rounded-full border border-cream/10 bg-cream/5 px-2.5 py-0.5 text-xs text-cream/50 mt-1">
                    {profile.industry}
                  </span>
                )}
              </div>
              <div className="ml-auto">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${profile.isActive ? "bg-lime/20 text-lime border-lime/30" : "bg-cream/10 text-cream/50 border-cream/20"}`}>
                  {profile.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Contact details */}
            <div className="space-y-3">
              {profile.website && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow/10">
                    <Globe className="h-4 w-4 text-yellow" />
                  </div>
                  <div>
                    <p className="text-xs text-cream/40">Website</p>
                    <a href={profile.website} target="_blank" rel="noreferrer" className="text-sm text-yellow hover:underline">{profile.website}</a>
                  </div>
                </div>
              )}
              {profile.contactEmail && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow/10">
                    <Mail className="h-4 w-4 text-yellow" />
                  </div>
                  <div>
                    <p className="text-xs text-cream/40">Contact Email</p>
                    <p className="text-sm text-cream/70">{profile.contactEmail}</p>
                  </div>
                </div>
              )}
              {profile.contactPhone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow/10">
                    <Phone className="h-4 w-4 text-yellow" />
                  </div>
                  <div>
                    <p className="text-xs text-cream/40">Contact Phone</p>
                    <p className="text-sm text-cream/70">{profile.contactPhone}</p>
                  </div>
                </div>
              )}
              {!profile.website && !profile.contactEmail && !profile.contactPhone && (
                <p className="text-sm text-cream/40 text-center py-4">No contact details available</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-10 w-10 text-cream/20 mx-auto mb-3" />
            <p className="text-cream/40">Brand profile not configured yet.</p>
            <p className="text-xs text-cream/30 mt-1">Contact your account manager to set up your brand profile.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
