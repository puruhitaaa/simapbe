# Frontend Engineering Specification (frontend.md)

**Project:** Bandung Gov-Connect
**Framework:** Next.js 14+ (App Router)
**Communication:** tRPC (Internal), React Query
**UI Library:** Shadcn/UI + Tailwind CSS
**Compliance:** Perpres 132/2022 (Visualisasi Arsitektur), Perpres 95/2018 (Layanan SPBE)

## 1. Architectural Strategy
The frontend is built as a **Unified Dashboard** within a Monorepo (`apps/web`). It functions as the visual control plane for the "Keterpaduan" (Integration) of the 6 SPBE Domains.

### 1.1. Layout Structure
*   **Public Layout (`/portal`):** Landing page for "Bandung Satu Data" and Public Service Catalog. Optimized for Citizen-Centric access [Source 150].
*   **Admin Layout (`/dashboard`):** Restricted area for the *Tim Koordinasi SPBE*. Features a sidebar navigation strictly mapped to the 6 Domains mandated by regulation [Source 138, 139].

## 2. Technology Stack & Packages
*   **Core:** `Next.js` (React Server Components).
*   **State Management:** `TanStack Query` (via tRPC) for caching architectural metadata.
*   **Visualization:**
    *   `React Flow`: To render the "Arsitektur SPBE" graph, showing relationships between Processes, Apps, and Infrastructure [Source 36, 87].
    *   `Recharts`: For SPBE Index and Maturity Level visualizations [Source 145].
*   **Forms:** `React Hook Form` + `Zod` (sharing schemas from `packages/api`).

## 3. Module Specifications

### 3.1. Domain 1: Business Process Visualizer (Probismet)
*Ref: Arsitektur Proses Bisnis [Source 6, 70]*
*   **UI Requirement:** A Tree-Table view displaying the hierarchy:
    *   *Level 1:* Sektor Pemerintahan.
    *   *Level 2:* Urusan Pemerintahan.
    *   *Level 3:* Fungsi.
*   **Feature:** "Process Mapper". A drag-and-drop interface to link a specific Business Process to a Public Service (Layanan). This visualizes the mandate that "no app is built without a business process" [Source 148].

### 3.2. Domain 2: Data Catalog (Satu Data Interface)
*Ref: Satu Data Indonesia [Source 98, 104]*
*   **UI Requirement:** A search interface for Data Standards and Metadata.
*   **Interoperability View:** A dependency graph showing which Applications consume which Data Standards.
    *   *Visual:* Nodes = Apps, Edges = Data flow.
    *   *Goal:* Detect "Siloed Data" that isn't shared between OPDs.

### 3.3. Domain 3: Application & Moratorium Check
*Ref: Arsitektur Aplikasi [Source 94, 150]*
*   **The "Moratorium" Widget:** Before an OPD can click "Register New App," they must pass a search gateway.
    *   *Input:* Proposed App Name & Function.
    *   *Logic:* Frontend calls `trpc.app.checkDuplication`.
    *   *UI Feedback:* If similarity > 70% with an existing National/General App (Aplikasi Umum), the "Create" button is disabled, and the existing app is suggested to prevent budget waste [Source 62, 94].
*   **Repository Integration:** Input fields for Git Repository URLs to ensure source code ownership stays with the government [Source 27].

### 3.4. Domain 4: Infrastructure Topology
*Ref: Arsitektur Infrastruktur [Source 76, 134]*
*   **Asset Map:** A dashboard showing the distribution of servers.
    *   *Visual:* Split view between "PDN" (Pusat Data Nasional) and "Local Server Room".
    *   *Action:* One-click report generation for "Migrate to PDN" candidates.

### 3.5. Module Planning: Peta Rencana (Gap Analysis)
*Ref: Peta Rencana SPBE [Source 47, 48]*
*   **As-Is vs. To-Be View:** A split-screen UI.
    *   *Left Pane:* Current architecture (As-Is).
    *   *Right Pane:* Target architecture (To-Be).
    *   *Center:* Automated "Gap List" (e.g., "Missing Application for Service X").
*   **Gantt Chart:** A visual roadmap component using `d3-timeline` or similar to plot the 5-year implementation plan (2025-2029) [Source 66, 83].

### 3.6. Module Security: Audit & Risk Dashboard
*Ref: Keamanan & Audit TIK [Source 54, 59]*
*   **Risk Heatmap:** A 5x5 matrix visualizing Risk Impact vs. Likelihood for registered assets.
*   **Audit Logs:** A read-only table for Inspektorat (Auditors) to view timestamped changes to the architecture, fulfilling the *Audit TIK* evidence requirement [Source 27].

## 4. Integration Logic (The "Keterpaduan" Engine)
*Ref: Keterpaduan Layanan Digital [Source 35, 82]*

The frontend must enforce cross-domain referencing at the form level.
*   **Form Logic:** When creating a `Service` (Domain 5), the UI **forces** the user to select:
    1.  A parent `Business Process` (Domain 1).
    2.  A supporting `Application` (Domain 3).
*   **Error State:** "Orphaned entities" (e.g., an App not linked to a Service) are highlighted in Red on the main dashboard to prompt remediation.

## 5. Public Facing Portal (Bandung Satu Data)
*Ref: Portal Pelayanan Publik [Source 106]*
*   **Citizen Dashboard:** A simplified view for the public.
    *   *Search:* "Find a Service" (e.g., KTP, Tax).
    *   *Transparency:* View the list of Apps and Data Standards managed by Pemkot Bandung (Open Government).
    *   *Design:* High accessibility (WCAG 2.1) and responsive mobile design.

## 6. Development Guidelines for Turborepo
1.  **Type Sharing:** Import Prisma types directly from `@simapbe/db` to ensure the frontend form inputs exactly match the database schema.
2.  **Authentication:** Wrap the root layout with `Better Auth` SessionProvider. Use `proxy.ts` to redirect unauthenticated users away from `/dashboard` routes.
3.  **Component Library:** All shared UI elements (Buttons, Tables, Modals) must reside in `apps/web/src/components` to maintain consistency between the Admin Dashboard and Public Portal.