# PokePedia frontend

Next.js 16 App Router frontend for PokePedia.

Read [../docs/PROJECT_STATE.md](../docs/PROJECT_STATE.md) before extending the UI. It identifies which backend capabilities exist and which navbar/product areas are placeholders.

## Environment

Create `frontend/.env.local` locally. It is ignored by Git.

```dotenv
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`NEXT_PUBLIC_API_URL` is required and must include the backend `/api` prefix.

## Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Other commands:

```bash
npm run lint
npm exec -- tsc --noEmit
npm run build
npm run start
```

## Implemented routes

- `/` — placeholder homepage.
- `/login` — email/password login.
- `/register` — email, OTP, and account-details flow.
- `/forgot-password` — email, OTP, and reset flow.
- `/types/chart` — type matrix and one/two-type defensive calculator.

The navbar also links to routes that do not exist yet: `/pokedex`, `/types`, `/builder`, `/profile`, `/teams`, `/favorites`, and `/settings`. The mobile sign-up link incorrectly targets `/signup` instead of `/register`.

## Client architecture

- `lib/api.ts` defines public and bearer-authenticated Axios clients and unwraps the backend response envelope.
- `services/` contains endpoint adapters.
- `stores/` contains Zustand state/actions.
- `lib/validations/` contains Zod auth-form validation.
- `components/ui/` contains shadcn/Radix primitives.

TanStack Query and next-themes are installed but are not currently integrated.

## Authentication warning

Login stores the access token in memory. The frontend's bootstrap, refresh retry, and logout logic assume a refresh cookie, but the backend returns a refresh token in JSON and requires it in refresh/logout request bodies. The frontend also calls an absent `POST /users/me` endpoint, and the navbar is not connected to Zustand auth state.

Resolve this contract as one end-to-end change before building more authenticated features. Do not work around it by persisting raw refresh tokens in local storage without an explicit security decision.
