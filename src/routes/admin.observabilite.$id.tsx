import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, MessageCircle, RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchIncidentDetail,
  formatIncidentSeverity,
  formatIncidentSource,
  formatIncidentState,
  formatErrorType,
  transitionIncident,
  addIncidentNote,
  type IncidentState,
} from "@/lib/observability-api";
import { formatDateTimeFr } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/observabilite/$id")({
  component: IncidentDetailPage,
});

function severityVariant(severity: string): "destructive" | "secondary" | "outline" {
  if (severity === "error") return "destructive";
  if (severity === "warn") return "secondary";
  return "outline";
}

function stateVariant(state: IncidentState): "destructive" | "default" | "secondary" | "outline" {
  if (state === "open") return "destructive";
  if (state === "investigating") return "default";
  if (state === "acknowledged") return "secondary";
  return "outline";
}

function IncidentDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [adminNote, setAdminNote] = useState("");
  const [comment, setComment] = useState("");

  const detailQuery = useQuery({
    queryKey: ["admin", "incident", id],
    queryFn: () => fetchIncidentDetail(id),
    refetchInterval: 10_000,
  });

  const transitionMutation = useMutation({
    mutationFn: (vars: { state: IncidentState; note?: string }) =>
      transitionIncident(id, vars.state, vars.note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "incident", id] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "incidents"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "incidents", "groups"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "observability", "dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setAdminNote("");
    },
  });

  const noteMutation = useMutation({
    mutationFn: (message: string) => addIncidentNote(id, message),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "incident", id] });
      setComment("");
    },
  });

  const inc = detailQuery.data?.incident;
  const events = detailQuery.data?.events ?? [];
  const related = detailQuery.data?.related ?? [];

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/admin/observabilite">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
      </Button>

      <PageHeader
        title={inc ? inc.title : "Incident"}
        description={inc ? `Request ID : ${inc.request_id}` : "Analyse de l'incident"}
      />

      {detailQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : detailQuery.isError || !inc ? (
        <p className="text-sm text-destructive">Incident introuvable.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <Badge variant={severityVariant(inc.severity)}>
                    {formatIncidentSeverity(inc.severity)}
                  </Badge>
                  <Badge variant="outline">{formatErrorType(inc.error_type)}</Badge>
                  <Badge variant="outline">{formatIncidentSource(inc.source)}</Badge>
                  <Badge variant={stateVariant(inc.state)}>{formatIncidentState(inc.state)}</Badge>
                  {inc.occurrence_count > 1 ? (
                    <Badge variant="secondary">×{inc.occurrence_count}</Badge>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-foreground">Quoi (problème)</p>
                  <p className="mt-1">{inc.message}</p>
                </div>
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="font-semibold text-foreground">Pourquoi (cause probable)</p>
                  <p className="mt-1 text-muted-foreground">{inc.cause || "Non déterminée automatiquement."}</p>
                </div>
                {inc.http_path ? (
                  <p>
                    <span className="text-muted-foreground">Endpoint : </span>
                    <code className="rounded bg-muted px-1">
                      {inc.http_method || "?"} {inc.http_path}
                      {inc.http_status != null ? ` → ${inc.http_status}` : ""}
                      {inc.latency_ms != null ? ` · ${inc.latency_ms}ms` : ""}
                    </code>
                  </p>
                ) : null}
                {inc.fingerprint ? (
                  <p>
                    <span className="text-muted-foreground">Fingerprint : </span>
                    <code className="rounded bg-muted px-1 text-foreground">{inc.fingerprint}</code>
                  </p>
                ) : null}
                {inc.stack ? (
                  <div>
                    <p className="mb-1 font-semibold">Stack trace</p>
                    <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                      {inc.stack}
                    </pre>
                  </div>
                ) : null}
                {inc.request_payload ? (
                  <div>
                    <p className="mb-1 font-semibold">Payload de la requête</p>
                    <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
                      {JSON.stringify(inc.request_payload, null, 2)}
                    </pre>
                  </div>
                ) : null}
                {Object.keys(inc.metadata || {}).length > 0 ? (
                  <div>
                    <p className="mb-1 font-semibold">Métadonnées</p>
                    <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
                      {JSON.stringify(inc.metadata, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun événement.</p>
                ) : (
                  <ol className="space-y-3">
                    {events.map((ev) => (
                      <li key={ev.id} className="flex items-start gap-3">
                        <span
                          className={
                            "mt-1 inline-block h-2 w-2 shrink-0 rounded-full " +
                            (ev.event_type === "resolved"
                              ? "bg-emerald-500"
                              : ev.event_type === "reopened" || ev.event_type === "occurrence"
                              ? "bg-amber-500"
                              : ev.event_type === "note"
                              ? "bg-blue-500"
                              : "bg-primary")
                          }
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="outline">{ev.event_type}</Badge>
                            <span className="text-muted-foreground">
                              {ev.actor_kind} · {formatDateTimeFr(ev.created_at)}
                            </span>
                          </div>
                          {ev.message ? (
                            <p className="mt-1 text-sm text-foreground">{ev.message}</p>
                          ) : null}
                          {Object.keys(ev.metadata || {}).length > 0 ? (
                            <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
                              {JSON.stringify(ev.metadata, null, 2)}
                            </pre>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>

            {related.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Même requestId (fil de traçage)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {related.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.error_type ?? "—"} · {formatDateTimeFr(r.last_seen_at)}
                          {r.occurrence_count > 1 ? ` · ×${r.occurrence_count}` : ""}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <Link to="/admin/observabilite/$id" params={{ id: r.id }}>
                          Voir
                        </Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Contexte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Request ID : </span>
                  <code className="break-all">{inc.request_id}</code>
                </p>
                <p>
                  <span className="text-muted-foreground">Catégorie : </span>
                  {inc.category}
                </p>
                <p>
                  <span className="text-muted-foreground">Plateforme : </span>
                  {inc.platform || "—"} {inc.app_version ? `(v${inc.app_version})` : ""}
                </p>
                <p>
                  <span className="text-muted-foreground">Utilisateur : </span>
                  {inc.user_id
                    ? `${inc.user_id.slice(0, 8)}… (${inc.user_role || "?"})`
                    : "Anonyme / non connecté"}
                </p>
                <p>
                  <span className="text-muted-foreground">Premier signalement : </span>
                  {formatDateTimeFr(inc.first_seen_at)}
                </p>
                <p>
                  <span className="text-muted-foreground">Vu pour la dernière fois : </span>
                  {formatDateTimeFr(inc.last_seen_at)}
                </p>
                {inc.acknowledged_at ? (
                  <p>
                    <span className="text-muted-foreground">Acquitté le : </span>
                    {formatDateTimeFr(inc.acknowledged_at)}
                  </p>
                ) : null}
                {inc.resolved_at ? (
                  <p>
                    <span className="text-muted-foreground">Résolu le : </span>
                    {formatDateTimeFr(inc.resolved_at)}
                  </p>
                ) : null}
                {inc.admin_note ? (
                  <p>
                    <span className="text-muted-foreground">Note admin : </span>
                    {inc.admin_note}
                  </p>
                ) : null}
                {inc.environment ? (
                  <p>
                    <span className="text-muted-foreground">Environnement : </span>
                    {inc.environment} {inc.release ? `(v${inc.release})` : ""}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {inc.state !== "resolved" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Note interne (optionnel) — enregistrée dans la timeline."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                  />
                  <div className="grid grid-cols-1 gap-2">
                    {inc.state === "open" ? (
                      <Button
                        variant="secondary"
                        disabled={transitionMutation.isPending}
                        onClick={() =>
                          transitionMutation.mutate({ state: "acknowledged", note: adminNote.trim() || undefined })
                        }
                      >
                        <Eye className="h-4 w-4" /> Acquitter (je l’ai vu)
                      </Button>
                    ) : null}
                    {inc.state !== "investigating" ? (
                      <Button
                        variant="default"
                        disabled={transitionMutation.isPending}
                        onClick={() =>
                          transitionMutation.mutate({ state: "investigating", note: adminNote.trim() || undefined })
                        }
                      >
                        <Search className="h-4 w-4" /> Passer en investigation
                      </Button>
                    ) : null}
                    <Button
                      variant="destructive"
                      disabled={transitionMutation.isPending}
                      onClick={() =>
                        transitionMutation.mutate({ state: "resolved", note: adminNote.trim() || undefined })
                      }
                    >
                      <CheckCircle2 className="h-4 w-4" /> Marquer résolu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Rouvrir</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={transitionMutation.isPending}
                    onClick={() => transitionMutation.mutate({ state: "open" })}
                  >
                    <RotateCcw className="h-4 w-4" /> Rouvrir l’incident
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Commentaire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  placeholder="Ajouter un commentaire dans la timeline…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <Button
                  className="w-full"
                  variant="secondary"
                  disabled={!comment.trim() || noteMutation.isPending}
                  onClick={() => noteMutation.mutate(comment.trim())}
                >
                  <MessageCircle className="h-4 w-4" /> Publier le commentaire
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
