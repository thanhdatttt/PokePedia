# PokePedia project state

Last verified against repository commit `5a5ecc1` on 2026-09-22.

This document is the authoritative continuation guide. When it conflicts with older planning notes, prefer this document and the source code. Update it whenever a feature changes architecture, API contracts, persistence, or delivery status.

## 1. Product intent

PokePedia is intended to become a Pokédex and team-building platform with authentication, searchable Pokémon data, favorites, saved teams, matchup analysis, and eventually AI recommendations and social sharing.

The repository is still in an early vertical-slice phase. Authentication, PokéAPI ingestion, Pokémon read APIs, and the type chart are the only substantial slices. The homepage and much of the navigation are placeholders.

## 2. What exists today

| Area | State | Notes |
| --- | --- | --- |
| Backend bootstrap | Implemented | NestJS global validation, JWT guard, success interceptor, error filter, CORS, and `/api` prefix. |
| Email registration | Implemented with integration caveats | Mailjet sends a six-digit OTP; Redis stores OTP and verification flags; PostgreSQL stores the user. |
| Login/token issuance | Backend implemented; frontend partial | Backend returns access and refresh tokens and stores a hash of the refresh token. Frontend retains only the access token. |
| Token refresh/logout | Contract mismatch | Backend requires `{ refreshToken }` in the request body; frontend sends neither and assumes an HTTP-only cookie that the backend never sets. |
| Password reset | Implemented | Redis-backed OTP verification, password replacement, and deletion of all refresh-token rows. |
| Current-user profile | Missing | Frontend calls `POST /users/me`; there is no users module or controller. |
| PokéAPI synchronization | Implemented | Sequential dependency-aware sync for generations, types, relations, stats, abilities, items, moves, species/evolutions, Pokémon/forms, and learnsets. |
| Pokémon REST API | Implemented | Paginated/filterable list, detail by numeric PokéAPI ID or slug, and paginated moves. |
| Pokédex frontend | Missing | Navbar links to `/pokedex`, but no route exists. |
| Type REST API | Implemented | Type list, complete attack/defense matrix, and single-type detail. |
| Type frontend | Implemented | `/types/chart` contains matrix and one/two-type defensive calculator. Navbar incorrectly points to `/types`. |
| Favorites, teams, admin, AI, social | Missing | Planned only; no modules, routes, or tables exist. |

## 3. Runtime architecture

```text
Browser / Next.js 16 App Router
  |  Axios; backend success envelopes are unwrapped client-side
  v
NestJS 11 API (/api)
  |-- global class-validator ValidationPipe
  |-- global Passport JWT guard; @Public() bypasses it
  |-- global response/error envelope formatting
  |
  |-- PostgreSQL through node-postgres + Drizzle ORM
  |-- Redis through ioredis
  |     - OTP and short-lived verification flags
  |     - type chart and evolution tree caches
  |-- Mailjet for OTP email
  `-- PokéAPI through pokedex-promise-v2 for synchronization
```

RabbitMQ, Gemini, Supabase-specific integration, Render configuration, and deployment pipelines do not exist in the repository. They remain ideas, not current dependencies.

### Backend request behavior

`backend/src/main.ts` installs runtime behavior that tests creating `AppModule` directly do not automatically receive:

1. unknown DTO fields are rejected and values are transformed;
2. every route is JWT-protected unless decorated with `@Public()`;
3. successful responses are wrapped in `{ success, statusCode, message, data, timestamp, path }`;
4. errors use the parallel `{ success: false, ... }` shape;
5. routes are prefixed with `/api`.

The frontend's `frontend/lib/api.ts` unwraps successful envelopes so services read the business payload from `response.data` and the envelope message from `response.message`.

## 4. Repository map

```text
backend/
  src/main.ts                       runtime bootstrap
  src/app.module.ts                 root Nest module
  src/auth/                         OTP, registration, login, JWT, Mailjet
  src/common/                       metadata decorators, envelopes, filters, utilities
  src/config/env.validation.ts      required backend environment contract
  src/database/                     Drizzle database service and schema
  src/pokemon/                      read APIs, type API, and PokéAPI sync pipeline
  src/redis/                        global Redis client/cache abstraction
  drizzle/migrations/               checked-in SQL; currently behind source schema
  test/                             generated starter e2e test only

frontend/
  app/                              Next.js App Router routes and global CSS
  components/auth/                  login/register/reset multi-step forms
  components/typeChart/             type matrix and calculator
  components/layout/NavBar.tsx      placeholder navigation/auth integration
  components/ui/                    shadcn/Radix primitives
  lib/api.ts                        public/authenticated Axios clients
  lib/validations/                  browser-side Zod validation
  services/                         API adapters
  stores/                           Zustand auth and type-chart state
  types/                            API and store TypeScript contracts

docs/                               product and engineering handoff documents
```

There is no root workspace package. Run npm commands from `backend/` or `frontend/`.

## 5. Backend modules and contracts

### Authentication

Registration flow:

1. `POST /api/auth/send-otp` with `{ email, type: "REGISTER" }` checks email uniqueness.
2. Mailjet sends a six-digit code; Redis stores `otp:REGISTER:<email>` for five minutes.
3. `POST /api/auth/verify-otp` consumes the OTP and stores `email_verified:<email>` for 15 minutes.
4. `POST /api/auth/register` requires that flag, checks email and username again, hashes the password with bcrypt (12 rounds), inserts the user, and removes the flag.

Password-reset verification uses the same pattern with `RESET` and a ten-minute `reset_verified:<email>` flag.

Login returns `{ accessToken, refreshToken }`. Access tokens expire after 15 minutes; refresh tokens after seven days. Refresh tokens are bcrypt-hashed in `refresh_tokens`, rotated on use, and deleted on logout or password reset.

Important security/contract issues:

- `MailService` logs the OTP value; remove that before production.
- No throttler is configured even though `@nestjs/throttler` is installed.
- Refresh tokens are response-body tokens, not cookies. The frontend currently assumes cookies.
- The global JWT guard makes logout protected, while the frontend calls it through the public Axios client without an access token or refresh-token body.

### API endpoint inventory

All paths below include the `/api` prefix.

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /` | Protected | Starter `Hello World!` response. |
| `POST /auth/send-otp` | Public | Send registration or reset OTP. |
| `POST /auth/verify-otp` | Public | Verify and consume an OTP. |
| `POST /auth/register` | Public | Create a verified account. |
| `POST /auth/login` | Public | Return access/refresh token pair. |
| `POST /auth/refresh` | Public | Rotate a refresh token supplied in the body. |
| `POST /auth/reset-password` | Public | Replace password after reset verification. |
| `POST /auth/logout` | Protected | Revoke a refresh token supplied in the body. |
| `GET /pokemon` | Public | Paginated default-form list. |
| `GET /pokemon/:idOrSlug` | Public | Pokémon detail with types, stats, abilities, forms, and evolution tree. |
| `GET /pokemon/:idOrSlug/moves` | Public | Paginated learnset for one version group. |
| `POST /pokemon/sync?limit=N` | Public, unsafe | Fire-and-forget synchronization; `limit` is development mode. |
| `GET /pokemon/sync/status` | Protected | In-process sync-running flag. |
| `GET /types` | Public | Type name/color list, excluding `stellar`. |
| `GET /types/chart` | Public | Full attacking-type by defending-type multiplier matrix. |
| `GET /types/:name` | Public | Offensive and defensive relationships for one type. |

Pokémon list query parameters: `page`, `limit` (max 100), `search`, `type`, `generation`, `isLegendary`, `sortBy` (`id`, `name`, `height`, `weight`), and `order`.

Move query parameters: `page`, `limit` (max 100), `search`, `learnMethod`, `versionGroupId`, `sortBy` (`name`, `power`, `accuracy`, `pp`, `level`), and `order`.

### Synchronization order

`SyncService` intentionally runs in this order:

1. generations;
2. types;
3. type relations;
4. stats;
5. abilities;
6. items;
7. moves;
8. species and evolution chains;
9. Pokémon forms plus type/stat/ability joins;
10. Pokémon learnsets.

The process is held by an in-memory `running` boolean and is not a durable job queue. Restarting the backend loses status. Full sync is network- and write-heavy. The HTTP endpoint returns before completion.

Known sync/data concerns:

- evolution nodes have no natural unique constraint, so repeated syncs can duplicate nodes even though the chain container is upserted;
- type chart cache is not explicitly invalidated after type-relation sync;
- only evolution-chain caches are cleared by a full sync;
- the public sync trigger needs authentication/authorization before any shared deployment.

## 6. Frontend routes and state

Implemented routes:

| Route | State |
| --- | --- |
| `/` | Placeholder welcome page. |
| `/login` | Login form with Zod validation. |
| `/register` | Email → OTP → account details flow. |
| `/forgot-password` | Email → OTP → new password flow. |
| `/types/chart` | Working matrix and dual-type calculator. |

Navbar links `/pokedex`, `/types`, `/builder`, `/profile`, `/teams`, `/favorites`, and `/settings` are placeholders. The mobile sign-up link uses `/signup`, while the actual route is `/register`.

Auth state is held in Zustand. Only `user` is persisted; access tokens intentionally remain in memory. However, the backend does not set a refresh cookie, so `AuthProvider.bootstrap()` cannot restore the session as written. `isAuthenticated` can become true after login, but the navbar does not consume the store and still defaults to a signed-out display.

The type-chart store fetches the whole matrix once per browser session. The dual-type calculator is computed locally by multiplying each attacking type's multipliers against one or two selected defending types.

TanStack Query and `next-themes` are installed but unused. The navbar theme button only toggles a local boolean and does not change document theme.

## 7. Persistence and cache model

Current Drizzle source schemas define:

- identity: `users`, `refresh_tokens`;
- reference data: `generations`, `types`, `type_relations`, `stats`, `abilities`, `items`, `moves`;
- Pokémon data: `pokemon_species`, `pokemon`, `evolution_chains`, `evolution_chain_nodes`;
- joins: `pokemon_types`, `pokemon_stats`, `pokemon_abilities`, `pokemon_moves`.

Species-level facts and form-level facts are deliberately separated. A species owns generation, legendary/mythical/baby flags, capture/breeding metadata, and flavor text. A Pokémon row represents a form and owns height, weight, sprites, base experience, and form flags.

Redis keys currently include:

- `otp:<REGISTER|RESET>:<email>`;
- `email_verified:<email>`;
- `reset_verified:<email>`;
- `type-chart`;
- `evolution-chain:species:<species UUID>`.

Migration warning: checked-in migrations `0000` and `0001` only represent an early auth model and removal of an old OTP table. They do not create the current Pokémon schema, and the original migration made `users.password_hash` nullable while the current schema requires it. Do not assume `npm run db:migrate` creates a usable fresh database until migrations are regenerated and reviewed.

## 8. Local environment

Backend required variables (validated at startup):

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

Frontend required variables:

```dotenv
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The backend Compose file starts Redis only. PostgreSQL must be supplied separately. Environment files are ignored and must never be committed.

## 9. Verification baseline

At the last documentation update:

- backend `tsc --noEmit` passed;
- frontend `tsc --noEmit` passed;
- no complete test suite exists;
- the only e2e test is the generated root `Hello World!` test and it does not reproduce the global bootstrap configuration from `main.ts`;
- lint scripts were not used as verification because the backend lint command includes `--fix` and would mutate source.

New features should add focused service/controller tests and frontend behavior tests rather than extending the starter test only.

## 10. Recommended continuation order

Work in vertical slices and keep this document synchronized.

1. **Repair the auth contract.** Choose either secure HTTP-only refresh cookies or explicit response-body refresh tokens, then update login, refresh, logout, Axios retry logic, and persistence consistently. Add `GET /users/me` (or change the client to the chosen endpoint), wire navbar auth state, and add route protection.
2. **Repair database bootstrapping.** Validate the recursive Drizzle schema path, generate/review migrations for every current table and enum, add required evolution-node uniqueness/foreign keys, and prove a clean database can migrate.
3. **Secure operations.** Restrict sync to an admin role, add OTP/auth rate limiting, stop logging OTPs, and define safe CORS/secret handling per environment.
4. **Build the Pokédex vertical slice.** Add frontend API types/services/state, `/pokedex`, filters/pagination, and `/pokedex/[idOrSlug]` consuming the existing APIs.
5. **Stabilize sync and caching.** Add durable job semantics or an administrative worker, progress/error reporting, idempotency tests, and complete cache invalidation.
6. **Add favorites and teams.** Design migrations, backend ownership rules, then UI. Keep teams capped at six members.
7. **Only then add AI/admin/social.** These depend on stable users, Pokémon data, teams, and authorization.

## 11. Engineering guardrails for future agents

- Treat source code plus this document as current truth; older diagrams describe desired scope.
- Do not claim a feature is implemented because a dependency is installed or a navbar link exists.
- Preserve the success/error response envelope unless frontend and backend are migrated together.
- Keep routes public only when read-only and intentionally anonymous. Sync and administration must not use `@Public()`.
- Keep species data separate from form data.
- Keep sync stages in dependency order and make repeated runs idempotent.
- Never expose or log OTPs, JWT secrets, refresh tokens, database URLs, or provider credentials.
- Generate and inspect migrations for every schema change; verify them against an empty database.
- Add tests with each vertical slice and exercise the same global Nest bootstrap behavior used in production.
- When finishing a feature, update the status table, endpoint inventory, data model, and known-gap list here.
