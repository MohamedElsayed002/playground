# Client App Guide

This client is built with **Next.js (App Router)** and focuses on:
- clean feature-based UI organization
- reusable hooks and shared tools
- TanStack-first data + table + virtualization patterns
- practical performance improvements for large lists and interactive screens

## Tech Stack

- `next` + `react` + `typescript`
- `@tanstack/react-query` for server-state caching and request lifecycle
- `@tanstack/react-table` for advanced table behavior
- `@tanstack/react-virtual` for virtualized rendering (large lists)
- `zustand` for lightweight client state (chat/auth stores)
- `react-hook-form` + `zod` for forms and validation
- `shadcn/ui` + Tailwind for UI primitives and styling

## Project Approach

### 1) Feature + route driven structure
- Route pages live in `app/` (App Router).
- Reusable UI and domain pieces live in `components/`.
- Educational/demo content and architecture explanations live in `features/`.

### 2) Shared logic in hooks and tools
- `hooks/` contains reusable client logic (`use-auth`, `use-rooms`, `use-messages`, etc.).
- `tools/` and `lib/` contain API clients, utilities, GraphQL helpers, socket/db setup, and typed helpers.

### 3) Data flow and state strategy
- Use TanStack Query for async server data, caching, and stale/refresh logic.
- Use Zustand stores only for truly local client interaction state.
- Keep components mostly presentational, and move behavior to hooks/actions where possible.

## Folder Structure

```txt
client/
  app/                 # Next.js routes, layouts, API route handlers
  components/          # Reusable UI + domain components (auth/chat/users/admin/...)
  hooks/               # Custom React hooks for shared behavior
  features/            # Docs-like feature pages and architecture topics
  actions/             # Server/client actions for auth and other flows
  lib/                 # Core helpers (api, db, graphql, utils, sockets)
  store/               # Zustand stores
  tools/               # Shared tool wrappers and definitions
  docs/                # Topic notes (react hooks, tanstack virtual, etc.)
  prisma/              # Prisma schema and database config
  public/              # Static assets
```

## TanStack Usage in This Project

- **TanStack Query**: request caching, background refetching, loading/error states.
- **TanStack Table**: headless table modeling (sorting/filtering/pagination patterns).
- **TanStack Virtual**: rendering only visible rows/items for large datasets.
- **TanStack AI packages**: AI/chat integrations where needed.

## Performance Approach

Key performance ideas used in this client:
- Virtualization for large datasets (`10k-users`, virtual list/table examples).
- Memoization and stable props where expensive rerenders happen.
- Component splitting to isolate frequently updated UI.
- Query caching to reduce duplicate requests.
- Hook extraction to keep pages/components smaller and cheaper to rerender.

## Environment Variables (`.env.local`)

Create a file named `.env.local` inside `client/`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
OPENAI_API_KEY=your_openai_key
DATABASE_URL=your_database_url
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=no-reply@example.com
```

Notes:
- `NEXT_PUBLIC_API_URL` is used by the client for backend auth/API calls.
- `OPENAI_API_KEY` is needed for AI/realtime related API routes.
- `DATABASE_URL` is required for Prisma/database usage.
- SMTP variables are only needed if you use email API features.

## Getting Started

From the `client/` directory:

```bash
npm install
npm run dev
```

Open:
- [http://localhost:3000](http://localhost:3000)

### Other scripts

```bash
npm run build
npm run start
npm run lint
```
