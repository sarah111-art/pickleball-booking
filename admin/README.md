# Admin Panel

This directory contains a small React/Vite application for the admin interface of the Pickleball Booking system. It includes a basic role-based UI allowing managers to view bookings and see staff permissions.

## Features

- Manager and staff roles
- Booking list (fetches from backend `/bookings` endpoint)
- Staff permissions table (static demo data)
- Simple login screen (mocked for demonstration)

## Getting started

```bash
cd admin
pnpm install      # or npm/yarn
pnpm run dev
```

The app uses Tailwind for styling and Vite as the build tool. Modify or extend it as needed for real data and authentication.
