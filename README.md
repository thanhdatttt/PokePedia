# PokePedia

PokePedia is an in-progress full-stack Pokédex application. It currently combines a Next.js frontend with a NestJS API, PostgreSQL/Drizzle persistence, Redis caching, Mailjet OTP delivery, and a PokéAPI-to-PostgreSQL synchronization pipeline.

The current working product surface is:

- email/password authentication screens and backend OTP flows;
- public Pokémon list, detail, and move APIs;
- public type metadata and effectiveness APIs;
- a responsive type matrix and dual-type defensive calculator at `/types/chart`;
- a repeatable PokéAPI synchronization pipeline.

Most of the originally planned Pokédex UI, favorites, team building, administration, social features, and AI analysis are not implemented yet.

## Documentation

Start with [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md). It is the authoritative handoff for the current implementation, known integration gaps, and recommended continuation order.

- [docs/Requirement.txt](docs/Requirement.txt) — feature scope and implementation status
- [docs/Architecture.txt](docs/Architecture.txt) — runtime architecture and repository map
- [docs/DatabaseDesign.txt](docs/DatabaseDesign.txt) — current Drizzle model and migration status
- [docs/Teckstack.txt](docs/Teckstack.txt) — packages actually used versus planned
- [backend/README.md](backend/README.md) — backend setup and operations
- [frontend/README.md](frontend/README.md) — frontend setup and routes

## Quick start

The frontend and backend are separate npm projects.

```bash
# backend
cd backend
npm install
docker compose up -d redis
npm run start:dev

# frontend
cd frontend
npm install
npm run dev
```

The default local URLs are:

- frontend: `http://localhost:3000`
- backend API: `http://localhost:5000/api` unless `PORT` is changed

Both projects therefore default to port 3000. For local development, set the backend to another port (for example `PORT=3001`) and point `NEXT_PUBLIC_API_URL` at `http://localhost:3001/api`.

The backend also requires PostgreSQL. The checked-in migrations are incomplete and cannot yet build the current Pokémon schema from an empty database; repair the migration baseline described in `docs/DatabaseDesign.txt` or use an already provisioned development database.

Environment files are intentionally ignored. See the frontend and backend READMEs for required variable names. Do not commit secrets.

## Important current limitations

- The frontend refresh/logout flow does not yet match the backend token contract. A login works for the in-memory access token, but reload restoration and logout are incomplete.
- The frontend references `POST /users/me`, but no users module or endpoint exists.
- The checked-in migrations only cover the early authentication schema. They do not create the current Pokémon tables.
- `POST /api/pokemon/sync` is currently public and must be protected before deployment.
- Automated coverage is still only the generated Nest starter e2e test.

These are documented in detail in [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md).
