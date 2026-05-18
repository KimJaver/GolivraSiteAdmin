import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/admin/parametres")({
  component: ParametresPage,
});

function ParametresPage() {
  return (
    <div>
      <PageHeader title="Paramètres" description="Configuration de la plateforme" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Commissions & livraison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comm">Commission livraison (%)</Label>
              <Input id="comm" type="number" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frais">Frais de livraison de base</Label>
              <Input id="frais" type="number" placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rayon">Rayon de livraison max (km)</Label>
              <Input id="rayon" type="number" placeholder="0" />
            </div>
            <Button>Enregistrer</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Paramètres système</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la plateforme</Label>
              <Input id="name" placeholder="GoLivra" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support">Email de support</Label>
              <Input id="support" type="email" placeholder="support@…" />
            </div>
            <Separator />
            {[
              { id: "s-maint", label: "Mode maintenance" },
              { id: "s-signup", label: "Inscriptions ouvertes" },
              { id: "s-notif", label: "Notifications email" },
              { id: "s-sms", label: "Notifications SMS" },
            ].map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <Label htmlFor={s.id} className="text-sm font-normal">
                  {s.label}
                </Label>
                <Switch id={s.id} />
              </div>
            ))}
            <Button>Enregistrer</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
