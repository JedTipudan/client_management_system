# Client Management System

A [Next.js](https://nextjs.org) web application for managing internet service clients, tracking due dates, and monitoring payment statuses.

## Features

- Client management (add, edit, delete, active/inactive)
- Due dates dashboard with real-time updates via Supabase
- Payment status tracking: **Paid**, **Unpaid**, **Unsettled**
- Location and plan management
- Admin controls for marking payments
- Live Supabase realtime subscriptions

## Getting Started

### 1. Set up environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Payment Status Logic

| Status | Meaning |
|---|---|
| **Paid** | Due date is in the future |
| **Unpaid** | Due date has passed within the current month |
| **Unsettled** | Due date is more than 1 month overdue |

### Clamped Due Date Handling

If a client's installation day doesn't exist in the due month (e.g. day 31 in April), the system:
- Stores the clamped date (e.g. `2025-04-30`) as the overdue reference — so the client correctly appears as **Unsettled** starting May 1
- Displays the next valid due date (e.g. `2025-05-31`) in the Due Date column
- Advances to the correct day when marked as paid

## Tech Stack

- [Next.js 16](https://nextjs.org)
- [Supabase](https://supabase.com) — database & realtime
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide React](https://lucide.dev) — icons

## Deployment

Deployed via [Vercel](https://vercel.com). Every push to `main` triggers an automatic redeploy.

## Changelog

### 2025-05-01
- Fixed due date status bug for clients with install day 31 in months with fewer days (e.g. April)
- Clients with clamped due dates (e.g. April 30 instead of April 31) now correctly show as **Unsettled** instead of **Paid**
- Due Date column now displays the next valid due date (e.g. May 31) while status is calculated from the actual missed month
- Simplified `handleMarkAsPaid` to always advance from the correct display date
