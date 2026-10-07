---
applyTo: "backend/**"
---

# NestJS backend

- Read `backend/README.md` and inspect the closest module, provider, DTO, and test before changing API behavior.
- Keep feature logic in the existing NestJS module structure. Use dependency injection and the repository's established service/provider boundaries instead of creating a second application-level pattern.
- This backend uses Prisma/PostgreSQL and also includes Mongoose. Inspect the target feature to determine which persistence layer is authoritative; do not assume all data is stored through Prisma or migrate a feature between stores without an explicit requirement.
- Preserve API contracts and validation conventions for REST, GraphQL, and Socket.IO. Update consumers or schema/DTO definitions when the requested change affects a contract.
- Use existing configuration and environment-variable patterns for secrets. Never log secret values.
- Check `backend/package.json` and its lockfile before choosing package commands or adding dependencies. Do not run lint or Jest unless the user asks for verification.
