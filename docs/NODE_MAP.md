# MINT Node Reference Map

## Key Files & Their Roles

| File Path | Purpose | Last Updated |
|-----------|---------|--------------|
| frontend/src/pages/AppHome.tsx | Main landing page component | 2026-06-21 |
| backend/src/routes/auth.ts | Authentication route definitions | 2026-06-21 |
| backend/src/services/auth.service.ts | Core authentication business logic | 2026-06-21 |
| backend/prisma/schema.prisma | Database schema definition | 2026-06-21 |
| frontend/src/hooks/useSession.ts | Session state management | 2026-06-21 |
| frontend/src/components/layout/AppShell.tsx | Global layout and UI structure | 2026-06-21 |

## Critical Nodes
- **Frontend**: All `/src/pages/` and `/src/components/` files
- **Backend**: `/src/routes/**, /src/services/**` files
- **Database**: `schema.prisma` and generated models

## Update Policy
- Update this map after every code change
- Add new files when they exceed 100 lines or become critical components