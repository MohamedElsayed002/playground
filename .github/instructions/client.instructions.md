---
applyTo: "client/**"
---

# Client app (Next.js)

- Read `client/README.md` and inspect nearby code before changing UI or data flow.
- This is a Next.js App Router app using React and TypeScript. Route UI belongs in `client/app/`; reusable UI belongs in `client/components/`; shared behavior commonly belongs in `client/hooks/`, `client/actions/`, or `client/lib/` according to nearby patterns.
- Follow the existing server/client component boundary. Keep server-only credentials and database access out of client components and browser bundles.
- Use TanStack Query for server-state patterns already using it; use Zustand only for local shared state consistent with existing stores. Use the existing React Hook Form and Zod patterns for forms.
- Reuse existing API clients, generated types, and response helpers. Do not hand-maintain generated API output when the repository has a generator.
- Use `client/package.json` as the source for scripts and dependencies. Do not add a dependency when the current stack already provides the needed capability.
