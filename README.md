# Roomly — Housing & Roommate Platform (Backend)

A backend-only RESTful API for a housing and roommate-finding platform. Tenants can discover listings, book rooms, find compatible roommates, chat in real time, and pay securely; landlords manage listings and bookings; admins oversee the platform.

## Tech Stack

- **Runtime**: Node.js, TypeScript (ESM)
- **Framework**: Express 5
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis (ioredis)
- **Realtime**: Socket.IO
- **Auth**: JWT (access + refresh), Google OAuth (google-auth-library)
- **Payments**: SSLCommerz
- **File storage**: Cloudinary (via Multer)
- **Validation**: Zod
- **Lint/Format**: Biome

## Architecture

```
Client → Routes → Controllers → Services → Prisma → PostgreSQL
                         ↓
                  Redis (cache) / Socket.IO (realtime) / Cloudinary (media) / SSLCommerz (payments)
```

Each feature is a self-contained module under `src/app/module/<name>/` with:
- `*.route.ts` — Express router
- `*.controller.ts` — request/response handling (thin, wrapped in `catchAsync`)
- `*.service.ts` — business logic, Prisma queries
- `*.validation.ts` — Zod schemas
- `*.interface.ts` — TypeScript types (where needed)

## Roles

- **ADMIN** — manage users, verify landlords, view platform stats
- **LANDLORD** — create/manage listings, confirm/reject bookings
- **TENANT** — search listings, book, pay, find roommates, review, chat

## Key Features

- Listings with **geolocation-based nearby search** (haversine distance) and Redis-cached filtered search
- **Roommate compatibility matching** — weighted scoring across gender, smoking, pets, sleep schedule, cleanliness, and budget overlap
- **Real-time chat** between tenant and landlord via Socket.IO (JWT-authenticated handshake)
- **Review system** with verified-stay badge (only completed bookings can be reviewed)
- **SSLCommerz payment integration** for booking advance/security deposit with IPN webhook verification
- Notification system triggered on booking, payment, and roommate-request events

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

See `.env.example` for the full list: database URL, JWT secrets, Google OAuth credentials, Cloudinary keys, SSLCommerz store credentials, SMTP config, and demo admin credentials.

## Demo Credentials

| Role     | Email                     | Password     |
|----------|---------------------------|--------------|
| Admin    | admin@roomly.com          | Admin123!    |
| Landlord | landlord.demo@roomly.com  | Landlord123! |
| Tenant   | tenant.demo@roomly.com    | Tenant123!   |

(Created by `npm run prisma:seed`, along with 3 sample listings in Dhaka.)

## API Response Format

All endpoints return a consistent envelope:

```json
// success
{ "success": true, "message": "Operation successful", "data": {} }

// error
{ "success": false, "message": "Something went wrong", "errors": [] }
```

## Core API Modules

| Module        | Base Path              | Notes                                  |
|---------------|-------------------------|-----------------------------------------|
| Auth          | `/api/v1/auth`          | register, login, Google login, refresh |
| Listings      | `/api/v1/listings`      | CRUD, `/nearby` geo search, save       |
| Bookings      | `/api/v1/bookings`      | create, status transitions             |
| Payments      | `/api/v1/payments`      | initiate, success/fail/cancel, IPN     |
| Roommates     | `/api/v1/roommates`     | matches, requests                      |
| Reviews       | `/api/v1/reviews`       | verified-stay reviews                  |
| Messages      | `/api/v1/messages`      | conversation history (REST)            |
| Notifications | `/api/v1/notifications` | list, mark read                        |
| Admin         | `/api/v1/admin`         | user management, stats                 |
| Upload        | `/api/v1/upload`        | Cloudinary image upload                |

Full endpoint documentation: see the Postman collection in this repo.

## Scripts

```bash
npm run dev              # start dev server (tsx watch)
npm run build            # compile TypeScript
npm run start            # run compiled build
npm run prisma:migrate   # run migrations (dev)
npm run prisma:deploy    # apply migrations (prod)
npm run prisma:seed      # seed demo data
npm run lint             # biome check
```

## Deployment

Configured for deployment on Render/Vercel. Set all environment variables from `.env.example` in your deployment platform, then run `npm run build && npm run prisma:deploy && npm run start`.
