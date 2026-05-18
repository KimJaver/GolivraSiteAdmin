import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLogisticsCompanyAdmin, type CreateLogisticsCompanyPayload } from "@/lib/admin-api";

type Props = {
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
};

const emptyForm = {
  nomEntreprise: "",
  telephoneEntreprise: "",
  emailEntreprise: "",
  zoneActivite: "",
  gestionnaireNom: "",
  gestionnaireEmail: "",
  gestionnaireMotDePasse: "",
  gestionnaireTelephone: "",
};

export function CreateLogisticsCompanyForm({ onSuccess, onCancel, submitLabel = "Créer l'entreprise" }: Props) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const canSubmit =
    form.nomEntreprise.trim().length > 0 &&
    form.gestionnaireNom.trim().length > 0 &&
    form.gestionnaireEmail.trim().length > 0 &&
    form.gestionnaireMotDePasse.length >= 6;

  const handleSubmit = async () => {
    setCreating(true);
    setError(null);
    try {
      const payload: CreateLogisticsCompanyPayload = {
        nomEntreprise: form.nomEntreprise.trim(),
        telephoneEntreprise: form.telephoneEntreprise.trim() || undefined,
        emailEntreprise: form.emailEntreprise.trim() || undefined,
        zoneActivite: form.zoneActivite.trim() || undefined,
        gestionnaire: {
          nom: form.gestionnaireNom.trim(),
          email: form.gestionnaireEmail.trim(),
          motDePasse: form.gestionnaireMotDePasse,
          telephone: form.gestionnaireTelephone.trim() || undefined,
        },
      };
      await createLogisticsCompanyAdmin(payload);
      setForm(emptyForm);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        <h2 className="text-sm font-semibold text-foreground">Entreprise logistique</h2>
        <p className="text-xs text-muted-foreground">
          Partenaire qui emploie ses propres livreurs sur GoLivra (flotte interne).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="nomEntreprise">Nom de l&apos;entreprise *</Label>
            <Input
              id="nomEntreprise"
              placeholder="Ex. Express Brazza Livraison"
              value={form.nomEntreprise}
              onChange={(ev) => setForm((f) => ({ ...f, nomEntreprise: ev.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="telEntreprise">Téléphone</Label>
            <Input
              id="telEntreprise"
              placeholder="+242061234567"
              value={form.telephoneEntreprise}
              onChange={(ev) => setForm((f) => ({ ...f, telephoneEntreprise: ev.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="emailEntreprise">E-mail entreprise</Label>
            <Input
              id="emailEntreprise"
              type="email"
              value={form.emailEntreprise}
              onChange={(ev) => setForm((f) => ({ ...f, emailEntreprise: ev.target.value }))}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="zone">Zone d&apos;activité</Label>
            <Input
              id="zone"
              placeholder="Ex. Bacongo, Poto-Poto…"
              value={form.zoneActivite}
              onChange={(ev) => setForm((f) => ({ ...f, zoneActivite: ev.target.value }))}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Compte gestionnaire</h2>
        <p className="text-xs text-muted-foreground">
          Connexion web (e-mail + mot de passe) pour gérer les livreurs de cette entreprise.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="gestNom">Nom du gestionnaire *</Label>
            <Input
              id="gestNom"
              value={form.gestionnaireNom}
              onChange={(ev) => setForm((f) => ({ ...f, gestionnaireNom: ev.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="gestEmail">E-mail *</Label>
            <Input
              id="gestEmail"
              type="email"
              value={form.gestionnaireEmail}
              onChange={(ev) => setForm((f) => ({ ...f, gestionnaireEmail: ev.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="gestMdp">Mot de passe * (min. 6)</Label>
            <Input
              id="gestMdp"
              type="password"
              autoComplete="new-password"
              value={form.gestionnaireMotDePasse}
              onChange={(ev) => setForm((f) => ({ ...f, gestionnaireMotDePasse: ev.target.value }))}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="gestTel">Téléphone gestionnaire (optionnel)</Label>
            <Input
              id="gestTel"
              placeholder="+242…"
              value={form.gestionnaireTelephone}
              onChange={(ev) => setForm((f) => ({ ...f, gestionnaireTelephone: ev.target.value }))}
            />
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button disabled={!canSubmit || creating} onClick={() => void handleSubmit()}>
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" disabled={creating} onClick={onCancel}>
            Annuler
          </Button>
        ) : null}
      </div>
    </div>
  );
}
