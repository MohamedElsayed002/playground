---
name: repo-workflow
description: Use for multi-step coding work in this workspace's client, NestJS backend, or FastAPI app. Helps scope changes to the correct app, preserve local work, trace existing flows, and finish with clear validation and a concise report.
---

# Repository workflow

Use this workflow when changing application behavior, integrating a feature across layers, changing data models or migrations, or debugging a multi-file issue in this repository.

## 1. Identify the target and its rules

- Determine whether the request belongs to `client/`, `backend/`, `playground-fastapi/`, or spans more than one app.
- Read the applicable `.github/instructions/*.instructions.md` file and the target app's README or relevant architecture notes. Also follow any closer `AGENTS.md` or other local instruction file if present.
- Inspect `git status` and the relevant diff before editing. Treat pre-existing changes as user work: preserve them, avoid broad formatting or cleanup, and distinguish them from changes made for the current request.
- If an app boundary or desired behavior is unclear, inspect call sites, API contracts, and neighboring implementations before asking the user. Ask only for information that cannot be inferred and materially affects the result.

## 2. Trace the existing path

- Follow the behavior from its entry point through validation, state management, service or API calls, persistence, and user-visible result.
- Find the local source of truth and follow the closest working pattern. Do not create parallel abstractions when an existing one fits.
- For cross-app work, verify the contract on both sides and make only the coordinated changes the request requires. Keep app-specific implementation and environment configuration separate.

## 3. Make a narrow, complete change

- Implement the requested behavior end to end, including relevant failure paths and state transitions. Avoid unrelated refactors.
- For payments, inventory, background work, or database changes, account for retries, duplicate events, transaction boundaries, concurrent updates, and rollback or compensation behavior where applicable.
- For schema changes, update the model and migration together, preserve existing data, and check all code paths that create or update the affected records.
- Keep credentials and webhook URLs in environment variables or the existing secret manager. Do not expose secret values in logs, docs, diffs, or chat output.
- Update the narrowest relevant documentation when behavior or operational setup changes.

## 4. Validate and report

- Do not add or run tests unless the user asks for tests or verification. When asked, select focused checks from the target app's scripts and report their actual result.
- Otherwise, inspect the diff for unintended scope, missing call-site updates, syntax issues that can be checked without running tests, and accidental secrets.
- In the final response, state what changed and why, link the main files, report checks that were actually run, and mention any operational step such as applying a migration or registering a scheduled job.

## App-specific instructions

Read the matching instruction file for work in that app:

- `client/**`: `.github/instructions/client.instructions.md`
- `backend/**`: `.github/instructions/backend.instructions.md`
- `playground-fastapi/**`: `.github/instructions/playground-fastapi.instructions.md`
