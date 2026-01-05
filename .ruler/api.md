# API Specification (api.md)

**Project:** Bandung Gov-Connect
**Scope:** Internal Governance (tRPC) & SPLP Interoperability (REST)
**Version:** 1.0.0
**Compliance:** Perpres 95/2018, Perpres 132/2022, Satu Data Indonesia

## 1. API Strategy Overview
The platform utilizes a **Dual-Interface Strategy** to address conflicting requirements between internal type-safety and external standardization:

1.  **Internal Governance API (tRPC):** Used by the `apps/web` (Next.js) dashboard. It enables OPD operators to input "Metadata Arsitektur" with strict type validation, ensuring data integrity across the 6 SPBE Domains [Source 8, 9].
2.  **SPLP Interface (REST/JSON):** Used for external communication with other OPDs and the National Data Center (PDN). It implements the **Sistem Penghubung Layanan Pemerintah (SPLP)** standards (RESTful, JSON, Token-based Auth) as required by regulation [Source 31, 146].

## 2. Authentication & Security
*Ref: Domain Keamanan SPBE [Source 17, 83]*

### 2.1. Internal (Session-Based)
*   **Mechanism:** `HttpOnly` Cookies via **Better Auth**.
*   **Roles:** `SUPER_ADMIN` (Diskominfo), `OPERATOR` (OPD), `AUDITOR` (Inspektorat).
*   **Context:** `ctx.session.user` is injected into every tRPC procedure.

### 2.2. External / SPLP (Token-Based)
*   **Mechanism:** Bearer Token (OAuth2 or API Key).
*   **Standard:** Compliant with **BSSN** standards for electronic service authentication [Source 30, 145].
*   **Headers:**
    ```http
    Authorization: Bearer <access_token>
    X-Bandung-Agency-ID: <Kode_OPD>
    X-Transaction-ID: <UUID> (For Audit Trail)
    ```

---

## 3. Internal API: tRPC Routers (The 6 Domains)
*Ref: Perpres 132/2022 - 6 Domain Arsitektur [Source 160]*

The tRPC routers correspond directly to the Prisma Schema defined in `database.md`.

### 3.1. Business Process Router (`probis`)
*Ref: Arsitektur Proses Bisnis [Source 43, 75]*

*   **`create`**: Registers a new business process.
    *   *Input:* `kodeProbismet` (e.g., RAB.04.01), `name`, `level`, `parentId`.
    *   *Validation:* Must check uniqueness of `kodeProbismet`.
*   **`getHierarchy`**: Returns the tree structure: Sektor $\to$ Urusan $\to$ Fungsi.
*   **`linkService`**: Connects a Process ID to a Public Service ID (Required for integration).

### 3.2. Data Architecture Router (`data`)
*Ref: Satu Data Indonesia / Arsitektur Data [Source 104, 106]*

*   **`submitStandard`**: OPD submits a data standard proposal.
    *   *Input:* `dataName`, `format`, `validityPeriod`, `producerOpdId`.
*   **`validateMetadata`** (Walidata Only): Diskominfo approves the metadata structure.
    *   *Logic:* Ensures fields comply with *Satu Data* metadata attributes [Source 11].
*   **`getClassification`**: Returns whether data is `PUBLIC`, `RESTRICTED`, or `SECRET`.

### 3.3. Application Router (`app`)
*Ref: Arsitektur Aplikasi & Moratorium [Source 94, 161]*

*   **`register`**: Registers a new application entry.
    *   *Input:* `appName`, `type` (Umum/Khusus), `platform`, `techStack`.
*   **`checkDuplication`**: **CRITICAL**. Before registration, this procedure runs a similarity search against existing app names/functions to enforce the "Moratorium Pembangunan Aplikasi" [Source 66, 161].
    *   *Response:* `isDuplicate: boolean`, `similarApps: App[]`.
*   **`auditLog`**: Records SDLC changes (Development $\to$ Production) [Source 18].

### 3.4. Infrastructure Router (`infra`)
*Ref: Arsitektur Infrastruktur [Source 81, 143]*

*   **`registerAsset`**: Registers Server/Cloud assets.
    *   *Input:* `assetName`, `type` (Physical/Virtual), `location` (PDN/Local).
*   **`mapToApp`**: Links an `InfrastructureID` to an `ApplicationID`. An app cannot go live without linked infrastructure.

### 3.5. Service Router (`service`)
*Ref: Arsitektur Layanan [Source 76, 140]*

*   **`catalog`**: Lists all G2C, G2B, G2G services.
*   **`traceability`**: Returns the full dependency graph for a specific service:
    *   *Service* $\to$ *Process* $\to$ *App* $\to$ *Data* $\to$ *Infra* $\to$ *Security*.
    *   *Purpose:* Used for "Peta Rencana" gap analysis [Source 151].

---

## 4. External API: SPLP (REST/JSON)
*Ref: Sistem Penghubung Layanan Pemerintah [Source 31, 146]*

These endpoints allow external systems (e.g., West Java Province Portal, National Satu Data) to harvest data from Kota Bandung.

### 4.1. Reference Data Endpoint
Used to synchronize "Kode Referensi" across agencies.

*   **Endpoint:** `GET /api/splp/v1/references/probis`
*   **Response (JSON):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "code": "RAB.04.01",
          "name": "Perlindungan Kesehatan",
          "level": 3,
          "description": "Urusan pemerintahan bidang kesehatan..."
        }
      ],
      "metadata": {
        "version": "2024-Q1",
        "source": "Pemkot Bandung"
      }
    }
    ```

### 4.2. Data Exchange Endpoint
Implements the *Satu Data* interoperability principles.

*   **Endpoint:** `GET /api/splp/v1/dataset/{id}`
*   **Headers:** Requires `X-Data-Scope: Public`.
*   **Logic:**
    1.  Check `DataStandard` table for classification.
    2.  If `CONFIDENTIAL`, reject request unless the Token has specific clearance.
    3.  Log the request in `AuditLog` [Source 30].

---

## 5. Metadata Validation Schema (Zod)
*Ref: Metadata Arsitektur [Source 11, 162]*

To ensure the "Keterpaduan" (Integration) mandated by regulation, strict validation schemas are applied at the API gateway level.

```typescript
// Example Zod Schema for Application Registration
export const ApplicationSchema = z.object({
  name: z.string().min(3),
  type: z.enum(['UMUM', 'KHUSUS']), // Mandatory distinction per Perpres 95 [Source 12]
  opdId: z.cuid(),
  
  // Inter-domain dependencies (Critical for Architecture)
  supportedProbisId: z.cuid().describe("Link to Business Process"),
  consumedDataIds: z.array(z.cuid()).describe("Link to Data Standards"),
  
  // Security Compliance
  securityTestDate: z.date().optional().describe("Last Pentest Date"),
});
```

## 6. Audit & Logging Specifications
*Ref: Audit TIK & Keamanan [Source 30, 158]*

Every API write operation (Mutation in tRPC, POST/PUT/DELETE in REST) must trigger an audit log entry.

*   **Log Structure:**
    *   `Timestamp`: UTC ISO String.
    *   `Actor`: User ID or System Client ID.
    *   `Action`: e.g., `CREATE_APP_METADATA`.
    *   `Target`: e.g., `Application: {id}`.
    *   `Changes`: JSON Diff (Old Value vs New Value).
*   **Retention:** Logs must be kept for a minimum period (e.g., 5 years) to satisfy *Audit TIK* requirements [Source 30].

## 7. Error Handling Standards
*   **400 Bad Request:** Metadata validation failed (e.g., missing Business Process link).
*   **403 Forbidden:** Unauthorized access to `RESTRICTED` data class.
*   **409 Conflict:** Violation of Moratorium (Duplicate App detected) [Source 66].
*   **503 Service Unavailable:** SPLP Gateway down.