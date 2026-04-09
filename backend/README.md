# Backend API Guide

NestJS backend with REST + GraphQL + Socket.IO real-time channels.

## Overview

This backend is designed around:
- `NestJS` modules per feature (`auth`, `chat`, `bot`, `gemini`, etc.)
- `Prisma + PostgreSQL` for relational data access
- `GraphQL` (code-first) for chat queries/mutations/subscriptions
- `Socket.IO` namespace for low-latency chat events
- `Swagger` docs for REST endpoints

Default local port:
- `http://localhost:3000`

## Run On A New Machine

### 1) Prerequisites

- Node.js `>= 20`
- npm (comes with Node)
- PostgreSQL running locally or remotely

### 2) Install dependencies

From `backend/`:

```bash
npm install
```

### 3) Create environment file

Create a `.env` file in `backend/`:

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/playground
JWT_SECRET=replace_with_a_long_secret
FRONTEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
```

Notes:
- `DATABASE_URL` is required by Prisma.
- `JWT_SECRET` signs/verifies access tokens.
- Google OAuth variables are required only if you use Google login.
- `GOOGLE_GENERATIVE_AI_API_KEY` is required for Gemini/Bot AI endpoints.

### 4) Prepare database

If you already have schema migrations:

```bash
npx prisma migrate dev
```

If you are pulling schema from existing DB:

```bash
npx prisma db pull
npx prisma generate
```

### 5) Start backend

```bash
npm run start:dev
```

Production build/start:

```bash
npm run build
npm run start:prod
```

## API Docs and Endpoints

### Swagger (REST)

- `http://localhost:3000/api`

### GraphQL

- HTTP endpoint: `http://localhost:3000/graphql`
- Supports subscriptions over WebSocket (graphql-ws)

### Socket.IO

- Namespace: `ws://localhost:3000/chat`

## Documentation References

- Backend approach and design notes: `backend/docs/`
- Start with: `backend/docs/README.md`
- Keep architecture decisions and trade-offs documented there as the project evolves.

## REST Routes

### Auth (`/auth`)

- `GET /auth/google` - start Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback and redirect to frontend
- `POST /auth/register` - register user
- `POST /auth/login` - login user
- `POST /auth/refresh` - refresh access token
- `POST /auth/logout` - logout one session
- `POST /auth/logout-all` - logout all sessions (JWT protected)
- `GET /auth/me` - current user profile from token (JWT protected)

### Chat (`/chat`)

- `POST /chat` - non-stream AI chat response
- `SSE /chat/stream` - streaming AI chat response
- `GET /chat/debug-sentry` - debug Sentry error capture

### Bot (`/bot`)

- `POST /bot/create`
- `GET /bot/chats`
- `GET /bot/caching-food`
- `GET /bot/code-execution`
- `GET /bot/google-search`

### Gemini (`/gemini`)

- `POST /gemini`
- `POST /gemini/stream-text`
- `POST /gemini/generate-object`

### Other REST modules

- `POST /code-execution`
- `POST /file-analysis`
- `POST /ai-agent`

## GraphQL Chat Operations (high-level)

Main operations implemented in chat resolver:
- Queries: `profile`, `room`, `roomsForUser`, `roomMembers`, `messages`, `message`
- Mutations: `createRoom`, `sendMessage`, `editMessage`, `deleteMessage`, `markRead`
- Subscriptions: `messageAdded(room_id)`, `messageUpdated(room_id)`, `messageRead(room_id)`

## Socket.IO Events (`/chat`)

Client emits:
- `join_room`
- `leave_room`
- `send_message`
- `edit_message`
- `delete_message`
- `typing_start`
- `typing_stop`
- `mark_read`

Server broadcasts:
- `new_message`
- `message_updated`
- `message_deleted`
- `user_typing`
- `message_read`
- `user_joined`
- `user_left`

## Prisma v7 Notes

- Prisma v7 keeps connection configuration in `prisma.config.ts`.
- PostgreSQL adapter is used via `@prisma/adapter-pg` and `pg`.
- Run `npx prisma generate` after schema changes.

## Useful Scripts

- `npm run start:dev` - start with hot reload
- `npm run build` - build application
- `npm run start:prod` - run built app
- `npm run lint` - run linting
- `npm run test` - run unit tests