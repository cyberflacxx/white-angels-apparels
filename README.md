# White Angels Apparels

Production-oriented first version of the White Angels Apparels e-commerce system.

## Architecture

- `client`: React, Vite, TypeScript, React Router, Axios, Lucide icons and modern CSS.
- `server`: Node.js, Express, TypeScript, JWT admin auth, PostgreSQL pooling, validation, security middleware and upload abstraction.
- `database`: SQL migrations and seedable development catalog data.
- `docs`: architecture notes and implementation decisions.

The React app never connects directly to PostgreSQL. All data access goes through the versioned API under `/api/v1`.

## Requirements

- Node.js 20+
- npm
- PostgreSQL 14+

## Local Setup

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

Server variables are listed in `server/.env.example`. Use `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, delivery fee, shop contact settings, social URLs, EcoCash placeholders and collection instructions there. Do not commit real secrets.

Client variables are listed in `client/.env.example`.

## PostgreSQL Setup

Create a database on the VPS or local PostgreSQL server, then set:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/white_angels_apparels
```

Run migrations and seed data:

```bash
cd server
npm run migrate
npm run seed
```

## Admin Creation

No admin password is committed. Create or update the first admin with environment variables:

```bash
cd server
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="replace-with-12-plus-chars" ADMIN_FULL_NAME="Store Admin" npm run create-admin
```

On PowerShell:

```powershell
$env:ADMIN_EMAIL="admin@example.com"; $env:ADMIN_PASSWORD="replace-with-12-plus-chars"; $env:ADMIN_FULL_NAME="Store Admin"; npm run create-admin
```

## Start Commands

Frontend:

```bash
cd client
npm run dev
```

Backend:

```bash
cd server
npm run dev
```

Builds:

```bash
cd client && npm run build
cd server && npm run build
```

Tests:

```bash
cd server
npm test
```

## Database Tables

The initial migration creates:

- `categories`
- `products`
- `product_images`
- `customers`
- `orders`
- `order_items`
- `payments`
- `delivery_addresses`
- `order_status_history`
- `admins`
- `inventory_movements`
- `schema_migrations`

Money uses PostgreSQL `numeric(12,2)`, not floating point.

## API Routes

Public:

- `GET /api/v1/settings`
- `GET /api/v1/categories`
- `GET /api/v1/products`
- `GET /api/v1/products/:slug`
- `POST /api/v1/orders/preview`
- `POST /api/v1/orders`
- `POST /api/v1/orders/track`

Admin:

- `POST /api/v1/admin/auth/login`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/orders`
- `GET /api/v1/admin/orders/:id`
- `PATCH /api/v1/admin/orders/:id/status`
- `GET /api/v1/admin/products`
- `POST /api/v1/admin/products`
- `PUT /api/v1/admin/products/:id`
- `DELETE /api/v1/admin/products/:id`
- `GET /api/v1/admin/categories`
- `POST /api/v1/admin/categories`
- `PUT /api/v1/admin/categories/:id`
- `GET /api/v1/admin/inventory`
- `POST /api/v1/admin/inventory/adjust`
- `GET /api/v1/admin/customers`
- `GET /api/v1/admin/reports`
- `GET /api/v1/admin/settings`

## Security

Implemented foundations:

- Helmet
- CORS with configured client origin
- Express rate limiting
- bcrypt password hashing
- JWT authentication
- Admin role middleware
- Zod request validation
- Image upload validation
- Error-handling middleware
- Environment validation
- Transactional order creation
- Server-side total calculation
- Stock validation and inventory movement history

## Production Deployment Outline

1. Provision PostgreSQL on the VPS.
2. Set real environment variables on the server, including a strong `JWT_SECRET`.
3. Run migrations.
4. Seed development catalog only if appropriate for the environment.
5. Create the first admin via `npm run create-admin`.
6. Build the frontend and backend.
7. Serve the backend behind HTTPS and a process manager.
8. Serve the frontend through a static host or reverse proxy.

## Current Placeholders

- Hero and product imagery use generated local placeholders in `client/public/images`.
- Real shop address, phone, email, WhatsApp, social links and EcoCash merchant details are environment-backed placeholders.
- Admin product/category create forms and inventory adjustment screens are UI/API foundations; full persistence for every admin form can be completed after connecting the database.
