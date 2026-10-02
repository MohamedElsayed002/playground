# Playground: Full-Stack Systems Design Lab

A comprehensive **full-stack engineering playground** built to bridge the gap between framework tutorials and real-world backend thinking, API design, and production-style systems.

**Live demo:** [playground-lilac-nine.vercel.app](https://playground-lilac-nine.vercel.app)

## What this project is

- A learning laboratory with multiple backends (NestJS and FastAPI) exploring different architectural approaches.
- A systems design reference for patterns such as idempotency, concurrency control, background jobs, and transaction handling.
- An implementation showcase with documented trade-offs.
- A collection of working APIs using REST, GraphQL, WebSockets, real-time chat, and AI integrations.
- Honest documentation that includes failures, lessons learned, and areas that need work.

This is not a finished product or SaaS, and it is **not production-ready without security and testing fixes**. See [AUDIT.md](./AUDIT.md) for the security review.

## What works well right now

### Frontend architecture — 5 stars

- Next.js 16 and React 19 with the App Router.
- TanStack Query, Form, Table, and Virtual for data and UI layer separation.
- Reusable components and hooks, plus server and client actions.
- Performance patterns including virtualization for large lists, query caching, and memoization.
- Real-time integrations with Socket.IO chat and GraphQL subscriptions.

See [`client/`](./client) and [`client/README.md`](./client/README.md).

### NestJS backend — 4 stars

- Feature modules for auth, chat, bot, Gemini, code execution, and file analysis.
- REST, code-first GraphQL, Socket.IO, and Server-Sent Events.
- Real-time chat with read receipts, typing indicators, and room management.
- AI integrations with Gemini, OpenAI, and the Vercel AI SDK.
- TypeScript, Swagger documentation, and validation pipes.

Explore `backend/src/chat/`, `backend/src/auth/`, and `backend/src/bot/`, or see [`backend/README.md`](./backend/README.md).

### FastAPI backend — 5 stars

The FastAPI backend demonstrates advanced backend patterns, including an idempotent checkout flow designed to prevent duplicate payments with idempotency keys. This checkout implementation is one of the project's strongest examples.

### Documentation — 5 stars

The repository includes 14+ technical documents describing architecture, implementation details, and lessons learned.

### Observability — 4 stars

The project includes OpenTelemetry and Grafana setup for exploring service behavior and telemetry.

## Known issues and current state

- This project is **not production-ready**.
- There are currently 0 tests.
- Security and reliability gaps need to be addressed before production use.
- See [AUDIT.md](./AUDIT.md) for the detailed security review and recommended fixes.

Repository overview: 4 backends, 7+ integrations, 14+ technical documents, and no automated tests currently.

## Tech stack

| Area | Technologies | Notes |
| --- | --- | --- |
| Frontend | Next.js, React, TanStack | App Router, data and UI patterns, real-time features |
| Backend | NestJS, FastAPI | Multiple architectural approaches and API styles |
| APIs | REST, GraphQL, WebSocket, SSE | Multi-protocol experiments |
| Observability | OpenTelemetry, Grafana | Instrumentation and dashboards |
| AI | Gemini, OpenAI, Vercel AI SDK | Integration and tool-calling experiments |

## Getting started

### Docker

Use the root Docker Compose setup to start the services:

```bash
docker compose up --build
```

Review the Compose files and each service's README for required environment variables and service-specific setup.

### Manual setup

Each service has its own dependencies and instructions. Start with the relevant project documentation:

- Frontend: [`client/README.md`](./client/README.md)
- NestJS backend: [`backend/README.md`](./backend/README.md)
- FastAPI backend: [`playground-fastapi/`](./playground-fastapi)

## What to explore first

- **Interview preparation:** Read the system design and implementation docs, then trace the idempotent checkout flow.
- **Production engineering:** Review [AUDIT.md](./AUDIT.md) first, then inspect security, error handling, and observability gaps.
- **Full-stack learning:** Follow a feature from the frontend through the API and backend implementation.

## Security and production readiness

Treat this repository as a learning project. Do not deploy it with real user data or production credentials until the audit findings are resolved, automated tests are added, and each service's configuration has been reviewed.## Next steps

1. Resolve the high-priority findings in [AUDIT.md](./AUDIT.md).
2. Add automated tests for core flows, starting with checkout and authentication.
3. Review environment variable handling and production configuration.
4. Expand monitoring and deployment documentation.

## Why this project exists

This project explores practical full-stack and backend engineering through working implementations, experiments, and documented trade-offs. It also records areas that need improvement so the repository can serve as an honest learning reference.
