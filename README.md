# Social Media Clone

A full-stack social platform built with the Next.js App Router, showcasing real-time chat, social graph features, and modern UX patterns.

## Live Demo

- https://social-media-clone-snowy.vercel.app/

## Highlights

- Real-time messaging with typing indicators, presence, DMs, group chats, and room membership powered by Socket.IO.
- Social feed with rich post creation, image uploads, likes, comments, and infinite scrolling via server actions.
- Discover and follow system with profile cards, follower metrics, and curated suggestions for new connections.
- Theme-aware, responsive UI using Tailwind CSS 4, Radix UI primitives, and custom design tokens.
- Secure authentication via NextAuth (GitHub OAuth and credentials) with role-based access, protected routes, and JWT sessions.
- Media handling through Supabase Storage for avatars, cover photos, and chat attachments.

## Tech Stack & Skills

- Application: Next.js 15 App Router, React 19, Server Components, Server Actions, Turbopack dev server.
- State & UX: Context-based providers for unread counts and presence, Zod validation, lucide-react, emoji-picker-element.
- Styling: Tailwind CSS 4, DaisyUI theme tokens, Radix UI components, shadcn-inspired UI kit.
- Data & Auth: Prisma ORM with PostgreSQL, NextAuth + Prisma adapter, bcrypt password hashing, jose JWT verification.
- Real-time: Custom Socket.IO server (`socket-server.mjs`) with NextAuth session handshakes and presence broadcasting.
- Storage & Media: Supabase Storage (service role uploads, public URLs) with image resizing helpers and upload guards.

## Architecture Notes

- Route groups split public and authed experiences under `src/app/(authed)` with shared layouts, headers, and contextual providers.
- Server Actions encapsulate mutations (posts, follows, conversations) while returning serializable payloads to client components.
- Prisma schema models social graph entities (posts, comments, likes, follows) and messaging (conversations, participants, message reads).
- Socket server validates either signed socket tokens or persisted NextAuth sessions before joining rooms, ensuring auth parity.
- Supabase admin client runs server-side for privileged uploads; client-side uses signed requests that never expose secrets.
- Utility scripts (`scripts/`) support avatar migration, format conversion, and WebSocket integration testing.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (see table below) in `.env.local`.
3. Set up the database:
   ```bash
   npx prisma migrate dev
   npm run seed
   ```
4. Start the dev servers (Next.js + Socket.IO):
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` and sign in with GitHub OAuth or a seeded credential.

For a production build run:

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for Prisma. |
| `NEXTAUTH_URL` | Base URL used by NextAuth in API routes (e.g. `http://localhost:3000`). |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Secret for signing NextAuth JWT tokens. |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub OAuth credentials. |
| `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for admin and client access. |
| `SUPABASE_SERVICE_ROLE` (or `SUPABASE_SERVICE_ROLE_KEY`) | Supabase service key for privileged server uploads. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key used in the browser. |
| `SUPABASE_BUCKET`, `NEXT_PUBLIC_SUPABASE_BUCKET` | Storage bucket names for posts and profile assets. |
| `NEXT_PUBLIC_APP_URL` | Public site origin (used in redirects and CORS). |
| `SOCKET_PORT`, `NEXT_PUBLIC_SOCKET_PORT`, `NEXT_PUBLIC_SOCKET_URL` | Config for the Socket.IO server endpoint. |

Create additional secrets (e.g. email seed credentials) as needed by the seed script.

## Available Scripts

- `npm run dev` – Starts Next.js (Turbopack) and the Socket.IO server concurrently.
- `npm run build` – Builds the Next.js app for production.
- `npm start` – Serves the production build.
- `npm run seed` – Seeds the database with demo users, profiles, conversations, and posts.
- `npm run lint` – Runs ESLint with the project config.
- `npm run socket-test` – Exercises the socket server events locally.
- `npm run backfill:avatars` / `npm run avatars:convert` – Utilities for avatar migration and format cleanup.

## Deployment Notes

- Frontend is deployed to Vercel; the standalone Socket.IO server can run on the same host (Node process) or a separate service with the same secrets.
- Prisma migrations should be run before each deploy (`prisma migrate deploy`) to keep the database in sync.
- Configure Vercel environment variables for both Next.js and the socket server, and ensure CORS points to the live domain.

## Portfolio Talking Points

- Built an authenticated, real-time messaging experience with secure socket handshakes and granular room access control.
- Designed a scalable social graph schema and server actions that keep Prisma queries efficient and serializable.
- Implemented image handling across posts, profiles, and chat by combining Supabase Storage with strict validation and size limits.
- Crafted a cohesive UI system with Tailwind utility tokens, Radix primitives, and reusable components for cards, dialogs, and inputs.

Feel free to tailor the content, screenshots, or copy to highlight the parts of the build you want to emphasize in your portfolio.
