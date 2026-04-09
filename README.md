# Playground

A learning and experimentation monorepo with three main areas: a **NestJS backend**, a **Next.js client**, and **LangGraph / LangChain** Python agents and notebooks. Together they cover full-stack APIs, real-time chat, AI integrations, database modeling, and graph-based LLM workflows.

## Repository layout

| Path | Role |
|------|------|
| [`backend/`](backend/) | NestJS API (REST, GraphQL, WebSockets, Prisma, AI services, vercel-ai-sdk) |
| [`client/`](client/) | Next.js App Router UI, TanStack stack, chat, demos |
| [`LangGraph/`](LangGraph/) | Jupyter notebooks and standalone Python agent scripts |

---

## Backend ([`backend/`](backend/))

**Framework and runtime**

- **NestJS** (TypeScript) with modular architecture (`AppModule` wires feature modules).
- **Swagger** at `/api` for HTTP API documentation.
- **Helmet** and **CORS** enabled in [`main.ts`](backend/src/main.ts); default listen port **3000**.
- **vercel-ai-sdk** code execution, file analysis using OpenAI, Gemini
- **OAuth2.0** use can login with Gmail instead of sharing his password
- **Sentry** o11y, and trace logs

**Data and persistence**

- **Prisma** with **PostgreSQL**: users, auth (`UserData`, `RefreshToken`), chat domain (`Profile`, `Room`, `RoomMember`, `Message`, `Attachment`, `MessageRead`), plus a separate `User` model for profile-style records. See [`prisma/schema.prisma`](backend/prisma/schema.prisma).
- **Mongoose** is present in dependencies and a **Bot** schema exists; Mongo connection in `AppModule` is commented out—pattern for optional Mongo usage is still in the codebase.

**API styles**

- **GraphQL (Apollo)** with code-first schema, file generation to `src/schema.gql`, and **subscriptions** (`graphql-ws` and legacy transport) for real-time GraphQL patterns.
- **REST controllers** for products, auth, chat HTTP surface, Gemini, code execution, file upload analysis, AI agent routes, etc.

**Authentication**

- **JWT** with **Passport** (`JwtStrategy`, `JwtAuthGuard`): register, login, refresh tokens, logout, logout-all patterns in [`auth/`](backend/src/auth/).

**Real-time**

- **Socket.IO** gateway under namespace `/chat` ([`chat.gateway.ts`](backend/src/chat/chat.gateway.ts)): connection lifecycle, user mapping from handshake auth, integration with `ChatService` for messaging and online status.

**AI and LLMs (Vercel AI SDK ecosystem)**

- **[`ai-agent/`](backend/src/ai-agent/)**: `ToolLoopAgent`, Zod `inputSchema`, multi-step tool use (e.g. weather + unit conversion), `generateText` / `generateObject` patterns with **OpenAI** and **Google** models via `@ai-sdk/openai` and `@ai-sdk/google`.
- **[`gemini/`](backend/src/gemini/)**: `generateText`, `streamText`, `generateObject` with options for web search, code execution, file/vision payloads, thinking budget, structured outputs (Zod).
- **[`code-execution/`](backend/src/code-execution/)**: wraps Gemini with **code execution** enabled for problem-solving flows.
- **[`file-analysis/`](backend/src/file-analysis/)**: multipart uploads (PDF, images); sends file data to Gemini for **document/image analysis**.
- **[`bot/`](backend/src/bot/)**: Gemini via `createGoogleGenerativeAI`, **Google AI cache manager**, and Nest **cache-manager** for response/caching experiments.

**Other backend topics**

- **DTO validation** with `class-validator` / `class-transformer`.
- **Products** CRUD as a classic REST + entity example.
- **Throttler** and related packages in `package.json` for rate limiting when enabled in modules.

---

## Frontend ([`client/`](client/))

**Framework**

- **Next.js 16** (App Router), **React 19**, **TypeScript**.
- **Tailwind CSS v4** with **tw-animate-css**; **shadcn** tooling and **Radix UI** primitives; **class-variance-authority**, **clsx**, **tailwind-merge** for styling patterns.

**Data fetching and server**

- **TanStack Query** (+ devtools) for client-side data and caching.
- **Prisma** + **PostgreSQL** used from the Next app in places such as [`app/10k-users/page.tsx`](client/app/10k-users/page.tsx) (server-side `findMany` for large lists)—demonstrates sharing the same DB stack as the backend.
- **Next.js Route Handlers** under [`app/api/`](client/app/api/): e.g. chat, email (`nodemailer`), user listing, **OpenAI Realtime token** proxy for the realtime demo.

**GraphQL client**

- **`graphql-request`** for HTTP queries/mutations and **`graphql-ws`** for subscriptions ([`lib/graphql-client.ts`](client/lib/graphql-client.ts)), aligned with the Nest GraphQL server.

**Real-time and AI UX**

- **`socket.io-client`** for chat aligned with the Nest `/chat` gateway.
- **TanStack AI** (`@tanstack/ai`, `@tanstack/ai-react`, `@tanstack/ai-openai`) on [`app/realtime/page.tsx`](client/app/realtime/page.tsx): voice/text realtime chat via `useRealtimeChat` and a token endpoint.

**Forms and state**

- **Tanstack Form** with **Zod** resolvers.
- **Zustand** for client state where needed.

**Performance and tables**

- **TanStack Virtual** for virtualized long lists (e.g. **10k users** demo vs [`components/performance/user-list-tanstack-virtual.tsx`](client/components/performance/user-list-tanstack-virtual.tsx)).
- **TanStack Table** for data-grid style UIs.
- Optional **Three.js** and **Framer Motion**-style animated layout components under [`components/layouts/`](client/components/layouts/) (beams, dot patterns, grids, orbits, etc.).

**Product features and routes (high level)**

- **Auth**: login/register flows; root [`app/page.tsx`](client/app/page.tsx) uses session and redirects to `/rooms` or `/auth/login`.
- **Chat**: room list and room detail under [`app/(chat)/rooms/`](client/app/(chat)/rooms/).
- **Admin** chat UI: [`app/admin/page.tsx`](client/app/admin/page.tsx).
- **Users** listing and detail: [`app/users/`](client/app/users/).
- **Learning / demos**: [`app/react-hooks/`](client/app/react-hooks/) covers **useState**, **useEffect**, **useRef**, **FormData**, and **performance** patterns (memoization, list splitting); companion notes in [`client/docs/`](client/docs/) (e.g. `react-hooks.md`, `useRef.md`, TanStack Virtual notes).

**Tooling**

- **TanStack React Hotkeys**, **Lucide** icons, **Sileo** (per `package.json`).

---

## LangGraph ([`LangGraph/`](LangGraph/))

**Notebooks ([`LangGraph/graph/`](LangGraph/graph/))**

Jupyter notebooks walk through **LangGraph** fundamentals:

- **Hello world**: `StateGraph`, `TypedDict` state, single node, compile, **Mermaid** graph visualization.
- **Sequential**, **conditional**, and **loop** graphs (including variants) to practice edges, branching, and iteration.

**Python agents ([`LangGraph/agent/`](LangGraph/agent/))**

- **[`agent_bot.py`](LangGraph/agent/agent_bot.py)**: Minimal linear graph—one node, `ChatOpenAI`, CLI loop (state without long-term memory accumulation in the snippet).
- **[`memory_agent.py`](LangGraph/agent/memory_agent.py)**: **Conversation memory** by appending `HumanMessage` / `AIMessage` and passing full history through the graph; logs conversation to `logging.txt`.
- **[`ReAct-Agent.py`](LangGraph/agent/ReAct-Agent.py)**: **ReAct-style** graph with **`@tool`** functions, `ToolNode`, **`add_messages`**, conditional routing (`should_continue`) between the LLM and tools.
- **[`drafter.py`](LangGraph/agent/drafter.py)**: **Document assistant** with tools to **update** in-memory document content and **save** to `.txt`, combining system prompts and tool calling.
- **[`RAG.py`](LangGraph/agent/RAG.py)**: **RAG pipeline**—PDF load (`PyPDFLoader`), **chunking** (`RecursiveCharacterTextSplitter`), **OpenAIEmbeddings**, **Chroma** vector store, retriever, and graph/agent logic grounded on retrieved context (expects a PDF such as `Full-Stack.pdf` in the agent folder).

**Topics covered in this folder**

- LangGraph **`StateGraph`**, **START** / **END**, **conditional edges**, loops.
- LangChain **messages** (`HumanMessage`, `AIMessage`, `SystemMessage`, `ToolMessage`).
- **Tool calling**, **`ToolNode`**, **`bind_tools`**.
- **Memory** and multi-turn CLI flows.
- **RAG**: embeddings, vector DB, retrieval, and LLM grounding.

---

## Running locally (overview)

Exact env vars are not committed; you typically need:

- **Backend**: PostgreSQL URL for Prisma, JWT secrets, and API keys for OpenAI / Google as used by Gemini and AI modules.
- **Client**: API base URLs for GraphQL/REST/Socket.IO, database URL if using Prisma from Next, and keys for realtime/email routes as configured.
- **LangGraph**: Python environment with `langgraph`, `langchain_*`, `chromadb` / Chroma dependencies, `OPENAI_API_KEY`, and optional PDF assets for RAG.

Use each package’s `package.json` or notebook/kernel for install and start commands (`npm run start:dev` in `backend`, `npm run dev` in `client`).

---

## Summary

This project is a **full-stack AI and chat playground**: NestJS ties together **GraphQL**, **REST**, **WebSockets**, **Prisma**, and **multi-provider LLM** tooling; the Next client demonstrates **modern React**, **TanStack** data/AI/virtualization, **GraphQL + WebSocket clients**, and **realtime voice/text**; **LangGraph** notebooks and scripts isolate **graph construction**, **agents**, **tools**, **memory**, and **RAG** for step-by-step learning.
