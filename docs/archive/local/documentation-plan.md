# Documentation Plan — Payment Gateway

Goal: produce a complete, consistent documentation set that mirrors the structure and rigor of `yt-archiver` (README + docs/projects at root and per-app) with deeper, professional-level detail.

## 1) Documentation Architecture (Target Tree)

Root:
```
payment-gateway/
├── README.md
├── docs/
│   ├── projects/
│   │   ├── ARCHITECTURE.md
│   │   ├── INTEGRATIONS.md
│   │   ├── INFRA.md
│   │   ├── DATA-MODEL.md
│   │   ├── SECURITY.md
│   │   ├── OBSERVABILITY.md
│   │   ├── FLOWS.md
│   │   └── RUNBOOK.md
│   └── local/
│       └── documentation-plan.md  (this file)
```

Apps:
```
./go-gateway/
├── README.md
└── docs/projects/
    ├── API.md
    ├── DOMAIN.md
    ├── DATABASE.md
    ├── KAFKA.md
    ├── ERRORS.md
    └── TROUBLESHOOTING.md

./nestjs-anti-fraud/
├── README.md
└── docs/projects/
    ├── CONSUMER.md
    ├── DATABASE.md
    ├── EVENTS.md
    ├── METRICS.md
    └── TROUBLESHOOTING.md

./next-frontend/
├── README.md
└── docs/projects/
    ├── UI-FLOWS.md
    ├── AUTH-SESSION.md
    ├── SERVER-ACTIONS.md
    ├── ERROR-HANDLING.md
    └── TROUBLESHOOTING.md
```

## 2) Root Docs — Content Outline

README.md (root):
- Project overview and value proposition.
- Stack summary (Go + NestJS + Next + Kafka + Postgres).
- Quick start (local dev) using `./start-dev.sh`.
- Core URLs and ports (API, frontend, metrics).
- Demo mode (what it is, how to use, seeded data).
- Common errors (ports, permissions, Kafka).
- How to stop / cleanup.

ARCHITECTURE.md:
- High-level diagram (text-based) of services and flow.
- Sync vs async responsibilities.
- Service boundaries and ownership.
- Reliability features: retries, DLQ, dedup.

INTEGRATIONS.md:
- Kafka topics, producers/consumers.
- API contracts between frontend <-> gateway.
- Anti-fraud service role.

INFRA.md:
- docker-compose files overview.
- volumes, networks, ports.
- local vs docker responsibilities.

DATA-MODEL.md:
- Entities (accounts, invoices, processed_events).
- Key fields and constraints.
- Migration strategy.

SECURITY.md:
- API key hashing model (HMAC).
- Rate limiting policy.
- Cookie usage and security.

OBSERVABILITY.md:
- Metrics endpoints and counters.
- Logging format and request_id.

FLOWS.md:
- Create account.
- Demo mode.
- Create invoice and status lifecycle.

RUNBOOK.md:
- Startup steps and dependencies.
- Restart / recovery.
- Common troubleshooting steps.

## 3) go-gateway Docs — Content Outline

README.md:
- Service purpose and responsibilities.
- Local start instructions.
- Env vars (DB, Kafka, API key secrets).
- API endpoints (brief list).

API.md:
- Endpoint specs: /accounts, /demo, /invoice, /invoice/{id}.
- Headers, request/response samples.
- Error responses.

DOMAIN.md:
- Invoice lifecycle rules (pending -> approved/rejected).
- Balance updates behavior.
- Idempotency/dedup logic.

DATABASE.md:
- Schema tables and indexes.
- Migrations list.

KAFKA.md:
- Topics, message formats, event_id.
- Retry + DLQ strategy.

ERRORS.md:
- Error codes and semantics.

TROUBLESHOOTING.md:
- Common failures (DB connection, Kafka, port conflicts).

## 4) nestjs-anti-fraud Docs — Content Outline

README.md:
- Service purpose and local start.
- Prisma + DB connection notes.
- Metrics endpoint.

CONSUMER.md:
- Kafka consumer flow.
- Message validation and processing.

DATABASE.md:
- Prisma schema and migrations.

EVENTS.md:
- Transaction result payload shape.
- Failure handling.

METRICS.md:
- Counters emitted.

TROUBLESHOOTING.md:
- Prisma errors, port conflicts, Kafka connectivity.

## 5) next-frontend Docs — Content Outline

README.md:
- App structure, routing, local dev.
- Env vars (API_BASE_URL).

UI-FLOWS.md:
- Home (create account + demo).
- Login + API key flow.
- Invoices list + pagination.
- Create invoice + validation.

AUTH-SESSION.md:
- Cookie strategy (apiKey + preview).
- Session behavior.

SERVER-ACTIONS.md:
- Actions list and usage.
- Revalidation strategy.

ERROR-HANDLING.md:
- Error states by screen, query-param strategy.

TROUBLESHOOTING.md:
- Hydration issues, permissions, form validation.

## 6) Execution Plan (Phases)

Phase 1 — Inventory & Source Review
- Map current services, envs, ports, compose files, start-dev behavior.
- Capture existing flows and API contract.

Phase 2 — Root Docs
- Write root README.md.
- Create docs/projects/* with architecture/integration/infra/etc.

Phase 3 — Service Docs
- Create per-service README.md.
- Create per-service docs/projects/* (detailed sections above).

Phase 4 — QA & Consistency
- Cross-check terminology (invoice/transfer), env vars, ports.
- Validate all referenced commands and paths.
- Ensure tone, formatting, and structure match yt-archiver style.

## 7) Style & Consistency Rules
- ASCII-only.
- Use consistent headings and command blocks.
- Include example requests/responses where possible.
- Prefer checklists for operational steps.
- Keep docs self-contained and runnable.

## 8) Open Questions
- Confirm desired terminology: invoice vs transferencia.
- Confirm whether to include UI screenshots or keep text-only.
- Confirm if demo data should be documented (seed values, counts).

