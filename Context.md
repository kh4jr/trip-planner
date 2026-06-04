# Project Context: Trip Planner

This file defines the project structure, dependencies, database state, and environment configuration.

## Project Structure
- **Framework**: Next.js 15.5 (App Router, Turbopack)
- **Database**: PostgreSQL hosted on Neon, managed with Prisma ORM.
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4

## Core Configurations
- [package.json](file:///c:/Users/kholy/next.js/trip-planner/package.json): Restored to use Next.js 15.5.9, React 19.1.0, and required UI/Map libraries (`lucide-react`, `react-simple-maps`). Pre-run commands configured to run db checks.
- [user.json](file:///c:/Users/kholy/next.js/trip-planner/user.json): Base test users containing default credentials.
- [prisma/seed-check.js](file:///c:/Users/kholy/next.js/trip-planner/prisma/seed-check.js): Checks database population at startup and seeds default users if the user table is empty.
- [prisma/schema.prisma](file:///c:/Users/kholy/next.js/trip-planner/prisma/schema.prisma): Database models including `User`, `Trip`, `Participant`, `Friend`, `Activity`, `Expense`, `Note`, `TripItem`, `Todo`, and `TripImage`.
- [next.config.ts](file:///c:/Users/kholy/next.js/trip-planner/next.config.ts): Configuration options for Next.js.
- [.env](file:///c:/Users/kholy/next.js/trip-planner/.env): Contains connection strings to Neon DB and NextAuth parameters.

## Key Relationships
1. **Trip & User (Owner)**: A `Trip` has an `ownerId` which relates to `User`.
2. **Trip & Participant**: A **many-to-many** relationship via implicit join tables (`_ParticipantToTrip`). Each `User` has a single unique `Participant` profile which can be linked to multiple trips. Guests without registered accounts can also have `Participant` records (without `userId`).
3. **User & Friend**: Friendship requests (`Friend` model) between two users with status `PENDING` or `ACCEPTED`.
