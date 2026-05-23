/**
 * Textes admin — simples, sans jargon backend.
 */

export const ADMIN_UX_ERRORS = {
  network: "Problème de connexion. Vérifiez votre internet.",
  generic: "Une erreur est survenue. Réessayez.",
  session: "Reconnectez-vous pour continuer.",
} as const;

function norm(statut?: string | null): string {
  return (statut ?? "").trim().toLowerCase().replace(/-/g, "_");
}

export function formatOrderStatusLabel(statut?: string | null): string {
  const key = norm(statut);
  const map: Record<string, string> = {
    en_attente: "En attente",
    partiellement_acceptee: "Partiellement acceptée",
    acceptee: "Acceptée",
    en_preparation: "En préparation",
    prete: "Prête",
    en_livraison: "En livraison",
    livree: "Livrée",
    partiellement_livree: "Partiellement livrée",
    annulee: "Annulée",
    remboursee: "Remboursée",
    commande_creee: "Commande envoyée",
    refusee: "Refusée",
    attribuee: "Livreur assigné",
    en_collecte: "Récupération",
    collectee: "Récupérée",
    en_route: "En route",
    echec: "Échec",
    terminee: "Terminée",
  };
  if (!key) return "—";
  return map[key] ?? "En cours";
}

export function formatCommerceStatusLabel(statut?: string | null): string {
  const key = norm(statut);
  const map: Record<string, string> = {
    en_attente: "En attente",
    en_examen: "En examen",
    active: "Actif",
    suspendue: "Suspendu",
    rejetee: "Refusé",
  };
  if (!key) return "—";
  return map[key] ?? "—";
}

export function formatEnterpriseTypeLabel(type?: string | null): string {
  if (type === "restaurant") return "Restaurant";
  if (type === "boutique") return "Boutique";
  return "—";
}

/** Libellé unique admin (commande, livraison ou commerce). */
export function formatStatutLabel(statut?: string | null): string {
  const commerce = formatCommerceStatusLabel(statut);
  const order = formatOrderStatusLabel(statut);
  if (!statut?.trim()) return "—";
  const key = norm(statut);
  const commerceOnly = new Set(["en_examen", "active", "suspendue", "rejetee"]);
  if (commerceOnly.has(key)) return commerce;
  if (order !== "En cours" && order !== "—") return order;
  if (commerce !== "—" && commerce !== "En cours") return commerce;
  return order;
}

export function friendlyAdminError(raw: unknown, fallback = ADMIN_UX_ERRORS.generic): string {
  const msg = raw instanceof Error ? raw.message : typeof raw === "string" ? raw : "";
  const lower = msg.trim().toLowerCase();
  if (!lower) return fallback;
  if (/session|token|401|unauthorized/i.test(lower)) return ADMIN_UX_ERRORS.session;
  if (/network|fetch|timeout/i.test(lower)) return ADMIN_UX_ERRORS.network;
  if (/sous-commande/i.test(lower)) return "Commande chez un commerce.";
  if (/^[a-z]+(_[a-z]+)+$/.test(lower)) return fallback;
  return msg.length > 120 ? fallback : msg;
}
