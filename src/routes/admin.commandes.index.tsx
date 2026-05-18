import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAdminOrders, formatDateFr, formatStatutLabel } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/commandes/")({
  component: CommandesPage,
});

function CommandesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const ordersQuery = useQuery({
    queryKey: ["admin", "orders", statusFilter, search],
    queryFn: () =>
      fetchAdminOrders({
        status: statusFilter === "all" ? undefined : statusFilter,
        q: search.trim() || undefined,
      }),
  });

  const rows = useMemo(() => {
    return (ordersQuery.data ?? []).map((o) => [
      <Link
        key={`num-${o.id}`}
        to="/admin/commandes/$id"
        params={{ id: o.id }}
        className="font-medium text-primary hover:underline"
      >
        {o.numero}
      </Link>,
      o.client?.nom || "—",
      `${Number(o.total).toLocaleString("fr-FR")} FCFA`,
      <Badge key={`st-${o.id}`} variant="secondary">
        {formatStatutLabel(o.statut)}
      </Badge>,
      formatDateFr(o.created_at),
      <Button key={`act-${o.id}`} size="sm" variant="outline" asChild>
        <Link to="/admin/commandes/$id" params={{ id: o.id }}>
          Détail
        </Link>
      </Button>,
    ]);
  }, [ordersQuery.data]);

  return (
    <div>
      <PageHeader title="Commandes" description="Toutes les commandes multi-boutiques" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Rechercher (ID, client…)"
          className="max-w-xs"
          value={search}
          onChange={(ev) => setSearch(ev.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="acceptee">Acceptée</SelectItem>
            <SelectItem value="en_preparation">En préparation</SelectItem>
            <SelectItem value="en_livraison">En livraison</SelectItem>
            <SelectItem value="livree">Livrée</SelectItem>
            <SelectItem value="annulee">Annulée</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setStatusFilter("all"); setSearch(""); }}>
          <Filter className="h-4 w-4" /> Réinitialiser
        </Button>
      </div>

      {ordersQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <DataTable
          columns={["ID commande", "Client", "Montant total", "Statut", "Date", "Actions"]}
          rows={rows}
          emptyTitle="Aucune commande"
          emptyDescription="Les commandes clients apparaîtront ici."
        />
      )}
    </div>
  );
}
