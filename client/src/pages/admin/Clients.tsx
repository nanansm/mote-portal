import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Plus, ExternalLink, Pencil, Building2, Search } from "lucide-react";

interface Client {
  id: string;
  brandName: string;
  industry: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
}

const emptyForm = {
  brandName: "",
  industry: "",
  website: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
};

export function AdminClients() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ data: Client[] }>({
    queryKey: ["admin", "clients"],
    queryFn: () => api.get("/api/admin/clients"),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => api.post("/api/admin/clients", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "clients"] });
      setOpen(false);
      setForm(emptyForm);
    },
  });
  const updateMutation = useMutation({
    mutationFn: (body: Partial<typeof form>) => api.put(`/api/admin/clients/${editing?.id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "clients"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
  });

  const clients = (data?.data || []).filter((c) =>
    !search ||
    c.brandName.toLowerCase().includes(search.toLowerCase()) ||
    (c.contactEmail || "").toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(c: Client) {
    setEditing(c);
    setForm({
      brandName: c.brandName,
      industry: c.industry || "",
      website: c.website || "",
      contactEmail: c.contactEmail || "",
      contactPhone: c.contactPhone || "",
      notes: "",
    });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cream">Clients</h1>
          <p className="text-cream/50 mt-0.5">{data?.data.length || 0} brands under management</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/30" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients yet"
          description="Add your first client to get started tracking their brand performance."
          action={{ label: "Add Client", onClick: openCreate }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="group relative flex flex-col rounded-xl border border-yellow/[0.15] bg-[#113B2A] p-5 transition-all duration-200 hover:border-yellow/30 hover:shadow-lg hover:shadow-navy/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow/20 text-yellow text-lg font-bold">
                    {client.brandName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-cream">{client.brandName}</h3>
                    {client.industry && (
                      <span className="inline-flex items-center rounded-full border border-cream/10 bg-cream/5 px-2 py-0.5 text-xs text-cream/50 mt-0.5">
                        {client.industry}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${client.isActive ? "bg-lime/20 text-lime border-lime/30" : "bg-cream/10 text-cream/50 border-cream/20"}`}>
                  {client.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-1.5 flex-1 text-sm">
                {client.userName && (
                  <p className="text-cream/50">
                    <span className="text-cream/30">User:</span> {client.userName}
                  </p>
                )}
                {client.contactEmail && (
                  <p className="text-cream/50 truncate">{client.contactEmail}</p>
                )}
                {client.contactPhone && (
                  <p className="text-cream/50">{client.contactPhone}</p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  to={`/admin/clients/${client.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-yellow/30 text-yellow text-xs font-semibold py-2 hover:bg-yellow/10 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />View Details
                </Link>
                <button
                  onClick={() => openEdit(client)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-yellow/20 text-cream/50 hover:text-yellow hover:border-yellow/40 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Client" : "Add New Client"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Brand Name *</Label>
              <Input
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                placeholder="e.g. Kopi Cantel"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Input
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  placeholder="F&B, Fashion..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Phone</Label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => editing ? updateMutation.mutate(form) : createMutation.mutate(form)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Update" : "Create Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
