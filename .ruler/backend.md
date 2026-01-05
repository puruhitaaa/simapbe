# Backend Engineering Specification (backend.md)

**Project:** Bandung Gov-Connect (SPBE Governance Platform)
**Runtime:** Bun
**Framework:** ElysiaJS + tRPC
**ORM:** Prisma
**Compliance:** Perpres 132/2022 (National SPBE Architecture), Perpres 95/2018, Satu Data Indonesia

## 1. Architectural Strategy
The backend operates as a **Dual-Interface Gateway** to satisfy two distinct regulatory requirements:
1.  **Internal Governance (tRPC):** Provides end-to-end type safety for the `apps/web` dashboard used by Diskominfo and OPD operators to manage the "Metadata Arsitektur".
2.  **External Interoperability (REST/SPLP):** Exposes standard JSON endpoints via ElysiaJS to function as the Local *Sistem Penghubung Layanan Pemerintah* (SPLP), allowing data exchange with National and Provincial systems.

## 2. API Module Structure (The 6 Domains)
The backend logic is strictly compartmentalized into the 6 mandatory domains of the National SPBE Architecture to ensure "Keterpaduan" (Integration).

### Domain 1: Business Process Service (Tata Kelola)
*Ref: Perpres 132/2022, Source*
*   **Responsibility:** Manages the hierarchy of government functions (Probismet).
*   **Key Logic:**
    *   **Hierarchy Enforcement:** Enforces strict parent-child relationships: *Sektor* (L1) $\to$ *Urusan* (L2) $\to$ *Fungsi* (L3).
    *   **Cross-Reference:** Prevents the deletion of a Business Process if it is currently linked to an active `Service` or `Application` (Referential Integrity).

### Domain 2: Data & Information Service (Satu Data)
*Ref: Perpres 39/2019, Source*
*   **Responsibility:** Acts as the *Walidata* validation engine.
*   **Key Logic:**
    *   **Metadata Validation:** All incoming data standards must validate against the National Metadata Schema (Format, Periodicity, Producer) before storage.
    *   **Classification Check:** Enforces `DataClass` (Public/Restricted) rules. Data marked "Restricted" cannot be exposed via the Public SPLP endpoints without a specific token.

### Domain 3: Application Service (Aplikasi)
*Ref: Perpres 95/2018, Source*
*   **Responsibility:** Inventory and Lifecycle Management (SDLC) of applications.
*   **Key Logic:**
    *   **Moratorium Enforcement (Duplication Check):** When an OPD proposes a new app, this service runs a similarity query against the existing `Application` table to detect duplicate functions, as mandated to prevent budget waste.
    *   **Repository Link:** Connects metadata to the actual source code repository (e.g., Git) to ensure the government holds the Intellectual Property (IP).

### Domain 4: Infrastructure Service
*Ref: Source*
*   **Responsibility:** Asset management of Cloud, Servers, and Network.
*   **Key Logic:**
    *   **Capacity Planning:** Aggregates resource usage (vCPU, RAM, Storage) per OPD to assist in the "Peta Rencana" budgeting phase.
    *   **PDN Integration:** Flags assets hosted in the *Pusat Data Nasional* (PDN) versus local server rooms to track compliance with national infrastructure consolidation mandates.

### Domain 5: Public Service (Layanan)
*Ref: Source*
*   **Responsibility:** Catalog of G2C, G2B, G2G, and G2E services.
*   **Key Logic:**
    *   **Service Chaining:** Maps a `Service` to the underlying `BusinessProcess` and the supporting `Application`. A service cannot exist in the DB without these two parents (Orphan prevention).

### Domain 6: Security & Audit Service
*Ref: Source*
*   **Responsibility:** Risk Management (Manajemen Risiko) and Audit Trails.
*   **Key Logic:**
    *   **Audit Logger:** An Elysia `derive` middleware that intercepts every write operation (POST, PUT, DELETE) and logs the `User`, `Timestamp`, and `Action` to the `AuditLog` table for *Audit TIK* compliance.
    *   **Risk Calculator:** Automated scoring of `RiskRegister` entries based on Impact vs. Likelihood to categorize risks (Low/Medium/High).

## 3. Planning & Budgeting Engine (Peta Rencana)
*Ref: Source*
This module facilitates the "To-Be" architecture planning.
*   **Gap Analysis Procedure:**
    1.  Fetch `As-Is` Architecture state.
    2.  Fetch `To-Be` Architecture state (Draft).
    3.  Compute the delta: identifying "Missing Applications" or "Unintegrated Data" required to achieve the target.
*   **Budget Mapping:** links approved *Inisiatif Strategis* to specific budget codes (RKA-PD) to ensure alignment between planning and execution.

## 4. Technology Implementation Details

### 4.1. tRPC Router Structure (`packages/api/src/routers`)
To maintain the separation of domains, the tRPC router is structured as follows:

```typescript
export const appRouter = router({
  probis: businessProcessRouter, // Domain 1
  data: dataStandardRouter,      // Domain 2
  app: applicationRouter,        // Domain 3
  infra: infrastructureRouter,   // Domain 4
  service: serviceRouter,        // Domain 5
  security: securityRouter,      // Domain 6
  planning: petaRencanaRouter,   // Planning Module
});
```

### 4.2. Interoperability Layer (SPLP)
*Ref: Source*
We utilize Elysia's high-performance REST capabilities to serve the *Sistem Penghubung Layanan Pemerintah* (SPLP).

*   **Endpoint:** `/api/splp/v1/data-exchange`
*   **Protocol:** RESTful / JSON.
*   **Standards:** Must implement the specific metadata headers required by the National SDI Portal (e.g., `X-MetaData-ID`).
*   **Documentation:** Auto-generated Swagger/OpenAPI documentation via Elysia Swagger plugin to allow external OPD developers to consume the API easily.

### 4.3. Validation Strategy (Zod)
All inputs are validated using Zod schemas located in `packages/api`. This ensures that "Metadata Arsitektur" is consistent across the entire stack.
*   **Example Rule:** An application cannot be classified as "Umum" (General) unless it is tagged with a National Reference Code.

## 5. Security & Access Control
*   **Authentication:** Better Auth with PostgreSQL adapter.
*   **RBAC Middleware:**
    *   `verifyOPD`: Middleware to ensure an Operator can only modify data belonging to their own `opdId`.
    *   `verifyWalidata`: Specific permission for Diskominfo users to approve/reject data standards.

## 6. Deployment Considerations
*   **Containerization:** The Elysia server is Dockerized.
*   **State Management:** The backend is stateless; all architectural state is persisted in PostgreSQL.
*   **Performance:** Bun runtime is selected to handle the high volume of graph-like queries required when mapping the relationships between hundreds of Business Processes and Applications.