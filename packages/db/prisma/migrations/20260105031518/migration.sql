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
CREATE TYPE "InfraType" AS ENUM ('SERVER_PHYSICAL', 'VIRTUAL_MACHINE', 'CLOUD_SAAS', 'CLOUD_IAAS', 'NETWORK_DEVICE');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('G2C', 'G2B', 'G2G', 'G2E');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED_REMEDIATION_REQUIRED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('PLANNED', 'BUDGETED', 'ONGOING', 'COMPLETED', 'DELAYED');

-- CreateTable
CREATE TABLE "application" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "opdId" TEXT NOT NULL,
    "type" "AppType" NOT NULL DEFAULT 'KHUSUS',
    "platform" "PlatformType" NOT NULL,
    "status" "AppStatus" NOT NULL DEFAULT 'ACTIVE',
    "programmingLang" TEXT,
    "databaseType" TEXT,
    "repositoryUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acronym" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opd_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "data_standard" (
    "id" TEXT NOT NULL,
    "dataName" TEXT NOT NULL,
    "description" TEXT,
    "format" TEXT NOT NULL,
    "validityPeriod" TEXT NOT NULL,
    "classification" "DataClass" NOT NULL DEFAULT 'PUBLIC',
    "producerOpdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_standard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_data" (
    "appId" TEXT NOT NULL,
    "dataId" TEXT NOT NULL,
    "relationType" "DataRelation" NOT NULL,

    CONSTRAINT "application_data_pkey" PRIMARY KEY ("appId","dataId")
);

-- CreateTable
CREATE TABLE "infrastructure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InfraType" NOT NULL,
    "location" TEXT,
    "vcpu" INTEGER,
    "ramGb" INTEGER,
    "storageGb" INTEGER,
    "opdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infrastructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spbe_plan" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "initiativeName" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "description" TEXT,
    "budget" DECIMAL(65,30),
    "status" "PlanStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spbe_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_audit" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "score" DOUBLE PRECISION,
    "status" "AuditStatus" NOT NULL,
    "findings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_register" (
    "id" TEXT NOT NULL,
    "opdId" TEXT NOT NULL,
    "riskDescription" TEXT NOT NULL,
    "impactLevel" "RiskLevel" NOT NULL,
    "likelihood" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "mitigationPlan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_register_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ServiceType" NOT NULL,
    "probisId" TEXT,
    "appId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ApplicationToInfrastructure" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ApplicationToInfrastructure_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "opd_code_key" ON "opd"("code");

-- CreateIndex
CREATE UNIQUE INDEX "business_process_kodeProbismet_key" ON "business_process"("kodeProbismet");

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
CREATE INDEX "_ApplicationToInfrastructure_B_index" ON "_ApplicationToInfrastructure"("B");

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_process" ADD CONSTRAINT "business_process_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "business_process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_standard" ADD CONSTRAINT "data_standard_producerOpdId_fkey" FOREIGN KEY ("producerOpdId") REFERENCES "opd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_data" ADD CONSTRAINT "application_data_appId_fkey" FOREIGN KEY ("appId") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_data" ADD CONSTRAINT "application_data_dataId_fkey" FOREIGN KEY ("dataId") REFERENCES "data_standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure" ADD CONSTRAINT "infrastructure_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_audit" ADD CONSTRAINT "security_audit_appId_fkey" FOREIGN KEY ("appId") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_register" ADD CONSTRAINT "risk_register_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_probisId_fkey" FOREIGN KEY ("probisId") REFERENCES "business_process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_appId_fkey" FOREIGN KEY ("appId") REFERENCES "application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicationToInfrastructure" ADD CONSTRAINT "_ApplicationToInfrastructure_A_fkey" FOREIGN KEY ("A") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicationToInfrastructure" ADD CONSTRAINT "_ApplicationToInfrastructure_B_fkey" FOREIGN KEY ("B") REFERENCES "infrastructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
