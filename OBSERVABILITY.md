# Observability Stack

This document describes how to run the full observability stack for the Atende IA API.

## Quick Start

```bash
# Start the entire stack
docker compose up -d

# View logs
docker compose logs -f app

# Stop the stack
docker compose down
```

## Services

| Service            | Port                       | Description             |
| ------------------ | -------------------------- | ----------------------- |
| **App**            | 5000 (HTTP), 50051 (gRPC)  | Atende IA API           |
| **PostgreSQL**     | 5433 (host)                | Database                |
| **OTel Collector** | 14317 (gRPC), 14318 (HTTP) | OpenTelemetry Collector |
| **Jaeger**         | 26686                      | Trace UI                |
| **Prometheus**     | 19090                      | Metrics                 |
| **Grafana**        | 13000                      | Dashboards              |

## Access URLs

- **API**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/docs
- **Health**: http://localhost:5000/health
- **Jaeger UI**: http://localhost:26686
- **Prometheus**: http://localhost:19090
- **Grafana**: http://localhost:13000 (admin/admin)

## OpenTelemetry Collector

The collector receives traces, metrics, and logs via OTLP (both gRPC and HTTP) and exports to:

- **Jaeger** for traces
- **Prometheus** for metrics
- **Stdout** for logs (for debugging)

### Collector Ports

| Port                             | Protocol | Purpose                      |
| -------------------------------- | -------- | ---------------------------- |
| 14317 (host) / 4317 (container)  | gRPC     | OTLP Traces/Metrics/Logs     |
| 14318 (host) / 4318 (container)  | HTTP     | OTLP Traces/Metrics/Logs     |
| 18888 (host) / 8888 (container)  | HTTP     | Collector Prometheus metrics |
| 23133 (host) / 13133 (container) | HTTP     | Health check                 |

## Grafana Dashboards

Pre-configured dashboards are available in the **Atende IA** folder:

- **Atende IA API - Overview**: CPU, Memory, Latency, Request Rate, Error Rate, Health

### Adding Custom Dashboards

1. Create dashboard in Grafana UI
2. Export as JSON
3. Place in `grafana-dashboards/` folder
4. Restart Grafana: `docker compose restart grafana`

## Prometheus Queries

### Key Metrics

```promql
# Request rate
sum(rate(http_server_request_duration_seconds_count{job="atende-ia"}[5m])) by (route, method)

# P95 latency
histogram_quantile(0.95, sum(rate(http_server_request_duration_seconds_bucket{job="atende-ia"}[5m])) by (le))

# Error rate
sum(rate(http_server_request_duration_seconds_count{job="atende-ia",status_code=~"5.."}[5m]))

# CPU usage
rate(process_cpu_seconds_total{job="atende-ia"}[5m])

# Memory usage
process_resident_memory_bytes{job="atende-ia"}
```

## Configuration

### Environment Variables (`.env`)

```bash
# App
PORT=5000
PGHOST=postgres
PGUSER=atende
PGPASSWORD=atende
PGDATABASE=atende_ia

# gRPC
GRPC_PORT=50051

# OpenTelemetry
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://otel-collector:4318/v1/traces
OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://otel-collector:4318/v1/logs
OTEL_METRICS_PORT=9464
NODE_ENV=production
```

## Known Issues

### `/metrics` Endpoint

The `/metrics` endpoint on the application server (port 5000) has a known routing issue in Fastify 5.x. The PrometheusExporter's built-in HTTP server on port 9464 also has issues in this environment.

**Workaround**: Metrics are exported via OTLP to the OpenTelemetry Collector, which forwards them to Prometheus. For Prometheus scraping, configure the OTel Collector with the Prometheus exporter or use a sidecar Prometheus agent.

### PrometheusExporter Built-in Server

The `@opentelemetry/exporter-prometheus` package's built-in HTTP server (port 9464) has issues in this environment - the server starts successfully but doesn't accept connections. This is a known issue with the exporter in certain environments.

## Architecture

```
App (5000) ──OTLP──▶ OTel Collector (4317/4318) ──▶ Jaeger (traces)
                                                  ├─▶ Prometheus (metrics)
                                                  └─▶ Logging (stdout)
                                                          │
                                                          ▼
                                                   Grafana (3000)
```

## Troubleshooting

### Collector not receiving data

```bash
# Check collector logs
docker compose logs otel-collector

# Verify app is sending to correct endpoint
docker compose exec app env | grep OTEL
```

### No metrics in Prometheus

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check app metrics endpoint
curl http://localhost:5000/metrics
```

### No traces in Jaeger

```bash
# Check Jaeger UI
open http://localhost:16686

# Verify collector → Jaeger connection
docker compose logs otel-collector | grep jaeger
```

## Production Considerations

1. **Sampling**: Configure tail sampling in collector for high-traffic production
2. **Storage**: Use persistent volumes for Jaeger, Prometheus, Grafana
3. **TLS**: Enable TLS for all inter-service communication
4. **Authentication**: Add auth to Grafana, Prometheus, Jaeger
5. **Retention**: Configure retention policies for each backend
6. **Alerting**: Set up Alertmanager with Prometheus rules
