-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'OPERATOR', 'AUDITOR', 'LEADER');

-- CreateEnum
CREATE TYPE "AppType" AS ENUM ('UMUM', 'KHUSUS');

-- CreateEnum
CREATE TYPE "PlatformType" AS ENUM ('WEB', 'MOBILE', 'DESKTOP', 'API');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('PLANNING', 'DEVELOPMENT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DataClass" AS ENUM ('PUBLIC', 'RESTRICTED', 'SECRET');

-- CreateEnum
CREATE TYPE "DataRelation" AS ENUM ('PRODUCER', 'CONSUMER');

-- CreateEnum
CREATE TYPE "InfraType" AS ENUM ('SERVER_PHYSICAL', 'VIRTUAL_MACHINE', 'CLOUD_SaaS', 'CLOUD_IaaS', 'NETWORK_DEVICE');

-- CreateEnum
CREATE TYPE "InfraLocation" AS ENUM ('PDN', 'LOCAL');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('G2C', 'G2B', 'G2G', 'G2E');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED_REMEDIATION_REQUIRED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('PLANNED', 'BUDGETED', 'ONGOING', 'COMPLETED', 'DELAYED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "opdId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_process" (
    "id" TEXT NOT NULL,
    "kodeProbismet" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_standard" (
    "id" TEXT NOT NULL,
    "dataName" TEXT NOT NULL,
    "dataCode" TEXT NOT NULL,
    "description" TEXT,
    "format" TEXT NOT NULL,
    "validityPeriod" TEXT NOT NULL,
    "updateFrequency" TEXT,
    "classification" "DataClass" NOT NULL DEFAULT 'PUBLIC',
    "producerOpdId" TEXT,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validatedAt" TIMESTAMP(3),
    "validatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_standard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "AppType" NOT NULL DEFAULT 'KHUSUS',
    "platform" "PlatformType" NOT NULL DEFAULT 'WEB',
    "status" "AppStatus" NOT NULL DEFAULT 'PLANNING',
    "description" TEXT,
    "programmingLang" TEXT,
    "framework" TEXT,
    "databaseType" TEXT,
    "repositoryUrl" TEXT,
    "opdId" TEXT NOT NULL,
    "developmentStartDate" TIMESTAMP(3),
    "productionDate" TIMESTAMP(3),
    "lastAuditDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_data" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "dataId" TEXT NOT NULL,
    "relationType" "DataRelation" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infrastructure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "InfraType" NOT NULL DEFAULT 'VIRTUAL_MACHINE',
    "location" "InfraLocation" NOT NULL DEFAULT 'LOCAL',
    "description" TEXT,
    "ipAddress" TEXT,
    "specs" TEXT,
    "cpuCores" INTEGER,
    "ramGB" INTEGER,
    "storageGB" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "opdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infrastructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_infrastructure" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "infraId" TEXT NOT NULL,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_infrastructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "ServiceType" NOT NULL DEFAULT 'G2C',
    "url" TEXT,
    "probisId" TEXT,
    "appId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_audit" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "auditor" TEXT,
    "score" DOUBLE PRECISION,
    "status" "AuditStatus" NOT NULL DEFAULT 'PENDING',
    "findings" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_register" (
    "id" TEXT NOT NULL,
    "opdId" TEXT NOT NULL,
    "riskCode" TEXT NOT NULL,
    "riskDescription" TEXT NOT NULL,
    "riskCategory" TEXT,
    "impactLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "likelihoodLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "riskScore" INTEGER,
    "mitigationPlan" TEXT,
    "mitigationStatus" TEXT,
    "responsiblePerson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_register_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acronym" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spbe_plan" (
    "id" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER,
    "initiativeName" TEXT NOT NULL,
    "description" TEXT,
    "domain" TEXT NOT NULL,
    "budget" DECIMAL(15,2),
    "budgetCode" TEXT,
    "fundingSource" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "isGap" BOOLEAN NOT NULL DEFAULT false,
    "gapDescription" TEXT,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "targetEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spbe_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "todo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_opdId_idx" ON "user"("opdId");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "business_process_kodeProbismet_key" ON "business_process"("kodeProbismet");

-- CreateIndex
CREATE INDEX "business_process_kodeProbismet_idx" ON "business_process"("kodeProbismet");

-- CreateIndex
CREATE INDEX "business_process_parentId_idx" ON "business_process"("parentId");

-- CreateIndex
CREATE INDEX "business_process_level_idx" ON "business_process"("level");

-- CreateIndex
CREATE UNIQUE INDEX "data_standard_dataCode_key" ON "data_standard"("dataCode");

-- CreateIndex
CREATE INDEX "data_standard_dataCode_idx" ON "data_standard"("dataCode");

-- CreateIndex
CREATE INDEX "data_standard_producerOpdId_idx" ON "data_standard"("producerOpdId");

-- CreateIndex
CREATE INDEX "data_standard_classification_idx" ON "data_standard"("classification");

-- CreateIndex
CREATE UNIQUE INDEX "application_code_key" ON "application"("code");

-- CreateIndex
CREATE INDEX "application_code_idx" ON "application"("code");

-- CreateIndex
CREATE INDEX "application_opdId_idx" ON "application"("opdId");

-- CreateIndex
CREATE INDEX "application_type_idx" ON "application"("type");

-- CreateIndex
CREATE INDEX "application_status_idx" ON "application"("status");

-- CreateIndex
CREATE INDEX "application_data_appId_idx" ON "application_data"("appId");

-- CreateIndex
CREATE INDEX "application_data_dataId_idx" ON "application_data"("dataId");

-- CreateIndex
CREATE UNIQUE INDEX "application_data_appId_dataId_key" ON "application_data"("appId", "dataId");

-- CreateIndex
CREATE UNIQUE INDEX "infrastructure_code_key" ON "infrastructure"("code");

-- CreateIndex
CREATE INDEX "infrastructure_code_idx" ON "infrastructure"("code");

-- CreateIndex
CREATE INDEX "infrastructure_opdId_idx" ON "infrastructure"("opdId");

-- CreateIndex
CREATE INDEX "infrastructure_location_idx" ON "infrastructure"("location");

-- CreateIndex
CREATE INDEX "infrastructure_type_idx" ON "infrastructure"("type");

-- CreateIndex
CREATE INDEX "application_infrastructure_appId_idx" ON "application_infrastructure"("appId");

-- CreateIndex
CREATE INDEX "application_infrastructure_infraId_idx" ON "application_infrastructure"("infraId");

-- CreateIndex
CREATE UNIQUE INDEX "application_infrastructure_appId_infraId_key" ON "application_infrastructure"("appId", "infraId");

-- CreateIndex
CREATE UNIQUE INDEX "service_code_key" ON "service"("code");

-- CreateIndex
CREATE INDEX "service_code_idx" ON "service"("code");

-- CreateIndex
CREATE INDEX "service_type_idx" ON "service"("type");

-- CreateIndex
CREATE INDEX "service_probisId_idx" ON "service"("probisId");

-- CreateIndex
CREATE INDEX "service_appId_idx" ON "service"("appId");

-- CreateIndex
CREATE INDEX "security_audit_appId_idx" ON "security_audit"("appId");

-- CreateIndex
CREATE INDEX "security_audit_auditDate_idx" ON "security_audit"("auditDate");

-- CreateIndex
CREATE INDEX "security_audit_status_idx" ON "security_audit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "risk_register_riskCode_key" ON "risk_register"("riskCode");

-- CreateIndex
CREATE INDEX "risk_register_opdId_idx" ON "risk_register"("opdId");

-- CreateIndex
CREATE INDEX "risk_register_riskCode_idx" ON "risk_register"("riskCode");

-- CreateIndex
CREATE INDEX "risk_register_impactLevel_idx" ON "risk_register"("impactLevel");

-- CreateIndex
CREATE INDEX "audit_log_userId_idx" ON "audit_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_entity_idx" ON "audit_log"("entity");

-- CreateIndex
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "opd_code_key" ON "opd"("code");

-- CreateIndex
CREATE INDEX "opd_code_idx" ON "opd"("code");

-- CreateIndex
CREATE UNIQUE INDEX "spbe_plan_planCode_key" ON "spbe_plan"("planCode");

-- CreateIndex
CREATE INDEX "spbe_plan_planCode_idx" ON "spbe_plan"("planCode");

-- CreateIndex
CREATE INDEX "spbe_plan_year_idx" ON "spbe_plan"("year");

-- CreateIndex
CREATE INDEX "spbe_plan_domain_idx" ON "spbe_plan"("domain");

-- CreateIndex
CREATE INDEX "spbe_plan_status_idx" ON "spbe_plan"("status");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_process" ADD CONSTRAINT "business_process_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "business_process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_standard" ADD CONSTRAINT "data_standard_producerOpdId_fkey" FOREIGN KEY ("producerOpdId") REFERENCES "opd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_data" ADD CONSTRAINT "application_data_appId_fkey" FOREIGN KEY ("appId") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_data" ADD CONSTRAINT "application_data_dataId_fkey" FOREIGN KEY ("dataId") REFERENCES "data_standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure" ADD CONSTRAINT "infrastructure_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_infrastructure" ADD CONSTRAINT "application_infrastructure_appId_fkey" FOREIGN KEY ("appId") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_infrastructure" ADD CONSTRAINT "application_infrastructure_infraId_fkey" FOREIGN KEY ("infraId") REFERENCES "infrastructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_probisId_fkey" FOREIGN KEY ("probisId") REFERENCES "business_process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_appId_fkey" FOREIGN KEY ("appId") REFERENCES "application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_audit" ADD CONSTRAINT "security_audit_appId_fkey" FOREIGN KEY ("appId") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_register" ADD CONSTRAINT "risk_register_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opd"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
