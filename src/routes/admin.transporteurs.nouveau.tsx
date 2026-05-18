import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateLogisticsCompanyForm } from "@/components/admin/CreateLogisticsCompanyForm";

export const Route = createFileRoute("/admin/transporteurs/nouveau")({
  component: NouvelleEntrepriseLogistiquePage,
});

function NouvelleEntrepriseLogistiquePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/admin/transporteurs">
          <ArrowLeft className="h-4 w-4" /> Retour à la liste
        </Link>
      </Button>

      <PageHeader
        title="Créer une entreprise logistique"
        description="Partenaire qui gère sa propre flotte de livreurs sur GoLivra"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Nouvelle entreprise</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateLogisticsCompanyForm
            submitLabel="Créer l'entreprise et le gestionnaire"
            onCancel={() => void navigate({ to: "/admin/transporteurs" })}
            onSuccess={async () => {
              await queryClient.invalidateQueries({ queryKey: ["admin", "logistics"] });
              await navigate({ to: "/admin/transporteurs" });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
