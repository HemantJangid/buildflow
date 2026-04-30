# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BuildFlow is a full-stack MERN (MongoDB, Express, React, Node.js) attendance management and worker tracking SaaS with geofencing. It is a Turborepo monorepo with `apps/api/` (backend) and `apps/web/` (frontend) and a shared constants package at `packages/shared/`.

## Commands

### Root (both apps)
```bash
npm install          # Install all workspace dependencies from root
npm run dev          # Start both API and web concurrently via Turborepo
npm run build        # Build all apps
```

### Individual apps (npm workspace syntax)
```bash
npm run dev -w @buildflow/api      # API dev server only (port 5001)
npm run dev -w @buildflow/web      # Web dev server only (port 5173, proxies /api → localhost:5001)
npm run build -w @buildflow/web    # Production build → apps/web/dist/
npm run preview -w @buildflow/web  # Preview built web app
```

### Seed scripts (API only)
```bash
npm run seed -w @buildflow/api              # Full bootstrap: permissions + org + admin user
npm run seed:permissions -w @buildflow/api  # Seed permissions only
npm run seed:admin -w @buildflow/api        # Seed admin user only
npm run seed:demo -w @buildflow/api         # Seed demo data
```

**Default credentials:** `admin@buildflow.com` / `admin123`

No automated test framework exists — testing is manual, documented in `TESTING.md`.

## Architecture

### Multi-Tenancy
All data is scoped to `organizationId`. Every model includes an `organizationId` field. Never query across organizations.

### Backend (Express + MongoDB)

**Auth flow:** `protect` middleware → verifies JWT, attaches `req.user` (id, organizationId, role, permissions) → `hasPermission(PERMISSION_NAME)` middleware → controller.

**Key files:**
- `packages/shared/index.js` — Single source of truth for `PERMISSIONS`, `ROLES`, and other shared enums; imported by both apps
- `apps/api/src/constants.js` — Re-exports from `@buildflow/shared` + backend-only constants (`AUTH_MESSAGES`, `DEFAULT_ORG_SETTINGS`)
- `apps/api/src/middleware/auth.js` — JWT verification + permission middleware
- `apps/api/src/utils/geofence.js` — Haversine formula for GPS location verification against project coordinates
- `apps/api/src/utils/pagination.js` — `getPagination()` (caps at MAX_PAGE_SIZE) + `paginatedResponse()`

**API response contract (must be preserved for frontend compatibility):**
- Standard: `{ success: boolean, data?: any, message?: string }`
- Paginated: `{ data: [], pagination: { total, page, limit, totalPages } }`

### Frontend (React 18 + Vite)

**State management:** React Context API only — `AuthContext` (auth state, `hasPermission`, `hasAnyPermission`), `ThemeContext`, `OrganizationSettingsContext`.

**Key files:**
- `apps/web/src/services/api.js` — Axios instance with Bearer token interceptor and 401 redirect; all API calls go through here
- `apps/web/src/context/AuthContext.jsx` — Login/logout/signup + permission helpers
- `apps/web/src/components/ProtectedRoute.jsx` — Permission-gated route wrapper
- `apps/web/src/lib/constants.js` — Re-exports from `@buildflow/shared` + web-only constants (attendance status, pagination, date presets)
- `apps/web/src/App.jsx` — Router setup with lazy-loaded protected routes + all context providers

**UI stack:** Tailwind CSS v4 + shadcn/ui (new-york style, JSX only — no TypeScript). Icons via `lucide-react`. Toasts via `sonner` using the `useMessage()` hook.

### RBAC
Permissions are defined in `packages/shared/index.js` — the single source of truth for both apps. `apps/api/src/constants.js` and `apps/web/src/lib/constants.js` both re-export from `@buildflow/shared`. Routes use `hasPermission(PERMISSION.SOME_ACTION)` middleware. Frontend gates pages/actions via `hasPermission()` from AuthContext.

### Geofencing
Clock-in/out verifies worker GPS coordinates against project site coordinates using Haversine distance in `apps/api/src/utils/geofence.js`.
