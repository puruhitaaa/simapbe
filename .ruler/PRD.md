# Product Requirements Document (PRD): Bandung Integrated SPBE Governance Platform ("simapbe")

**Version:** 1.0  
**Status:** Draft  
**Target Scope:** Pemerintah Kota (Pemkot) Bandung (Internal Governance & Public Service Integration)  
**Project Repository:** `simapbe`

---

## 1. Executive Summary
The **"simapbe"** platform (internally referred to as Bandung Gov-Connect) is designed to operationalize the National SPBE Architecture at the local government level (Kota Bandung). It aims to eliminate application silos, standardize data management (Satu Data), and enforce a unified architecture across all Organisasi Perangkat Daerah (OPD) within Bandung. This platform will serve as the central repository for SPBE architecture, a monitoring tool for Peta Rencana (Roadmap), and an integration hub for internal and public services.

## 2. Problem Statement
Currently, the implementation of SPBE in local governments often faces challenges such as:
- **Siloed Architecture:** Business processes, data, and applications are not integrated, leading to duplication.
- **Disconnected Planning:** The Peta Rencana (SPBE Plan) is often disconnected from the actual budgeting and execution (RKA-PD).
- **Data Fragmentation:** Lack of standardized metadata makes interoperability between OPDs (e.g., Dinas Kesehatan and Dinas Kependudukan) difficult.

## 3. Objectives
1. **Centralized Architecture:** Digitize and map the 6 SPBE Domains (Process, Data, Service, App, Infrastructure, Security) specific to Kota Bandung.
2. **Integrated Planning:** Align the Kota Bandung Peta Rencana SPBE with the RPJMD (Regional Medium-Term Development Plan) and strategic goals.
3. **Standardized Data:** Enforce *Satu Data Indonesia* principles (Standards, Metadata, Reference Codes) for all internal data exchange.
4. **Governance & Audit:** Provide tools for internal audit (Audit TIK) and monitoring of SPBE maturity indices.

## 4. User Personas
| Persona | Role Description |
| :--- | :--- |
| **Super Admin (Diskominfo)** | Manages the overall architecture, defines standards, and approves application development requests. |
| **OPD Operator** | Inputs specific metadata (e.g., Dinas Kesehatan), updates business processes, and requests data interoperability. |
| **Strategic Planner (Bappelitbang)** | Views alignment between SPBE initiatives and the regional strategic plan (Renstra/RPJMD). |
| **Internal Auditor (Inspektorat)** | Conducts ICT audits based on the recorded architecture. |

## 5. Functional Requirements

### Module A: SPBE Architecture Repository (The Core)
This module maps the relationships between the 6 domains as mandated by Perpres 132/2022.

| ID | Feature | Description |
| :--- | :--- | :--- |
| **FR-A1** | Business Process Management | Input and visualization of Kota Bandung's business processes (Probismet) hierarchy (Sector -> Affairs -> Function). Must link to specific OPDs. |
| **FR-A2** | Data & Info Architecture | Repository for Data Standards, Metadata, and Reference Codes. Must classify data as Public or Restricted. |
| **FR-A3** | Application Inventory | Registry of all *Aplikasi Umum* (General) and *Aplikasi Khusus* (Specific) used by Pemkot Bandung. Must track development status (SDLC). |
| **FR-A4** | Infrastructure Mapping | Log of physical and virtual assets (Servers, Cloud usage) and their physical locations within the Bandung Intra-Gov Network. |
| **FR-A5** | Service Catalog | Registry of all digital services (G2C, G2B, G2G, G2E) mapped to the underlying business processes. |
| **FR-A6** | Metadata Linkage | Automated mapping tool to link Business Process ID ↔ Data ID ↔ App ID to ensure traceability. |

### Module B: Peta Rencana & Budgeting (Planning)
Focuses on the 5-year roadmap and annual execution.

| ID | Feature | Description |
| :--- | :--- | :--- |
| **FR-B1** | Gap Analysis Tool | Input "As-Is" architecture and define "To-Be" architecture to identify gaps (e.g., missing apps for a specific public service). |
| **FR-B2** | Roadmap Timeline | Gantt chart view for SPBE initiatives over 5 years, broken down by quarters. |
| **FR-B3** | Budget Consolidation | Mapping of SPBE initiatives to the Rencana Kerja dan Anggaran (RKA-PD) to prevent duplicate budgeting for similar apps. |

### Module C: Development & Interoperability (Execution)
Governs how new apps are built and connected.

| ID | Feature | Description |
| :--- | :--- | :--- |
| **FR-C1** | App Development Permit | Workflow for OPDs to request new apps. System checks for duplication against the Application Inventory before approval (Moratorium enforcement). |
| **FR-C2** | Source Code Repository | Integration with a Git-based repository where OPDs must deposit source code for *Aplikasi Khusus*. |
| **FR-C3** | API Manager (SPLP) | Management of the *Sistem Penghubung Layanan Pemerintah* (Local SPLP). Defines available APIs for internal data exchange. |

### Module D: Internal Governance & Security
Focuses on compliance and security standards.

| ID | Feature | Description |
| :--- | :--- | :--- |
| **FR-D1** | Risk Management | Module to register risks associated with SPBE assets and define mitigation plans. |
| **FR-D2** | Audit TIK Logs | Repository for audit evidence (documents, system logs) required for internal and external audits. |
| **FR-D3** | Security Standards Check | Checklist for *Kelaikan Keamanan* (Security Feasibility) required before any app goes live. |

## 6. Technical Stack & Non-Functional Requirements
Based on the current **Better-T-Stack** implementation:

- **Frontend:** Next.js (located in `apps/web`) with TailwindCSS and shadcn/ui.
- **Backend:** ElysiaJS with tRPC (located in `apps/server`).
- **Database:** PostgreSQL with Prisma ORM (located in `packages/db`).
- **Authentication:** Better-Auth (located in `packages/auth`).
- **Runtime:** Bun.

**NFRs:**
- **Interoperability:** Use standard protocols (RESTful API, JSON) to connect with National SPLP.
- **Security:** Implement SSO via Better-Auth for all internal users.
- **Compliance:** Data fields must comply with *Satu Data Indonesia* metadata structures.

## 7. Data Strategy (Satu Data Context)
- **Walidata:** Diskominfo Bandung (checks data standards).
- **Produsen Data:** Individual OPDs (responsible for data accuracy).
- **Workflow:** Produsen Input → Walidata Validates → Publish to Portal → API Availability.

## 8. Implementation Roadmap
1. **Phase 1: Foundation** (Months 1-3)
   - Deploy Architecture Repository (Module A).
   - Input "As-Is" data for Priority OPDs.
   - Establish SPBE Roles (Super Admin, Operator, Auditor).
2. **Phase 2: Integration** (Months 4-6)
   - Deploy SPLP/API Manager (Module C).
   - Implement the "App Development Permit" workflow.
3. **Phase 3: Optimization** (Months 7-12)
   - Deploy Peta Rencana & Budgeting tools (Module B).
   - Deploy Internal Audit module.

## 9. Success Metrics (KPIs)
- **Architecture Completeness:** 100% of OPDs submitted metadata.
- **Duplication Reduction:** 0% new duplicate apps after Phase 2.
- **SPBE Index:** Significant increase in Kota Bandung's SPBE Index score.
- **Interoperability:** Number of active APIs exchanged via the platform.
