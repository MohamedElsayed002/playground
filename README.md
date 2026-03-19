

## Overview 

Nest offers two ways of building GraphQL applications, the code first and the schema first methods. You should choose the one that works best for you. Most of the chapters in this GraphQL section are divided into two main parts: one you should follow if you adopt code first, and the other be used if you adopt schema first 

In the code first approach, you use decorators and Typescript classes to generate the corresponding GraphQL schema. This approach is useful if you prefer to work exclusively with TypeScript and avoid context switching between language syntaxes

In the schema first approach, the source of truth is GraphQL SDL (Schema Definition Language) files. SDL is a language-agnostic way to share schema files between different platforms. Nest automatically generates your Typescript definitions (using either classes or interfaces) based on the GraphQL schemas to reduce the need to write redundant boilerplate code


nest g res products

```cmd
pnpm add -D prisma
pnpm add @prisma/client @prisma/adapter-pg pg
pnpx prisma init --datasource-provider postgresql

pnpx prisma migrate dev --name init
OR
pnpx prisma db pull

pnpx prisma generate
```

## Prisma v7 Notes

- In Prisma ORM v7, the database URL lives in `prisma.config.ts`, not in the `datasource` block of `schema.prisma`.
- Prisma Client now requires a driver adapter. For PostgreSQL, use `@prisma/adapter-pg` and `pg`, then pass the adapter to `new PrismaClient({ adapter })` in your NestJS PrismaService.


---

## Chat Application

- `chat.server.ts`: All DB logic (save, get, paginate)
- `chat.gateway.ts`: Socket.IO real-time gateway
- `chat.resolver.ts`: GraphQL queries/mutation/subscriptions 
- `chat.model.ts`: ObjectTypes (Message, Room, Profile)
- `chat.dto.ts`: Input Types

## Two real-time channels 

Socket.IO (`ws:localhost:3000/chat`) - for raw low-latency messaging 
    - `join_room` / `leave_room`/ `send_message` events
    - Broadcasts `new_message` to all room memebers

GraphQL `http://localhost:3000/graphql` - for structured data:
    - Queries `room`, `roomsForUser`, `messages`, `message`
    - Mutations: `createRoom`, `sendMessage`
    - Subscriptions: `messageAdded(room_id)` - live push via WebSocket


**6 database tables with full relations**

- **profiles**: Extends Supabase Auth - stores, username, avatar 
- **rooms**: Both DMS and group chats in one table (flag: `is_group`)
- **room_members**: Junciton table - connects users to rooms, with `role` (member/admin)
- **messages**: All messages, with soft delete `jsonb` metadata for files/images
`message_reads`: Read receipts - who saw which message (powers ✓✓) 
- `reactions` Emoji reactions with a unique constraint per (message, user, emoji)


## SQL vs NoSQL 

The data has real relationships (uses <-> rooms <-> messages <-> reactions) and SQL was literally designed for exactly that. NoSQL shines when you data has no predicatable shape or when you're operating at hundereds of millions of writes per day 

can you do for me the code prisma and postgresSQL. I think It has the same approach. and update the code in necessary parts and write the schema in file schema.prisma and give me the command to update the database