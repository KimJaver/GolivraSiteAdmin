import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Gauge, Sparkles, Timer, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/admin/KpiCard";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { fetchObservabilityDashboard } from "@/lib/observability-api";
import { ADMIN_LIVE_REFETCH_MS } from "@/lib/admin-nav";

const WINDOWS = [
  { value: 15, label: "15 min" },
  { value: 60, label: "1 h" },
  { value: 360, label: "6 h" },
  { value: 1440, label: "24 h" },
];

interface ObservabilityDashboardPanelProps {
  defaultWindow?: number;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function msLabel(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(2)} s`;
  return `${n} ms`;
}

export function ObservabilityDashboardPanel({ defaultWindow = 60 }: ObservabilityDashboardPanelProps) {
  const [windowMin, setWindowMin] = useState(defaultWindow);

  const dashboardQuery = useQuery({
    queryKey: ["admin", "observability", "dashboard", windowMin],
    queryFn: () => fetchObservabilityDashboard(windowMin),
    refetchInterval: ADMIN_LIVE_REFETCH_MS,
  });

  const data = dashboardQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">Santé en temps réel</h2>
          <p className="text-xs text-muted-foreground">
            {WINDOWS.find((w) => w.value === windowMin)?.label ?? `${windowMin} min`} ·
            rafraîchissement {Math.round(ADMIN_LIVE_REFETCH_MS / 1000)}s
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {WINDOWS.map((w) => (
            <WindowChip
              key={w.value}
              value={w.value}
              label={w.label}
              active={w.value === windowMin}
              onClick={() => setWindowMin(w.value)}
            />
          ))}
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/observabilite">Voir les incidents →</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Requêtes"
          icon={Activity}
          value={data ? data.request_count.toLocaleString("fr-FR") : undefined}
          hint={data ? `${data.window_min} min` : undefined}
        />
        <KpiCard
          label="Taux d'erreur"
          icon={AlertTriangle}
          value={data ? pct(data.error_rate) : undefined}
          hint={data ? `${data.error_count} erreur(s)` : undefined}
        />
        <KpiCard
          label="Latence p95"
          icon={Timer}
          value={data ? msLabel(data.latency_p95_ms) : undefined}
          hint={data ? `p99 ${msLabel(data.latency_p99_ms)}` : undefined}
        />
        <KpiCard
          label="Requêtes lentes"
          icon={Gauge}
          value={data ? pct(data.slow_rate) : undefined}
          hint={data ? `${data.slow_count} > 2s` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Par source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {dashboardQuery.isLoading ? (
              <p className="text-muted-foreground">Chargement…</p>
            ) : (data?.by_source ?? []).length === 0 ? (
              <p className="text-muted-foreground">Aucune donnée sur la fenêtre.</p>
            ) : (
              data?.by_source.map((s) => (
                <div key={s.source} className="flex items-center justify-between">
                  <span className="text-foreground">{s.source}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.request_count} req · {pct(s.error_rate)} err
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Types d’erreur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {dashboardQuery.isLoading ? (
              <p className="text-muted-foreground">Chargement…</p>
            ) : (data?.by_error_type ?? []).length === 0 ? (
              <p className="text-muted-foreground">Aucune erreur classifiée.</p>
            ) : (
              data?.by_error_type.slice(0, 6).map((e) => (
                <div key={e.error_type} className="flex items-center justify-between">
                  <span className="text-foreground">{e.error_type}</span>
                  <span className="font-mono text-xs text-muted-foreground">{e.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Spikes en cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dashboardQuery.isLoading ? (
              <p className="text-muted-foreground">Chargement…</p>
            ) : (data?.spikes ?? []).length === 0 ? (
              <p className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Aucun spike détecté.
              </p>
            ) : (
              data?.spikes.slice(0, 5).map((s) => (
                <Link
                  key={s.fingerprint}
                  to="/admin/observabilite"
                  className="flex items-center justify-between rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                >
                  <span className="flex items-center gap-1 font-mono text-foreground">
                    <Zap className="h-3 w-3 text-amber-500" />×{s.occurrence_count}
                  </span>
                  <span className="truncate text-muted-foreground">{s.error_type ?? "—"}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4" /> Top endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (data?.top_endpoints ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun trafic sur la fenêtre.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 text-left">Endpoint</th>
                    <th className="py-2 text-right">Req</th>
                    <th className="py-2 text-right">Err</th>
                    <th className="py-2 text-right">p50</th>
                    <th className="py-2 text-right">p95</th>
                    <th className="py-2 text-right">p99</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.top_endpoints.slice(0, 8).map((e) => (
                    <tr key={`${e.method}-${e.path}`} className="border-b border-border/50 last:border-0">
                      <td className="py-1.5 font-mono text-xs">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-foreground">{e.method}</span>{" "}
                        <span className="text-foreground">{e.path}</span>
                      </td>
                      <td className="py-1.5 text-right font-mono text-xs">{e.request_count}</td>
                      <td className="py-1.5 text-right font-mono text-xs text-destructive">
                        {pct(e.error_rate)}
                      </td>
                      <td className="py-1.5 text-right font-mono text-xs">{msLabel(e.latency_p50_ms)}</td>
                      <td className="py-1.5 text-right font-mono text-xs">{msLabel(e.latency_p95_ms)}</td>
                      <td className="py-1.5 text-right font-mono text-xs">{msLabel(e.latency_p99_ms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WindowChip({
  value,
  label,
  active,
  onClick,
}: {
  value: number;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs transition-colors " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent")
      }
    >
      {label}
    </button>
  );
}
