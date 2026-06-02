# GoLivra — Observabilité v2

Système de monitoring pro-grade : erreurs structurées, fingerprinting, latence,
santé endpoints, alertes multi-canal (Telegram / webhook / email).

---

## 1. Composants

| Composant | Rôle |
|---|---|
| `app_incidents` (PostgreSQL) | Erreurs persistées avec `fingerprint`, `error_type`, `state`, `occurrence_count`, `latency_ms` |
| `incident_events` (PostgreSQL) | Timeline immuable : created, occurrence, acknowledged, investigating, resolved, reopened, note |
| `request_metrics` (PostgreSQL) | Une ligne par requête HTTP (status, latency, source, fingerprint) |
| `endpoint_health_snapshots` (PostgreSQL) | Agrégations horaires (p50/p95/p99, error_rate, slow_rate) |
| `alert_channels` (PostgreSQL) | Telegram / webhook / email |
| `alert_rules` (PostgreSQL) | Règles de déclenchement avec cooldown |
| `alert_history` (PostgreSQL) | Historique d'envoi (sent / failed / skipped_cooldown) |
| `observability.service.js` | Ingestion, classification, fingerprinting, state machine |
| `endpoint-health.service.js` | p50/p95/p99, top endpoints, spikes, snapshots horaires |
| `alerting.service.js` | Évaluation des règles, dispatch Telegram/webhook/email |
| `observability-scheduler.service.js` | Cron interne : règles toutes les minutes, snapshot toutes les heures |
| `request-context.middleware.js` | requestId, latence, slow detection, persistance `request_metrics` |
| `observability.routes.js` | `POST /api/observability/report` (ingestion publique) |
| `observability-admin.routes.js` | `GET/POST/PATCH/DELETE /api/admin/observability/*` (admin) |

---

## 2. Mise en place

### 2.1 SQL
1. Exécutez **dans l'ordre** dans Supabase SQL Editor :
   - `golivra-backendcd/sql/amendments-observability.sql` (déjà déployé normalement)
   - `golivra-backendcd/sql/amendments-observability-v2.sql` ← **nouveau**

### 2.2 Variables d'environnement (backend)
```env
# Alertes
OBSERVABILITY_SCHEDULER=1
OBSERVABILITY_RULES_INTERVAL_MS=60000
OBSERVABILITY_SNAPSHOT_INTERVAL_MS=3600000
OBSERVABILITY_SLOW_MS=2000
OBSERVABILITY_LOG_INFO=0   # 1 pour aussi persister les incidents "info"
```

### 2.3 Redémarrage du backend
```bash
cd golivra-backendcd
npm ci
npm run dev   # ou npm start en prod
```

Le scheduler démarre automatiquement. Les alertes sont évaluées toutes les
minutes, les snapshots agrégés toutes les heures.

---

## 3. API

### 3.1 Ingestion (déjà existante, enrichie)
```
POST /api/observability/report
Headers: X-Request-Id, X-Client-Source
Body: { title, message, severity?, error_type?, stack?, http_method?, http_path?, http_status?, ... }
```
- `error_type` est **auto-classifié** (DatabaseError, AuthError, ValidationError,
  NetworkError, PaymentError, ExternalServiceError, RuntimeError) si absent.
- Un **fingerprint** SHA1(method+path+errorType+code/message normalisé) est
  calculé. Les occurrences suivantes incrémentent `occurrence_count` au lieu
  de créer une nouvelle ligne.

### 3.2 Admin — dashboard & endpoint health
```
GET  /api/admin/observability/dashboard?window_min=60
GET  /api/admin/observability/endpoints?window_min=60&min_requests=10
POST /api/admin/observability/endpoints/snapshot   # forcer un snapshot horaire
```

`dashboard` retourne :
```json
{
  "window_min": 60,
  "request_count": 1234,
  "error_count": 12,
  "slow_count": 8,
  "error_rate": 0.0097,
  "slow_rate": 0.0064,
  "latency_p50_ms": 142, "latency_p95_ms": 587, "latency_p99_ms": 1102,
  "by_source": [...], "by_error_type": [...], "open_by_severity": [...],
  "top_endpoints": [...], "spikes": [...]
}
```

### 3.3 Admin — incidents
```
GET    /api/admin/observability/incidents?state=open&source=backend&error_type=DatabaseError&q=...
GET    /api/admin/observability/incidents/groups?window_min=60
GET    /api/admin/observability/incidents/summary
GET    /api/admin/observability/incidents/:id
PATCH  /api/admin/observability/incidents/:id/state         { state: "acknowledged" | "investigating" | "resolved" | "open" }
PATCH  /api/admin/observability/incidents/:id/acknowledge
PATCH  /api/admin/observability/incidents/:id/investigating
PATCH  /api/admin/observability/incidents/:id/resolve       { admin_note? }
PATCH  /api/admin/observability/incidents/:id/reopen
POST   /api/admin/observability/incidents/:id/notes         { message }
```

### 3.4 Admin — alertes
```
GET    /api/admin/observability/alert-channels
POST   /api/admin/observability/alert-channels   { nom, type: "telegram"|"webhook"|"email", config }
PATCH  /api/admin/observability/alert-channels/:id
DELETE /api/admin/observability/alert-channels/:id

GET    /api/admin/observability/alert-rules
POST   /api/admin/observability/alert-rules      { nom, condition, channel_ids[], cooldown_min }
PATCH  /api/admin/observability/alert-rules/:id
DELETE /api/admin/observability/alert-rules/:id
POST   /api/admin/observability/alert-rules/:id/test    # envoie une notif test
POST   /api/admin/observability/alert-rules/evaluate   # déclenche immédiatement

GET    /api/admin/observability/alert-history
```

### 3.5 Formes de `condition` (règles)
```jsonc
// Taux d'erreur HTTP >= 10% sur /api/orders (fenêtre 15 min)
{ "kind": "error_rate", "path": "/api/orders", "method": "POST",
  "threshold": 0.10, "window_min": 15 }

// Endpoint lent : >= 10% de requêtes > 2000ms
{ "kind": "slow_endpoint", "path": "/api/admin/orders", "threshold_ms": 2000,
  "threshold": 0.10, "window_min": 10 }

// >= 10 incidents 'error' non résolus sur 5 min
{ "kind": "incident_severity", "severity": "error", "count": 10, "window_min": 5 }

// Spike vs baseline : 3x plus d'incidents que la baseline
{ "kind": "spike", "window_min": 15, "baseline_min": 60, "factor": 3 }
```

---

## 4. UI Admin

| Page | Route | Rôle |
|---|---|---|
| Dashboard | `/admin` | Inclut un panneau Observabilité (KPI temps réel, top endpoints, spikes) |
| Observabilité | `/admin/observabilite` | Liste + groupes (fingerprint), filtres état / source / type |
| Détail incident | `/admin/observabilite/$id` | Timeline, state machine, fingerprint, payload, requêtes liées |
| Santé endpoints | `/admin/sante-endpoints` | Tableau p50/p95/p99/error rate/slow par endpoint |
| Alertes | `/admin/alertes` | Canaux (Telegram/webhook) + règles + historique |

---

## 5. Bonnes pratiques

- **Ne pas inclure** d'IDs utilisateur, payload brut de carte, mot de passe ou
  secret dans `metadata`/`request_payload`. Le service **ne fait pas** de
  scrubbing automatique — gardez ces champs au niveau applicatif.
- **Fingerprint** : la normalisation retire les UUIDs et les nombres pour
  maximiser le regroupement ; attention aux messages très variables (ex.
  prompt utilisateur) qui donneront des fingerprints uniques.
- **Performance** : `request_metrics` peut grossir vite ; pensez à planifier
  un partitionnement par mois (ex. `pg_partman`) ou une rétention courte
  (30j par défaut, à ajuster).
- **Alertes** : commencez par un canal Telegram en test, ajoutez le webhook
  pourPagerDuty/OpsGenie/Slack quand vous êtes confiants.
- **Snapshot horaire** : sert aux graphs de tendance sur plusieurs jours.
  Sans snapshot, l'agrégation live scanne `request_metrics` directement (plus
  coûteux en SQL).
