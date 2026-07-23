# Monitoring (Prometheus + Grafana)

## Fichiers
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `monitoring/prometheus/prometheus.yml`
- `monitoring/grafana/provisioning/datasources/prometheus.yml`
- `monitoring/grafana/provisioning/dashboards/dashboards.yml`
- `monitoring/grafana/dashboards/containers-overview.json`

## Démarrage
1. Démarrer la stack applicative avec le monitoring intégré :
   - `make up`
2. Démarrer seulement le monitoring si besoin :
   - `make monitoring-up`
  - ou `docker compose -f docker-compose.yml up -d --build prometheus grafana node-exporter cadvisor`
3. Rebuild Nginx pour prendre en compte les routes monitoring HTTPS :
  - `docker compose -f docker-compose.yml up -d --build nginx`

## Liens d'accès
- Prometheus (HTTPS via Nginx) : `https://localhost/monitoring/prometheus/`
  - Vérification santé : `https://localhost/monitoring/prometheus/-/ready`
  - Targets : `https://localhost/monitoring/prometheus/targets`
- Grafana (HTTPS via Nginx) : `https://localhost/monitoring/grafana/`
  - utilisateur : `admin`
  - mot de passe : `admin`

Note : les ports host `3005` et `9090` ne sont plus exposés.
Le monitoring passe uniquement par Nginx (`443`) en HTTPS.

## Arrêt
- `make monitoring-down`
- ou `docker compose -f docker-compose.yml stop prometheus grafana node-exporter cadvisor`

## Provisioning Grafana automatique (implémenté)
Au démarrage de Grafana :
- la datasource Prometheus est créée automatiquement,
- le dashboard `Containers Overview` est importé automatiquement,
- rien n'est à configurer manuellement dans l'UI.

API de vérification du dashboard :
- `https://localhost/monitoring/grafana/api/search?query=Containers%20Overview`

## Requêtes Dashboard (cgroups / hôte)
Sur cet environnement, cAdvisor expose surtout des labels `id` (cgroups) et interfaces hôte.

1. CPU par cgroup
```promql
topk(10, sum by (cg) (label_replace(rate(container_cpu_usage_seconds_total{cpu="total",id!="/"}[5m]), "cg", "$1", "id", ".*/([^/]+)$")))
```
Représente les 10 cgroups les plus consommateurs CPU, avec un nom court extrait du chemin (`cg`).

2. Mémoire active par cgroup
```promql
topk(10, sum by (cg) (label_replace(container_memory_working_set_bytes{id!="/"}, "cg", "$1", "id", ".*/([^/]+)$")))
```
Représente les 10 cgroups les plus consommateurs de RAM (working set), en octets, avec un nom court extrait du chemin (`cg`).

3. Réseau entrant par interface
```promql
sum by (interface) (rate(container_network_receive_bytes_total{id="/"}[5m]))
```
Représente le débit réseau entrant (bytes/s) par interface hôte.

4. Réseau sortant par interface
```promql
sum by (interface) (rate(container_network_transmit_bytes_total{id="/"}[5m]))
```
Représente le débit réseau sortant (bytes/s) par interface hôte.

5. Vérification des cibles surveillées
```promql
up
```
Représente l'état de scrape Prometheus : `1 = up`, `0 = down`.

## Requêtes Dashboard (backends applicatifs)
Ces panels sont maintenant intégrés dans `Containers Overview`.

1. Throughput backend (req/s)
```promql
sum by (job) (rate({__name__=~"(auth|friends|game|matchmaking|status)_http_requests_total"}[5m]))
```
Représente le volume de requêtes par seconde pour chaque backend.

2. Latence backend p95
```promql
histogram_quantile(0.95, sum by (job, le) (rate({__name__=~"(auth|friends|game|matchmaking|status)_http_request_duration_seconds_bucket"}[5m])))
```
Représente la latence p95 (en secondes) de chaque backend.

3. Taux d'erreurs 5xx backend
```promql
sum by (job) (rate({__name__=~"(auth|friends|game|matchmaking|status)_http_requests_total",status_code=~"5.."}[5m])) or on (job) (0 * sum by (job) (rate({__name__=~"(auth|friends|game|matchmaking|status)_http_requests_total"}[5m])))
```
Représente le débit d'erreurs serveur (HTTP 5xx) par backend. En absence d'erreurs, le panel affiche explicitement `0` au lieu de `No data`.
