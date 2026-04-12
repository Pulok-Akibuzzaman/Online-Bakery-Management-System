# Bakery Management System (SQLite + Express)

This project uses a relational database (SQLite) for persistent app data.

## Tech Stack

- Frontend: HTML/CSS/Vanilla JS
- Backend: Node.js + Express
- Database: SQLite (`better-sqlite3`)

## Database Model

The database persists core and operational data:

- `users`
- `products`
- `ingredients`
- `recipes`
- `orders`
- `order_items`
- `reviews`
- `cart_items`
- `app_meta` (stores current logged-in user id)

## Run Locally

Prerequisite: Install Node.js before running this project.

Download Node.js: https://nodejs.org/en/download

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open in browser:

- http://localhost:3000

## Database File

The SQLite file is created automatically at:

- `data/bakery.sqlite`

Database schema is defined in:

- `db/schema.sql`

Initial seed script is defined in:

- `db/seed.sql`

## API Endpoints

- `GET /api/health` - server + DB check
- `GET /api/state` - read persisted application state
- `PUT /api/state` - save persisted application state

## Features

- User authentication and role-based access control.
- Product catalog with categories, descriptions, and images.
- Shopping cart functionality with real-time updates.
- Order management system for customers and admins.
- Ingredient inventory tracking with low-stock alerts.
- Recipe management for product creation.
- Review system for customer feedback.
- Persistent data storage using SQLite.
- Backend API for state synchronization.
- Fallback to local cache when backend is offline.

## Notes

- On startup, backend executes `db/schema.sql` then `db/seed.sql`.
- `db/seed.sql` uses `INSERT OR IGNORE` to keep existing records intact.
- The frontend syncs to the backend on every data mutation (debounced).
- localStorage is used only as a fallback cache if the API is temporarily unavailable.

## Complete SQL Setup

To re-seed initial data, run `db/seed.sql` in a SQLite client.
