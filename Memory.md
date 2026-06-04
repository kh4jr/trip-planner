# Session Memory: System Fixes (June 2026)

This document tracks changes made to make the codebase compile, build, and run successfully.

## Problems Resolved

1. **Dependency Inconsistencies**:
   - **Problem**: `package.json` was downgraded to Next.js 9 / React 18, causing layout and type mismatch errors.
   - **Resolution**: Restored to Next.js 15.5.9, React 19.1.0, and added missing dependencies (`lucide-react`, `react-simple-maps`, and `@types/react-simple-maps`). Ran installation using `--legacy-peer-deps`.

2. **Prisma Schema Updates**:
   - **Problem**: Models (`Friend`), relations (`ownerId`, many-to-many participants), and fields (`createdByName` in `Activity`, `category` in `Expense`, `author` default values in `Note`, `isCompleted` in `TripItem`) were missing/different in `schema.prisma` compared to code queries.
   - **Resolution**: Fully updated `prisma/schema.prisma` and applied schema changes to the Neon DB using `npx.cmd prisma db push --accept-data-loss`.

3. **Participant Guest Fallbacks**:
   - **Problem**: `Participant.user` is nullable in database, but `FullTrip` types expect a non-null `user` object.
   - **Resolution**: Implemented map operations in [src/app/page.tsx](file:///c:/Users/kholy/next.js/trip-planner/src/app/page.tsx) that safely construct fallback user structures (using negative IDs and names) for guests.

4. **Trip Join API Fix**:
   - **Problem**: [src/app/api/trips/apply/route.ts](file:///c:/Users/kholy/next.js/trip-planner/src/app/api/trips/apply/route.ts) had a raw `unknown` cast on the Prisma client due to many-to-many types missing.
   - **Resolution**: Refactored the join query to type-safely `upsert` and `connect` many-to-many relationships.

5. **Database Checking and Auto-Seeding**:
   - **Problem**: Need database to automatically check for users and seed default test credentials before launching.
   - **Resolution**: Created `user.json` containing default credentials. Implemented `prisma/seed-check.js` which verifies database population and seeds the users if empty. Prepend this check to `"dev"` and `"build"` scripts in `package.json`.
