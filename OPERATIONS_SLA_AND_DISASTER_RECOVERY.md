# ⚙️ SherDetect Operations, SLA & Disaster Recovery Manual

This manual defines the enterprise operations, 99.99% SLA availability commitments, distributed APM observability, Prometheus metrics monitoring, automated alerting, disaster recovery runbooks, and zero-downtime blue-green deployment strategies for **SherDetect**.

---

## 1. ⏱️ Service Level Agreement (SLA) Commitments

| Operational Metric | Target Commitment | Monitoring Mechanism |
| :--- | :--- | :--- |
| **Service Availability** | **99.99% Uptime** (Max 4.38 mins downtime/month) | Multi-Region Liveness & Readiness Probes (`/health/readiness`) |
| **API p95 Latency** | **< 450 ms** (5 deterministic layers) | APM Tracing & Prometheus Histogram Metrics (`/metrics`) |
| **Incident Response (P1)** | **15 Minutes** (Critical Outage / DB Failure) | Automated PagerDuty Alert Trigger (`/api/governance/alerts`) |
| **Incident Response (P2)** | **1 Hour** (Sub-Processor Degraded) | Automated Slack / Datadog Warning Notification |

---

## 2. 📊 Observability, APM Tracing & Prometheus Exposition

### 1. Prometheus Metrics Endpoint:
Exposed at `GET /metrics` for Datadog, Prometheus, or AWS CloudWatch agents:
- `sherdetect_http_requests_total`
- `sherdetect_http_errors_total`
- `sherdetect_gemini_failures_total`
- `sherdetect_circuit_breaker_trips_total`
- `sherdetect_request_duration_ms_p50`, `p95`, `p99`

### 2. Distributed Tracing:
Every request context propagates an `X-Trace-ID` UUID header across microservices:
`Frontend (Next.js) ──[X-Trace-ID]──> FastAPI Backend ──[X-Trace-ID]──> AI Engine ──> Supabase`

---

## 3. 🚨 Real-Time System Alerting Rules (`/api/governance/alerts`)

- **High Error Rate Breach**: Triggers when HTTP error rate exceeds **1.0%**.
- **Sub-Processor Degradation**: Triggers when Gemini LLM API failures exceed **3** events; trips circuit breaker.
- **Database Persistence Failure**: Triggers when Supabase audit trail writes fail **>= 2** times.

---

## 4. 🚒 Disaster Recovery & Backup Runbook

### 1. Supabase Database Point-In-Time Recovery (PITR):
- **Continuous Archiving**: WAL logs backed up continuously; daily automated physical snapshots retained for 30 days.
- **Restoration Procedure**:
  ```bash
  # Restore Supabase Postgres to latest valid timestamp via Supabase CLI
  supabase db restore --project-ref <REF> --timestamp "2026-09-04T12:00:00Z"
  ```

### 2. Microservice Cold-Start Failover:
If the primary backend host fails, the secondary container instance automatically takes over via Docker Compose healthchecks:
```bash
docker-compose up --scale backend_api=3 --scale backend_worker=6 -d
```

---

## 5. 🔄 Zero-Downtime Blue-Green / Canary Deployment

To prevent model updates or weight calibrations from impacting live verdicts:

```
                  ┌──────────────────────┐
                  │ Cloudflare Load Bal. │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼ (90% Traffic)                   ▼ (10% Canary Traffic)
  ┌──────────────────┐              ┌──────────────────┐
  │ BLUE Cluster v2.0│              │ GREEN Cluster v2.1│
  │ Current Weights  │              │ Proposed Weights │
  └──────────────────┘              └──────────────────┘
```

1. Deploy new model code or weights to **GREEN Cluster**.
2. Route **10% canary traffic** for 1 hour while monitoring `/api/governance/alerts`.
3. If zero alerts or override spikes occur, shift **100% traffic to GREEN** and terminate **BLUE**.
