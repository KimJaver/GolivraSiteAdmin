import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, Gauge, Timer, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchEndpointHealth } from "@/lib/observability-api";
import { ADMIN_LIVE_REFETCH_MS } from "@/lib/admin-nav";

const WINDOWS = [
  { value: 15, label: "15 min" },
  { value: 60, label: "1 h" },
  { value: 360, label: "6 h" },
  { value: 1440, label: "24 h" },
];

const MIN_REQS = [
  { value: 1, label: "Tous endpoints" },
  { value: 10, label: "Min. 10 requêtes" },
  { value: 50, label: "Min. 50 requêtes" },
  { value: 200, label: "Min. 200 requêtes" },
];

export const Route = createFileRoute("/admin/sante-endpoints")({
  component: SanteEndpointsPage,
});

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function msLabel(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(2)} s`;
  return `${n} ms`;
}

function SanteEndpointsPage() {
  const [windowMin, setWindowMin] = useState(60);
  const [minRequests, setMinRequests] = useState(10);

  const healthQuery = useQuery({
    queryKey: ["admin", "observability", "endpoints", windowMin, minRequests],
    queryFn: () => fetchEndpointHealth(windowMin, minRequests),
    refetchInterval: ADMIN_LIVE_REFETCH_MS,
  });

  const endpoints = healthQuery.data?.endpoints ?? [];

  const slowest = [...endpoints]
    .filter((e) => e.latency_p95_ms > 0)
    .sort((a, b) => b.latency_p95_ms - a.latency_p95_ms)
    .slice(0, 5);

  const errored = [...endpoints]
    .filter((e) => e.error_count > 0)
    .sort((a, b) => b.error_rate - a.error_rate)
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Santé des endpoints"
        description="Volume, taux d’erreur, latences p50/p95/p99 et requêtes lentes par endpoint. Source : table request_metrics."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={String(windowMin)} onValueChange={(v) => setWindowMin(Number(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Fenêtre" />
          </SelectTrigger>
          <SelectContent>
            {WINDOWS.map((w) => (
              <SelectItem key={w.value} value={String(w.value)}>
                {w.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(minRequests)} onValueChange={(v) => setMinRequests(Number(v))}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Volume minimum" />
          </SelectTrigger>
          <SelectContent>
            {MIN_REQS.map((m) => (
              <SelectItem key={m.value} value={String(m.value)}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Endpoints suivis"
          icon={Activity}
          value={endpoints.length}
          hint={healthQuery.isLoading ? "Chargement…" : undefined}
        />
        <KpiCard
          label="Endpoints en erreur"
          icon={TrendingUp}
          value={errored.length}
          hint="Avec au moins une erreur 5xx"
        />
        <KpiCard
          label="p95 le plus lent"
          icon={Timer}
          value={slowest[0] ? msLabel(slowest[0].latency_p95_ms) : undefined}
          hint={slowest[0] ? `${slowest[0].method} ${slowest[0].path}` : "Aucun endpoint"}
        />
        <KpiCard
          label="Endpoints lents (> 2s)"
          icon={Gauge}
          value={endpoints.reduce((s, e) => s + (e.slow_count || 0), 0)}
          hint="Sur la fenêtre"
        />
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tous les endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          {healthQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : endpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun trafic mesuré. Les métriques sont collectées par le middleware
              <code className="mx-1 rounded bg-muted px-1">request-context</code>
              et écrites dans <code className="rounded bg-muted px-1">request_metrics</code>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 text-left">Endpoint</th>
                    <th className="py-2 text-right">Req</th>
                    <th className="py-2 text-right">Err</th>
                    <th className="py-2 text-right">Taux err.</th>
                    <th className="py-2 text-right">Lents</th>
                    <th className="py-2 text-right">p50</th>
                    <th className="py-2 text-right">p95</th>
                    <th className="py-2 text-right">p99</th>
                    <th className="py-2 text-right">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoints.map((e) => (
                    <tr
                      key={`${e.method}-${e.path}`}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-1.5 font-mono text-xs">
                        <span className="mr-1 rounded bg-muted px-1.5 py-0.5 text-foreground">
                          {e.method}
                        </span>
                        <span className="text-foreground">{e.path}</span>
                      </td>
                      <td className="py-1.5 text-right font-mono text-xs">{e.request_count}</td>
                      <td className="py-1.5 text-right font-mono text-xs text-destructive">
                        {e.error_count}
                      </td>
                      <td className="py-1.5 text-right font-mono text-xs">
                        <span className={e.error_rate > 0.1 ? "text-destructive" : ""}>
                          {pct(e.error_rate)}
                        </span>
                      </td>
                      <td className="py-1.5 text-right font-mono text-xs text-amber-600">
                        {e.slow_count}
                      </td>
                      <td className="py-1.5 text-right font-mono text-xs">{msLabel(e.latency_p50_ms)}</td>
                      <td className="py-1.5 text-right font-mono text-xs">{msLabel(e.latency_p95_ms)}</td>
                      <td className="py-1.5 text-right font-mono text-xs">{msLabel(e.latency_p99_ms)}</td>
                      <td className="py-1.5 text-right font-mono text-xs">{msLabel(e.latency_max_ms)}</td>
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
