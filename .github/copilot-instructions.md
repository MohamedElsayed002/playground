# Repository instructions

This workspace contains three separate applications: `client/` (Next.js), `backend/` (NestJS), and `playground-fastapi/` (FastAPI). Keep work inside the requested application unless the task explicitly requires a cross-app change. Do not assume the three apps share the same API implementation or persistence layer.

For multi-step coding work, follow the shared workflow in [`.agents/skills/repo-workflow/SKILL.md`](../.agents/skills/repo-workflow/SKILL.md). Apply the matching path-specific instructions under `.github/instructions/` for files in each application.

Before editing, inspect the target app's local guidance and the Git working tree. Preserve unrelated user changes and follow existing patterns in that app. Keep secrets in environment configuration; never print, copy into source, or commit secret values. Do not add or run tests unless the user asks for testing or verification. When finishing, summarize the changed files, behavior, and any checks that were run.
