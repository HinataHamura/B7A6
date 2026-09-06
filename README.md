# Roomly — Housing & Roommate Platform (Backend)

A backend-only RESTful API for a housing and roommate-finding platform. Tenants can discover listings, book rooms, find compatible roommates, chat in real time, and pay securely; landlords manage listings and bookings; admins oversee the platform.

**Live API**: https://b7a6.onrender.com
**Postman Collection**: [`docs/Roomly.postman_collection.json`](docs/Roomly.postman_collection.json)

> Note: the live instance is on Render's free tier, which spins down after inactivity — the first request after idle may take 30-60s to respond while the instance wakes up.

## Tech Stack

- **Runtime**: Node.js, TypeScript (ESM)
- **Framework**: Express 5
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Cache**: Redis (Upstash, via ioredis)
- **Realtime**: Socket.IO
- **Auth**: JWT (access + refresh), Google OAuth (google-auth-library)
- **Payments**: SSLCommerz (sandbox)
- **File storage**: Cloudinary (via Multer)
- **Email**: Nodemailer (Gmail SMTP)
- **Validation**: Zod
- **Security**: Helmet, express-rate-limit, CORS
- **Lint/Format**: Biome
- **Deployment**: Render

## Architecture

```
Client → Routes → Controllers → Services → Prisma → PostgreSQL
                         ↓
     Redis (cache) / Socket.IO (realtime) / Cloudinary (media)
     SSLCommerz (payments) / Nodemailer (email) / AuditLog (activity tracking)
```

Each feature is a self-contained module under `src/app/module/<name>/` with:
- `*.route.ts` — Express router
- `*.controller.ts` — request/response handling (thin, wrapped in `catchAsync`)
- `*.service.ts` — business logic, Prisma queries
- `*.validation.ts` — Zod schemas
- `*.interface.ts` — TypeScript types (where needed)

## Roles

- **ADMIN** — manage users, verify landlords, review tenant verification, view platform stats and audit logs
- **LANDLORD** — create/manage listings, confirm/reject bookings, view own dashboard stats
- **TENANT** — search listings, book, pay, find roommates, review, chat, submit identity verification

## Key Features

- Listings with **geolocation-based nearby search** (haversine distance) and Redis-cached filtered search
- **Roommate compatibility matching** — weighted scoring across gender, smoking, pets, sleep schedule, cleanliness, and budget overlap
- **Real-time chat** between tenant and landlord via Socket.IO (JWT-authenticated handshake, validated payloads)
- **Review system** with verified-stay badge (only completed bookings can be reviewed)
- **SSLCommerz payment integration** — session creation, success/fail/cancel callbacks, IPN webhook, with server-side amount/transaction cross-validation before marking a payment paid
- **Transaction-safe booking creation** — serializable transaction + optimistic locking prevents double-booking under concurrent requests
- **Soft deletes** — listings are archived (`deletedAt`) rather than hard-deleted, preserving booking/review history
- **Audit logging** — critical actions (status changes, verifications, payments, admin actions) are recorded to an queryable audit trail
- **Tenant verification workflow** — tenants submit an ID document, admins approve/reject
- Notification system triggered on booking, payment, roommate-request, and verification events
- Transactional emails (welcome, booking status, payment receipt) via Nodemailer

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis (optional in dev — cache failures degrade gracefully)

### Setup

```bash
npm install
cp .env.example .env   # fill in your values
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Server runs on `http://localhost:5000` by default.

### Environment Variables

See `.env.example` for the full list: database URL (`DATABASE_URL` + `DIRECT_URL` for pooled connections), JWT secrets, Google OAuth credentials, Cloudinary keys, Redis URL, SSLCommerz store credentials, SMTP config, and demo admin credentials.

## Demo Credentials

| Role     | Email                     | Password     |
|----------|---------------------------|--------------|
| Admin    | admin@roomly.com          | Admin123!    |
| Landlord | landlord.demo@roomly.com  | Landlord123! |
| Tenant   | tenant.demo@roomly.com    | Tenant123!   |

(Created by `npm run prisma:seed`, along with 3 sample listings in Dhaka. These credentials work against the live deployment above.)

## API Response Format

All endpoints return a consistent envelope:

```json
// success
{ "success": true, "message": "Operation successful", "data": {} }

// error
{ "success": false, "message": "Something went wrong", "errors": [] }
```

## API Modules (46+ endpoints)

| Module        | Base Path                | Notes                                                        |
|---------------|---------------------------|---------------------------------------------------------------|
| Auth          | `/api/v1/auth`            | register, login, Google login, refresh, change password       |
| Users         | `/api/v1/users`           | self profile update, tenant verification submit/review        |
| Listings      | `/api/v1/listings`        | CRUD (soft-delete), `/nearby` geo search, save, landlord stats |
| Bookings      | `/api/v1/bookings`        | create (race-safe), status transitions                        |
| Payments      | `/api/v1/payments`        | initiate, success/fail/cancel, IPN, paginated history          |
| Roommates     | `/api/v1/roommates`       | compatibility matches, requests                                |
| Reviews       | `/api/v1/reviews`         | verified-stay reviews                                          |
| Messages      | `/api/v1/messages`        | conversation history (REST; live send via Socket.IO)           |
| Notifications | `/api/v1/notifications`   | list, mark read                                                |
| Admin         | `/api/v1/admin`           | user management, stats, **audit logs**                         |
| Upload        | `/api/v1/upload`          | Cloudinary image upload (magic-byte validated)                 |

Full endpoint documentation: import [`docs/Roomly.postman_collection.json`](docs/Roomly.postman_collection.json) into Postman — the `baseUrl` variable is pre-set to the live deployment.

## Notable Implementation Details

- **Pagination**: `?page=1&limit=10` on listings, payment history, and admin audit logs (capped at 100/page)
- **Filtering & search**: listings support `city`, `area`, `type`, `genderPreference`, `minRent`/`maxRent`, `bedrooms`, and free-text `searchTerm`
- **Indexing**: composite indexes on listing location/status/city, booking/payment status, message sender-receiver pairs
- **Concurrency safety**: booking creation uses a `Serializable` Prisma transaction; status updates use optimistic locking (`updateMany` with a status guard) to avoid lost updates
- **Rate limiting**: stricter limits on auth endpoints (login/register/Google), a global limiter elsewhere

## Scripts

```bash
npm run dev              # start dev server (tsx watch)
npm run build            # compile TypeScript + copy generated Prisma client
npm run start            # run compiled build
npm run prisma:migrate   # run migrations (dev)
npm run prisma:deploy    # apply migrations (prod)
npm run prisma:seed      # seed demo data
npm run lint             # biome check
```

## Deployment

Deployed on **Render** as a persistent Node web service (chosen over serverless because Socket.IO requires long-lived connections). Build/start commands:

```bash
# Build
npm install --include=dev && npx prisma generate && npm run build

# Start
npx prisma migrate deploy && npm run start
```

Database is hosted on Supabase (pooled connection via `DATABASE_URL` for runtime queries, direct connection via `DIRECT_URL` for migrations). Redis is hosted on Upstash.
