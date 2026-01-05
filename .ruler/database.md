# Database Schema Design

**Project:** simapbe (Bandung Gov-Connect)  
**Stack:** PostgreSQL, Prisma ORM, Better Auth  
**Primary Scope:** Pemerintah Kota Bandung (Internal Governance)

---

## 1. Overview
The database design is centralized around the **Opd** (Organisasi Perangkat Daerah) as the primary tenant. The schema operationalizes the National SPBE Architecture framework by linking Business Processes to Applications, Data, and Services to ensure the "Keterpaduan" (Integration) mandated by regulation.

## 2. Prisma Schema Structure
The schema is managed within `packages/db/prisma/schema/` using Prisma's multi-file schema feature.

### Base Configuration (`schema.prisma`)
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["prismaSchemaFolder"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 1. Authentication & User Management (`auth.prisma`)
Supports **Better Auth** out-of-the-box.

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified Boolean?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Custom Fields for SPBE Context
  role          UserRole  @default(OPERATOR)
  opdId         String?   // Link to specific Dinas/Badan
  opd           Opd?      @relation(fields: [opdId], references: [id])
  
  // Relations
  sessions      Session[]
  accounts      Account[]
  auditLogs     AuditLog[]
  
  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Account {
  id           String    @id @default(cuid())
  userId       String
  accountId    String
  provider     String
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  password     String?
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("accounts")
}

model VerificationToken {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime

  @@map("verification_tokens")
}
```

### 2. Core Governance: Organization & Architecture (`architecture.prisma`)

```prisma
model Opd {
  id          String   @id @default(cuid())
  code        String   @unique // Kode Satker/Unit
  name        String   // e.g., "Dinas Kesehatan Kota Bandung"
  acronym     String?  // e.g., "DINKES"
  address     String?
  
  users       User[]
  apps        Application[]
  infraAssets Infrastructure[]
  risks       RiskRegister[]
  
  @@map("opds")
}

// DOMAIN 1: BUSINESS PROCESS
model BusinessProcess {
  id              String   @id @default(cuid())
  kodeProbismet   String   @unique // Standardized Code (e.g., RAB.04.01)
  name            String
  description     String?
  level           Int      // 1=Sektor, 2=Urusan, 3=Fungsi
  parentId        String?
  parent          BusinessProcess? @relation("ProbismetHierarchy", fields: [parentId], references: [id])
  children        BusinessProcess[] @relation("ProbismetHierarchy")
  
  services        Service[]
  
  @@map("business_processes")
}

// DOMAIN 2: DATA & INFORMATION
model DataStandard {
  id              String   @id @default(cuid())
  dataName        String
  producerOpdId   String?  // Produsen Data
  
  format          String
  validityPeriod  String
  classification  DataClass @default(PUBLIC)
  
  applications    ApplicationData[]
  
  @@map("data_standards")
}

// DOMAIN 3: APPLICATION
model Application {
  id              String   @id @default(cuid())
  name            String
  opdId           String
  opd             Opd      @relation(fields: [opdId], references: [id])
  
  type            AppType  @default(KHUSUS)
  platform        PlatformType
  status          AppStatus @default(ACTIVE)
  
  programmingLang String?
  databaseType    String?
  
  infrastructure  Infrastructure[]
  usedData        ApplicationData[]
  services        Service[]
  securityAudits  SecurityAudit[]
  
  @@map("applications")
}

model ApplicationData {
  appId           String
  dataId          String
  application     Application  @relation(fields: [appId], references: [id])
  dataStandard    DataStandard @relation(fields: [dataId], references: [id])
  relationType    DataRelation // PRODUCER or CONSUMER

  @@id([appId, dataId])
  @@map("application_data")
}
```

### 3. Support Domains: Infrastructure, Services, Security (`support.prisma`)

```prisma
// DOMAIN 4: INFRASTRUCTURE
model Infrastructure {
  id              String   @id @default(cuid())
  name            String
  type            InfraType
  opdId           String
  opd             Opd      @relation(fields: [opdId], references: [id])
  
  applications    Application[]
  
  @@map("infrastructures")
}

// DOMAIN 5: SERVICE (Layanan SPBE)
model Service {
  id              String   @id @default(cuid())
  name            String
  description     String?
  type            ServiceType
  
  probisId        String?
  businessProcess BusinessProcess? @relation(fields: [probisId], references: [id])
  
  appId           String?
  application     Application? @relation(fields: [appId], references: [id])
  
  @@map("services")
}

// DOMAIN 6: SECURITY & RISK
model SecurityAudit {
  id              String   @id @default(cuid())
  appId           String
  application     Application @relation(fields: [appId], references: [id])
  
  auditDate       DateTime
  score           Float?
  status          AuditStatus
  findings        String?
  
  @@map("security_audits")
}

model RiskRegister {
  id              String   @id @default(cuid())
  opdId           String
  opd             Opd      @relation(fields: [opdId], references: [id])
  
  riskDescription String
  impactLevel     RiskLevel
  mitigationPlan  String?
  
  @@map("risk_registers")
}
```

### 4. Planning & Monitoring (`planning.prisma`)

```prisma
model SpbePlan {
  id              String   @id @default(cuid())
  year            Int
  initiativeName  String
  domain          String   // Layer (Layanan, Aplikasi, etc)
  budget          Decimal?
  status          PlanStatus @default(PLANNED)
  
  @@map("spbe_plans")
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  entity    String
  timestamp DateTime @default(now())
  
  @@map("audit_logs")
}
```

## 3. Enums
```prisma
enum UserRole {
  SUPER_ADMIN // Diskominfo
  OPERATOR    // OPD Staff
  AUDITOR     // Inspektorat
  LEADER      // Executive
}

enum AppType {
  UMUM      // Shared National/General
  KHUSUS    // Specific to OPD
}

enum PlatformType {
  WEB
  MOBILE
  DESKTOP
  API
}

enum AppStatus {
  PLANNING
  DEVELOPMENT
  ACTIVE
  ARCHIVED
}

enum DataClass {
  PUBLIC
  RESTRICTED
  SECRET
}

enum DataRelation {
  PRODUCER
  CONSUMER
}

enum InfraType {
  SERVER_PHYSICAL
  VIRTUAL_MACHINE
  CLOUD_SaaS
  CLOUD_IaaS
  NETWORK_DEVICE
}

enum ServiceType {
  G2C
  G2B
  G2G
  G2E
}

enum AuditStatus {
  PENDING
  PASSED
  FAILED_REMEDIATION_REQUIRED
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum PlanStatus {
  PLANNED
  BUDGETED
  ONGOING
  COMPLETED
  DELAYED
}
```

## 4. Key Design Decisions
### A. The 6 Domains Integration
Aligned with **Perpres 132/2022**, the schema ensures:
- **Process ↔ Service:** Services are linked to regulatory business processes.
- **Service ↔ App:** Digital tools are mapped to public services.
- **App ↔ Data:** Tracks data producers and consumers for *Satu Data* compliance.
- **App ↔ Infra:** Audits hardware/cloud assets supporting digital tools.

### B. Multi-Tenancy
The `Opd` table acts as the tenant. Every application, infrastructure, and user belongs to an OPD. Diskominfo (Super Admin) maintains a global view, while individual OPDs manage their respective assets.

## 5. Implementation Notes
1. **Shared Package:** Schema files are located in `packages/db/prisma/schema/`.
2. **Generation:** Run `bun db:generate` in the root or `packages/db`.
3. **Export:** The PrismaClient is exported from `@simapbe/db` for use in `apps/web` (Next.js) and `apps/server` (Elysia).
4. **Better Auth:** Configured to work with Better Auth's PostgreSQL adapter via the `users`, `sessions`, and `accounts` tables.
