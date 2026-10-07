---
applyTo: "playground-fastapi/**"
---

# FastAPI application

- Read relevant notes under `playground-fastapi/docs/` and inspect the closest route, service, schema, model, and tests before changing behavior.
- Keep HTTP handling in routes, business logic in services, request/response contracts in Pydantic schemas, and persisted entities in SQLAlchemy models, following local patterns.
- Use the existing async SQLAlchemy session and transaction conventions. Do not introduce synchronous database work into async request or worker paths.
- For schema changes, update the Alembic migration and model together; inspect all order or entity creation paths affected by new required fields.
- Preserve payment and inventory invariants across webhooks and Inngest jobs. Treat retries and duplicate Stripe events as normal; use row locks and conditional state transitions where needed.
- Register Inngest functions in the existing exported function list. Keep external calls retry-safe and keep secrets in `app.core.config.settings` backed by environment configuration.
- Use `playground-fastapi/requirements.txt` and `alembic.ini` as the dependency and migration references. Do not run pytest unless the user asks for verification.
