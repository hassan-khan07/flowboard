# FlowBoard

A full-stack SaaS project management tool (simplified Linear/Trello). Teams create workspaces, invite members with roles, manage tasks on a real-time Kanban board, and upgrade to a Pro plan through Stripe.

**Live demo:** https://flowboard-zeta-dusky.vercel.app
**Socket.io server repo:** https://github.com/hassan-khan07/flowboard-socket-server

> Billing runs in Stripe **test mode**. Use card `4242 4242 4242 4242`, any future date, any CVC. No real money is charged.
>
> Real-time sync depends on a separately hosted Socket.io server (Railway trial plan). If it is offline, the app still works fully; other users just need to refresh to see task moves.

## Screenshots

<!-- Add after taking them: board with drag in progress, members page, billing page -->
<!-- ![Kanban board](docs/board.png) -->
<!-- ![Demo](docs/demo.gif) -->

## Features

- **Auth:** email/password signup and login (NextAuth v5), email verification via Resend
- **Workspaces and roles:** Owner / Admin / Member, enforced on the server for every mutating route
- **Invites:** token-based email invites with a role; invitees join the existing workspace
- **Kanban board:** drag and drop (dnd-kit), task create/edit/delete, "last updated by" tracking
- **Real-time sync:** Socket.io pushes task moves to other connected users
- **Billing:** Stripe Checkout, webhooks, Free vs Pro plan limits (1 project and 3 members on Free)

## Tech stack

| Area       | Tools                                         |
| ---------- | --------------------------------------------- |
| Framework  | Next.js 16 (App Router), TypeScript, React 19 |
| Database   | PostgreSQL (Neon), Prisma 5                   |
| Auth       | NextAuth v5 (Credentials, JWT)                |
| UI         | Tailwind CSS v4, shadcn/ui, dnd-kit           |
| Real-time  | Socket.io (standalone server on Railway)      |
| Payments   | Stripe Checkout + webhooks                    |
| Email      | Resend + React Email                          |
| Validation | Zod                                           |
| Testing    | Vitest, Playwright                            |
| CI/CD      | GitHub Actions, Vercel                        |

## Architecture

```
Browser ── Next.js on Vercel ── PostgreSQL (Neon, flowboard_prod)
   │              │
   │              └── Stripe (Checkout, webhooks)
   └── Socket.io server on Railway (task-moved events)
```

The Socket.io server runs separately because Vercel's serverless model cannot host long-lived connections.

## Testing

- **Vitest (32 tests):** integration tests that call route handlers directly against a separate Neon database (`flowboard_test`). Auth and Stripe are mocked; the database is real, so constraints and permissions are actually exercised.
- **Playwright (11 tests):** end-to-end flows: signup, invite, Kanban (drag, edit, role-based delete), and billing/Stripe Checkout.
- **GitHub Actions:** every push runs both suites against the test database.

Writing these tests surfaced real bugs, all fixed:

- Invite API accepted `role: "OWNER"` and invalid emails (validation existed only in the form)
- Invite signup did not check that the email matched the invited email
- `proxy.ts` matcher used `/workspace` instead of `/workspaces`, so unverified users were not blocked
- Invite redirect dropped `+` from emails (missing `encodeURIComponent`)

## Run locally

```bash
git clone https://github.com/hassan-khan07/flowboard.git
cd flowboard
npm install
```

Create `.env` with: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `APP_URL`, `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`. Optionally set `NEXT_PUBLIC_SOCKET_URL` (defaults to `http://localhost:4000`).

```bash
npx prisma migrate deploy
npm run dev
```

For real-time sync, also run the socket server (separate repo) with `npm start` on port 4000.

```bash
npm test          # Vitest
npm run test:e2e  # Playwright (needs a test database)
```
