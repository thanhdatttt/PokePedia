# PokePedia backend

NestJS 11 API for authentication, Pokémon data synchronization/read APIs, and type effectiveness.

Read [../docs/PROJECT_STATE.md](../docs/PROJECT_STATE.md) before changing contracts or schema. It records current integration gaps and continuation priorities.

## Requirements

- Node.js/npm compatible with the checked-in lockfile
- PostgreSQL
- Redis (a local Compose service is included)
- Mailjet credentials for OTP delivery
- network access to PokéAPI for synchronization

## Environment

Create `backend/.env` locally. It is ignored by Git.

```dotenv
PORT=3001
DATABASE_URL=postgresql://...
CLIENT_URL=http://localhost:3000

JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAIL_FROM_EMAIL=...
MAIL_FROM_NAME=PokePedia
```

All listed values except `PORT`, Redis host/port/password defaults, are validated at startup. Use strong independent JWT secrets.

## Install and run

```bash
npm install
docker compose up -d redis
npm run start:dev
```

All runtime routes are prefixed with `/api`. The backend defaults to port 3000, which conflicts with the frontend default, so local development should normally use `PORT=3001`.

## Database commands

```bash
npm run db:generate
npm run db:migrate
npm run db:push
```

Warning: the checked-in migrations currently cover only an early authentication schema and do not create the current Pokémon tables. See [../docs/DatabaseDesign.txt](../docs/DatabaseDesign.txt) before using migration commands on shared data. A clean-database migration baseline is a current blocker.

## API behavior

- Global DTO validation strips nothing silently: unknown fields are rejected.
- All routes require bearer JWT authentication unless decorated with `@Public()`.
- Success and error responses use the shared envelopes documented in `src/common/interfaces/api-response.interface.ts`.
- CORS allows `CLIENT_URL` with credentials.

The complete endpoint inventory is in [../docs/PROJECT_STATE.md](../docs/PROJECT_STATE.md).

## Synchronizing PokéAPI data

```text
POST /api/pokemon/sync?limit=20
GET  /api/pokemon/sync/status
```

`limit` is intended for development. Without it, sync requests the full configured datasets. The trigger responds immediately and work continues inside the API process.

Current warning: the trigger is public, status is protected, execution is not durable, and evolution-node idempotency needs repair. Do not expose this endpoint publicly.

## Verification commands

```bash
npm exec -- tsc --noEmit
npm run test
npm run test:e2e
npm run test:cov
```

`npm run lint` includes `--fix` and mutates files. Use it only when edits are intended. The existing e2e test is still the generated starter test and does not install the global runtime configuration from `main.ts`.
