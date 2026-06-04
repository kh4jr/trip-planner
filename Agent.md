# Agent Guide: Trip Planner

This document provides guidelines, constraints, and operational patterns for AI agents collaborating on the Trip Planner codebase.

## Critical Developer Guidelines

1. **PowerShell Script Policy Bypass**:
   - The user's system disables running unsigned scripts (`.ps1`). Avoid running plain `npm` or `npx` in PowerShell commands, as it will trigger execution policy errors.
   - **Always run commands with `.cmd` extensions**, e.g., `npm.cmd i`, `npm.cmd run dev`, `npx.cmd prisma generate`.

2. **React 19 Compatibility**:
   - `react-simple-maps` version `3.0.0` has peer dependency constraints expecting React 16-18.
   - When installing new dependencies, always use `npm.cmd install --legacy-peer-deps` to bypass React 19 peer conflict warnings.

3. **Relation Mapping & Queries**:
   - Prisma implicit many-to-many relationship queries require using helper sub-queries like `connect` or `disconnect`.
   - In API handlers (such as the trip joining/apply flow), use `db.participant.upsert` to connect or create the user's participant profile to ensure reference integrity.
   - When mapping database models to client-side structures, handle nullable references (e.g. `Participant.user` for non-registered guests) with default fallback guest structures.
