import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  assignDeliveryCourierAdmin,
  fetchAdminCouriers,
  fetchAdminDeliveries,
  formatDateFr,
  formatStatutLabel,
} from "@/lib/admin-api";

export const Route = createFileRoute("/admin/livraisons")({
  component: LivraisonsPage,
});

function LivraisonsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDelivery, setSelectedDelivery] = useState("");
  const [selectedCourier, setSelectedCourier] = useState("");
  const [assigning, setAssigning] = useState(false);

  const deliveriesQuery = useQuery({
    queryKey: ["admin", "deliveries", statusFilter],
    queryFn: () => fetchAdminDeliveries(statusFilter === "all" ? undefined : statusFilter),
  });

  const couriersQuery = useQuery({
    queryKey: ["admin", "couriers"],
    queryFn: fetchAdminCouriers,
  });

  const deliveries = deliveriesQuery.data ?? [];
  const couriers = couriersQuery.data ?? [];

  const rows = deliveries.map((d) => [
    d.id.slice(0, 8),
    d.commande?.numero || "—",
    d.livreur?.nom || "Non assigné",
    d.adresse || "—",
    <Badge key={`st-${d.id}`} variant="secondary">
      {formatStatutLabel(d.statut)}
    </Badge>,
    formatDateFr(d.created_at),
  ]);

  const assign = async () => {
    if (!selectedDelivery || !selectedCourier) return;
    setAssigning(true);
    try {
      await assignDeliveryCourierAdmin(selectedDelivery, selectedCourier);
      await queryClient.invalidateQueries({ queryKey: ["admin", "deliveries"] });
      setOpen(false);
      setSelectedDelivery("");
      setSelectedCourier("");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Livraisons"
        description="Suivi et assignation des livraisons"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Assigner un livreur</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assigner un livreur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Livraison</Label>
                  <Select value={selectedDelivery} onValueChange={setSelectedDelivery}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une livraison" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveries.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.commande?.numero || d.id.slice(0, 8)} — {formatStatutLabel(d.statut)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Livreur</Label>
                  <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un livreur" />
                    </SelectTrigger>
                    <SelectContent>
                      {couriers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.utilisateur?.nom || c.id.slice(0, 8)} — {c.type_vehicule}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button disabled={assigning || !selectedDelivery || !selectedCourier} onClick={() => void assign()}>
                  {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assigner"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input placeholder="Rechercher (ID livraison)" className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="en_route">En route</SelectItem>
            <SelectItem value="livree">Livrée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {deliveriesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <DataTable
          columns={["ID", "Commande", "Livreur", "Adresse", "Statut", "Date"]}
          rows={rows}
          emptyTitle="Aucune livraison"
          emptyDescription="Les livraisons en cours apparaîtront ici."
        />
      )}
    </div>
  );
}
