# Plan: simapbe Complete Platform Development Roadmap

All decisions confirmed. This is the final comprehensive task list with 55 steps across 11 phases, incorporating: seed data, optimistic UI, next-intl i18n (JSON-based), N+1 prevention with dev query logging, stale-while-revalidate (5min gcTime), and mandatory MCP/Context7 research protocol.

---

## Phase 1: Database Foundation (Week 1-2)

1. **Create complete Prisma schema** in `packages/db/prisma/schema/` — add `Opd`, `BusinessProcess`, `DataStandard`, `Application`, `Infrastructure`, `Service`, `SecurityAudit`, `RiskRegister`, `AuditLog`, `SpbePlan` models with all enums per `database.md`.

2. **Extend User model** in `auth.prisma` — add `role: UserRole` and `opdId` FK for multi-tenancy/RBAC.

3. **Create join tables** — `ApplicationData`, `ApplicationInfrastructure` with proper indexes.

4. **Enable Prisma query logging in dev** — configure `log: ['query', 'warn', 'error']` when `NODE_ENV === 'development'` in `packages/db/src/index.ts` to catch N+1 regressions.

5. **Run migrations** — execute `bun db:push` and regenerate client.

6. **Create seed script** at `packages/db/prisma/seed.ts` — initial OPDs, Probismet reference codes, sample users with roles, demo data per domain.

---

## Phase 2: Authentication & Authorization (Week 2-3)

7. **Research Better Auth RBAC** — query `mcp_better-auth_search` for role plugins, session customization before coding.

8. **Implement RBAC middleware** in `packages/auth/src/` — `verifyRole()`, `verifyOPD()`, `verifyWalidata()`.

9. **Update Better Auth config** in `packages/auth/src/index.ts` — extend session with `role` and `opdId`.

10. **Create user management API** — `admin.createUser`, `admin.assignRole`, `admin.assignOPD`.

---

## Phase 3: Core API Layer — 6 Domain Routers (Week 3-6)

11. **Create `opdRouter`** — CRUD with eager-load counts, avoid N+1.

12. **Create `probisRouter` (Domain 1)** — hierarchy with `parent`/`children` includes, `linkService` transaction.

13. **Create `dataRouter` (Domain 2)** — `submitStandard`, `validateMetadata`, include `applications` in single query.

14. **Create `appRouter` (Domain 3)** — `checkDuplication` with similarity search, include all relations.

15. **Create `infraRouter` (Domain 4)** — `registerAsset`, `mapToApp`, `groupBy` aggregation.

16. **Create `serviceRouter` (Domain 5)** — `traceability` with nested includes (Service→Process→App→Data→Infra).

17. **Create `securityRouter` (Domain 6)** — Risk scoring, batch audit queries.

18. **Create `planningRouter`** — Gap Analysis, budget aggregation.

19. **Create audit logging middleware** — batch inserts for mutations.

---

## Phase 4: SPLP Interoperability Layer (Week 6-7)

20. **Research ElysiaJS REST** — Context7 query for latest Elysia patterns.

21. **Create REST endpoints** at `apps/server/src/` — `/api/splp/v1/references/probis`, `/api/splp/v1/dataset/{id}`.

22. **Implement token authentication** — OAuth2/API Key for external SPLP consumers.

23. **Add Swagger documentation** — Elysia Swagger plugin.

---

## Phase 5: Frontend Foundation & i18n Setup (Week 7-9)

24. **Research next-intl** — Context7 query for App Router integration.

25. **Configure next-intl** — `i18n.ts`, middleware, `messages/id.json`, `messages/en.json`.

26. **Create translation structure** — JSON files organized by domain + common keys.

27. **Research shadcn components** — query `shadcn` MCP for Data Table, Command, Dialog.

28. **Create admin sidebar layout** — role-based nav, locale switcher in header.

29. **Install visualization libraries** — `@xyflow/react`, `recharts`, Gantt library.

30. **Create reusable data table** — TanStack Table with i18n headers.

---

## Phase 6: TanStack Query & Optimistic UI (Week 9-10)

31. **Research TanStack Query v5** — Context7 for `useMutation` optimistic patterns.

32. **Configure global query defaults** in `providers.tsx` — `staleTime: 30_000`, `gcTime: 300_000` (5 minutes).

33. **Create optimistic mutation utilities** — Create/Update/Delete with cache manipulation and rollback.

34. **Implement toast notifications** — Sonner with i18n success/error messages.

---

## Phase 7: Domain-Specific Frontend Pages (Week 10-15)

35. **Build `/dashboard/opd`** — OPD management with optimistic CRUD.

36. **Build `/dashboard/probis` (Domain 1)** — Tree-Table, optimistic node creation, Process→Service mapper.

37. **Build `/dashboard/data` (Domain 2)** — Data Catalog, React Flow dependency graph, Walidata approval.

38. **Build `/dashboard/apps` (Domain 3)** — Moratorium Widget, optimistic registration.

39. **Build `/dashboard/infra` (Domain 4)** — Asset Map (PDN/Local split), optimistic CRUD.

40. **Build `/dashboard/services` (Domain 5)** — Service Catalog, mandatory linkage, orphan alerts.

41. **Build `/dashboard/security` (Domain 6)** — Risk Heatmap, Audit Logs, Security Checklist.

42. **Build `/dashboard/planning`** — As-Is/To-Be, Gap List, Gantt Chart, budget view.

---

## Phase 8: Architecture Visualization (Week 15-16)

43. **Research React Flow** — Context7 for `@xyflow/react` customization.

44. **Create SPBE architecture graph** — custom nodes per domain, edge animations.

45. **Create Recharts dashboards** — SPBE Index, Maturity Level with i18n labels.

46. **Create traceability view** — service dependency chain with detail panels.

---

## Phase 9: Public Portal (Week 16-17)

47. **Create `/portal` layout** — "Bandung Satu Data", WCAG 2.1 AAA, locale switcher.

48. **Build `/portal/services`** — public service search.

49. **Build `/portal/data`** — Open Data Catalog.

---

## Phase 10: Testing & Quality (Week 17-18)

50. **Write API tests** — assert query counts (N+1 prevention), RBAC scenarios.

51. **Write E2E tests** — Playwright with locale switching, optimistic rollback.

52. **Accessibility audit** — WCAG 2.1 AAA, i18n screen reader testing.

---

## Phase 11: Deployment & Documentation (Week 18-19)

53. **Create Docker configuration** — multi-stage builds for server/web.

54. **Configure production** — PDN settings, security headers, CORS, disable query logging.

55. **Write documentation & seed production** — operator guide (ID/EN), API docs, `.ruler/` updates, run seed for initial data.

---

## Summary

| Phase | Focus                      | Tasks | Duration   |
| ----- | -------------------------- | ----- | ---------- |
| 1     | Database Foundation        | 1-6   | Week 1-2   |
| 2     | Auth & RBAC                | 7-10  | Week 2-3   |
| 3     | API Layer (6 Domains)      | 11-19 | Week 3-6   |
| 4     | SPLP Interoperability      | 20-23 | Week 6-7   |
| 5     | Frontend Foundation & i18n | 24-30 | Week 7-9   |
| 6     | Optimistic UI Patterns     | 31-34 | Week 9-10  |
| 7     | Domain Frontend Pages      | 35-42 | Week 10-15 |
| 8     | Visualization              | 43-46 | Week 15-16 |
| 9     | Public Portal              | 47-49 | Week 16-17 |
| 10    | Testing & QA               | 50-52 | Week 17-18 |
| 11    | Deployment & Docs          | 53-55 | Week 18-19 |

**Total: 55 tasks across 19 weeks**

---

## Critical Protocols

### MCP/Context7 Research Protocol

Before generating ANY code for a library, MUST query in this order:

1. **Specialized MCP** (`shadcn`, `better-auth`) if available
2. **Context7** (`resolve-library-id` → `query-docs`) as fallback

### N+1 Prevention

- Use Prisma `include`/`select` for eager loading
- Use `findMany` with relations, never loop + fetch
- Enable `log: ['query']` in dev to catch regressions
- Assert query counts in API tests

### Optimistic UI Pattern

- **Create**: Add to cache with temp ID, rollback on error
- **Update**: Update cache immediately, rollback on error
- **Delete**: Remove from cache immediately, rollback on error
- Use Sonner toasts for success/error feedback with i18n

### i18n Strategy

- JSON files in `messages/id.json` and `messages/en.json`
- Organized by domain + common keys
- Use `next-intl` for App Router integration
