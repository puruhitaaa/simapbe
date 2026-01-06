/**
 * Security Router (Domain 6: Keamanan SPBE)
 * Ref: Source 17, 30, 54, 59, 83, 158 - Domain Keamanan & Audit TIK
 *
 * Key features:
 * - Risk Management (Manajemen Risiko)
 * - Security Audit tracking
 * - Audit Logs for compliance
 *
 * Access:
 * - SUPER_ADMIN: Full CRUD
 * - OPERATOR: CRUD risks for own OPD, read audits
 * - AUDITOR: Read all + create audit logs
 * - LEADER: Read only
 */

import prisma from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminProcedure,
  auditorProcedure,
  operatorProcedure,
  protectedProcedure,
  router,
} from "../index";
import { ExcelService } from "../services/excel-service";

// ============================================
// Input Schemas (Matching Prisma Schema)
// ============================================

const riskLevelEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const auditStatusEnum = z.enum([
  "PENDING",
  "PASSED",
  "FAILED_REMEDIATION_REQUIRED",
]);

const createRiskSchema = z.object({
  opdId: z.cuid(),
  riskCode: z
    .string()
    .min(3)
    .regex(/^RISK-[A-Z0-9-]+$/, "Code must follow format: RISK-XXXX"),
  riskDescription: z.string().min(10, "Risk description must be detailed"),
  riskCategory: z.string().optional(),
  impactLevel: riskLevelEnum.default("LOW"),
  likelihoodLevel: riskLevelEnum.default("LOW"),
  mitigationPlan: z.string().optional(),
  mitigationStatus: z.string().optional(),
  responsiblePerson: z.string().optional(),
});

const updateRiskSchema = z.object({
  id: z.cuid(),
  riskDescription: z.string().min(10).optional(),
  riskCategory: z.string().optional(),
  impactLevel: riskLevelEnum.optional(),
  likelihoodLevel: riskLevelEnum.optional(),
  mitigationPlan: z.string().optional(),
  mitigationStatus: z.string().optional(),
  responsiblePerson: z.string().optional(),
});

const createAuditSchema = z.object({
  appId: z.cuid(),
  auditDate: z.coerce.date(),
  auditor: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  status: auditStatusEnum.default("PENDING"),
});

const updateAuditSchema = z.object({
  id: z.cuid(),
  auditor: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  status: auditStatusEnum.optional(),
});

// ============================================
// Helper: Calculate Risk Score
// ============================================

function calculateRiskScore(
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  likelihood: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
): { score: number; category: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" } {
  const levels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 5 };
  const score = levels[impact] * levels[likelihood];

  // Risk matrix scoring (max 25)
  if (score <= 2) return { score, category: "LOW" };
  if (score <= 6) return { score, category: "MEDIUM" };
  if (score <= 15) return { score, category: "HIGH" };
  return { score, category: "CRITICAL" };
}

// ============================================
// Security Router
// ============================================

export const securityRouter = router({
  // ============================================
  // RISK MANAGEMENT
  // ============================================

  /**
   * List risks with filtering
   */
  listRisks: protectedProcedure
    .input(
      z
        .object({
          opdId: z.cuid().optional(),
          impactLevel: riskLevelEnum.optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const { opdId, impactLevel, limit = 50, cursor } = input ?? {};

      // Operators see their own OPD by default
      let filterOpdId = opdId;
      if (ctx.user.role === "OPERATOR" && !opdId) {
        filterOpdId = ctx.user.opdId || undefined;
      }

      const items = await prisma.riskRegister.findMany({
        where: {
          ...(filterOpdId && { opdId: filterOpdId }),
          ...(impactLevel && { impactLevel }),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ impactLevel: "desc" }, { createdAt: "desc" }],
        include: {
          opd: {
            select: { id: true, code: true, name: true, acronym: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      // Add calculated risk scores
      const enrichedItems = items.map((risk) => ({
        ...risk,
        calculatedScore: calculateRiskScore(
          risk.impactLevel,
          risk.likelihoodLevel
        ),
      }));

      return {
        items: enrichedItems,
        nextCursor,
      };
    }),

  /**
   * Get risk by ID
   */
  getRiskById: protectedProcedure
    .input(z.object({ id: z.cuid() }))
    .query(async ({ input }) => {
      const risk = await prisma.riskRegister.findUnique({
        where: { id: input.id },
        include: {
          opd: true,
        },
      });

      if (!risk) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Risk not found",
        });
      }

      return {
        ...risk,
        calculatedScore: calculateRiskScore(
          risk.impactLevel,
          risk.likelihoodLevel
        ),
      };
    }),

  /**
   * Create new risk entry
   */
  createRisk: operatorProcedure
    .input(createRiskSchema)
    .mutation(async ({ input, ctx }) => {
      // Operators can only create risks for their own OPD
      if (ctx.user.role === "OPERATOR" && input.opdId !== ctx.user.opdId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only create risks for your own OPD",
        });
      }

      // Check code uniqueness
      const existingCode = await prisma.riskRegister.findUnique({
        where: { riskCode: input.riskCode },
      });

      if (existingCode) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Risk with code "${input.riskCode}" already exists`,
        });
      }

      // Validate OPD exists
      const opd = await prisma.opd.findUnique({
        where: { id: input.opdId },
      });

      if (!opd) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "OPD not found",
        });
      }

      // Calculate risk score
      const scoreCalc = calculateRiskScore(
        input.impactLevel,
        input.likelihoodLevel
      );

      const risk = await prisma.riskRegister.create({
        data: {
          ...input,
          riskScore: scoreCalc.score,
        },
        include: {
          opd: true,
        },
      });

      return {
        ...risk,
        calculatedScore: scoreCalc,
      };
    }),

  /**
   * Update risk
   */
  updateRisk: operatorProcedure
    .input(updateRiskSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await prisma.riskRegister.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Risk not found",
        });
      }

      // Operators can only update their own OPD's risks
      if (ctx.user.role === "OPERATOR" && existing.opdId !== ctx.user.opdId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update risks from your own OPD",
        });
      }

      // Recalculate risk score if impact or likelihood changed
      const newImpact = data.impactLevel || existing.impactLevel;
      const newLikelihood = data.likelihoodLevel || existing.likelihoodLevel;
      const scoreCalc = calculateRiskScore(newImpact, newLikelihood);

      const risk = await prisma.riskRegister.update({
        where: { id },
        data: {
          ...data,
          riskScore: scoreCalc.score,
        },
        include: {
          opd: true,
        },
      });

      return {
        ...risk,
        calculatedScore: scoreCalc,
      };
    }),

  /**
   * Delete risk
   */
  deleteRisk: adminProcedure
    .input(z.object({ id: z.cuid() }))
    .mutation(async ({ input }) => {
      const existing = await prisma.riskRegister.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Risk not found",
        });
      }

      await prisma.riskRegister.delete({
        where: { id: input.id },
      });

      return { success: true, deletedId: input.id };
    }),

  /**
   * Get risk heatmap data
   * Used for 4x4 Impact vs Likelihood matrix
   */
  getRiskHeatmap: protectedProcedure.query(async () => {
    const risks = await prisma.riskRegister.findMany({
      select: {
        id: true,
        impactLevel: true,
        likelihoodLevel: true,
      },
    });

    // Build heatmap matrix
    type Level = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    const levels: Level[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const matrix: Record<string, number> = {};

    for (const impact of levels) {
      for (const likelihood of levels) {
        matrix[`${impact}-${likelihood}`] = 0;
      }
    }

    for (const risk of risks) {
      const key = `${risk.impactLevel}-${risk.likelihoodLevel}`;
      if (matrix[key] !== undefined) {
        matrix[key]++;
      }
    }

    return {
      matrix,
      total: risks.length,
      byImpact: levels.map((level) => ({
        level,
        count: risks.filter((r) => r.impactLevel === level).length,
      })),
      byLikelihood: levels.map((level) => ({
        level,
        count: risks.filter((r) => r.likelihoodLevel === level).length,
      })),
    };
  }),

  // ============================================
  // SECURITY AUDITS
  // ============================================

  /**
   * List security audits
   */
  listAudits: protectedProcedure
    .input(
      z
        .object({
          appId: z.cuid().optional(),
          status: auditStatusEnum.optional(),
          fromDate: z.coerce.date().optional(),
          toDate: z.coerce.date().optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const {
        appId,
        status,
        fromDate,
        toDate,
        limit = 50,
        cursor,
      } = input ?? {};

      const items = await prisma.securityAudit.findMany({
        where: {
          ...(appId && { appId }),
          ...(status && { status }),
          ...(fromDate && { auditDate: { gte: fromDate } }),
          ...(toDate && { auditDate: { lte: toDate } }),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { auditDate: "desc" },
        include: {
          app: {
            select: {
              id: true,
              code: true,
              name: true,
              opd: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  /**
   * Get audit by ID
   */
  getAuditById: protectedProcedure
    .input(z.object({ id: z.cuid() }))
    .query(async ({ input }) => {
      const audit = await prisma.securityAudit.findUnique({
        where: { id: input.id },
        include: {
          app: {
            include: { opd: true },
          },
        },
      });

      if (!audit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Security audit not found",
        });
      }

      return audit;
    }),

  /**
   * Create security audit
   * Access: SUPER_ADMIN, AUDITOR
   */
  createAudit: auditorProcedure
    .input(createAuditSchema)
    .mutation(async ({ input }) => {
      // Validate application exists
      const app = await prisma.application.findUnique({
        where: { id: input.appId },
      });

      if (!app) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Application not found",
        });
      }

      const audit = await prisma.securityAudit.create({
        data: input,
        include: {
          app: {
            include: { opd: true },
          },
        },
      });

      return audit;
    }),

  /**
   * Update security audit
   */
  updateAudit: auditorProcedure
    .input(updateAuditSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const existing = await prisma.securityAudit.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Security audit not found",
        });
      }

      const audit = await prisma.securityAudit.update({
        where: { id },
        data,
        include: {
          app: {
            include: { opd: true },
          },
        },
      });

      return audit;
    }),

  /**
   * Delete security audit
   */
  deleteAudit: adminProcedure
    .input(z.object({ id: z.cuid() }))
    .mutation(async ({ input }) => {
      const existing = await prisma.securityAudit.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Security audit not found",
        });
      }

      await prisma.securityAudit.delete({
        where: { id: input.id },
      });

      return { success: true, deletedId: input.id };
    }),

  /**
   * Get apps requiring security audit
   * (Apps that have never been audited or last audit > 1 year)
   */
  getAppsRequiringAudit: protectedProcedure.query(async () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Get apps with their latest audit
    const apps = await prisma.application.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        opd: {
          select: { id: true, code: true, name: true },
        },
        securityAudits: {
          orderBy: { auditDate: "desc" },
          take: 1,
        },
      },
    });

    const needsAudit = apps.filter((app) => {
      const lastAudit = app.securityAudits[0];
      if (!lastAudit) return true; // Never audited
      return lastAudit.auditDate < oneYearAgo; // Audit older than 1 year
    });

    return needsAudit.map((app) => ({
      id: app.id,
      code: app.code,
      name: app.name,
      opd: app.opd,
      lastAuditDate: app.securityAudits[0]?.auditDate || null,
      daysSinceAudit: app.securityAudits[0]
        ? Math.floor(
            (Date.now() - app.securityAudits[0].auditDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
    }));
  }),

  // ============================================
  // AUDIT LOGS (System Activity)
  // Ref: Source 30 - Audit TIK Requirements
  // ============================================

  /**
   * Query audit logs
   * Access: SUPER_ADMIN, AUDITOR
   */
  queryAuditLogs: auditorProcedure
    .input(
      z
        .object({
          userId: z.cuid().optional(),
          entity: z.string().optional(),
          action: z.string().optional(),
          fromDate: z.coerce.date().optional(),
          toDate: z.coerce.date().optional(),
          limit: z.number().min(1).max(500).default(100),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const {
        userId,
        entity,
        action,
        fromDate,
        toDate,
        limit = 100,
        cursor,
      } = input ?? {};

      const items = await prisma.auditLog.findMany({
        where: {
          ...(userId && { userId }),
          ...(entity && { entity: { contains: entity, mode: "insensitive" } }),
          ...(action && { action: { contains: action, mode: "insensitive" } }),
          ...(fromDate && { timestamp: { gte: fromDate } }),
          ...(toDate && { timestamp: { lte: toDate } }),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { timestamp: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  /**
   * Get audit log statistics
   */
  getAuditLogStats: auditorProcedure.query(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date();
    thisMonth.setDate(1);

    const [total, todayCount, weekCount, monthCount] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { timestamp: { gte: today } } }),
      prisma.auditLog.count({ where: { timestamp: { gte: thisWeek } } }),
      prisma.auditLog.count({ where: { timestamp: { gte: thisMonth } } }),
    ]);

    const byAction = await prisma.auditLog.groupBy({
      by: ["action"],
      _count: { _all: true },
      orderBy: { _count: { action: "desc" } },
      take: 10,
    });

    const byEntity = await prisma.auditLog.groupBy({
      by: ["entity"],
      _count: { _all: true },
      orderBy: { _count: { entity: "desc" } },
      take: 10,
    });

    return {
      total,
      todayCount,
      weekCount,
      monthCount,
      topActions: byAction.map((a) => ({
        action: a.action,
        count: a._count._all,
      })),
      topEntities: byEntity.map((e) => ({
        entity: e.entity,
        count: e._count._all,
      })),
    };
  }),

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get security overview statistics
   */
  getStats: protectedProcedure.query(async () => {
    const [
      totalRisks,
      criticalRisks,
      highRisks,
      totalAudits,
      passedAudits,
      failedAudits,
    ] = await Promise.all([
      prisma.riskRegister.count(),
      prisma.riskRegister.count({ where: { impactLevel: "CRITICAL" } }),
      prisma.riskRegister.count({ where: { impactLevel: "HIGH" } }),
      prisma.securityAudit.count(),
      prisma.securityAudit.count({ where: { status: "PASSED" } }),
      prisma.securityAudit.count({
        where: { status: "FAILED_REMEDIATION_REQUIRED" },
      }),
    ]);

    return {
      risks: {
        total: totalRisks,
        critical: criticalRisks,
        high: highRisks,
      },
      audits: {
        total: totalAudits,
        passed: passedAudits,
        failed: failedAudits,
        pending: totalAudits - passedAudits - failedAudits,
        passRate:
          totalAudits > 0 ? Math.round((passedAudits / totalAudits) * 100) : 0,
      },
    };
  }),

  /**
   * Download Excel Template
   */
  downloadTemplate: protectedProcedure
    .input(
      z.object({
        type: z.enum(["RISK", "AUDIT"]),
        columns: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ input }) => {
      let columnDefinitions: any[] = [];

      if (input.type === "RISK") {
        columnDefinitions = [
          {
            key: "riskCode",
            header: "Code (Unique)",
            width: 25,
            note: "Required. Format: RISK-XXXX",
          },
          { key: "opdCode", header: "OPD Code", width: 20, note: "Required." },
          {
            key: "riskDescription",
            header: "Description",
            width: 40,
            note: "Required.",
          },
          { key: "riskCategory", header: "Category", width: 20 },
          {
            key: "impactLevel",
            header: "Impact",
            width: 15,
            validation: {
              type: "list",
              formulae: ['"LOW,MEDIUM,HIGH,CRITICAL"'],
            },
          },
          {
            key: "likelihoodLevel",
            header: "Likelihood",
            width: 15,
            validation: {
              type: "list",
              formulae: ['"LOW,MEDIUM,HIGH,CRITICAL"'],
            },
          },
          { key: "mitigationPlan", header: "Mitigation", width: 40 },
          { key: "responsiblePerson", header: "Person In Charge", width: 20 },
        ];
      } else {
        columnDefinitions = [
          {
            key: "appCode",
            header: "App Code",
            width: 25,
            note: "Required. Must match existing App.",
          },
          {
            key: "auditDate",
            header: "Date (YYYY-MM-DD)",
            width: 20,
            note: "Required.",
          },
          { key: "auditor", header: "Auditor", width: 20 },
          { key: "findings", header: "Findings", width: 40 },
          { key: "recommendations", header: "Recommendations", width: 40 },
          { key: "score", header: "Score", width: 10, note: "0-100" },
          {
            key: "status",
            header: "Status",
            width: 20,
            validation: {
              type: "list",
              formulae: ['"PENDING,PASSED,FAILED_REMEDIATION_REQUIRED"'],
            },
          },
        ];
      }

      const selectedColumns = columnDefinitions.filter((col) =>
        input.columns.includes(col.key)
      );

      const buffer = await ExcelService.generateTemplate(selectedColumns);
      return buffer.toString("base64");
    }),

  /**
   * Export Data
   */
  export: protectedProcedure
    .input(
      z.object({
        type: z.enum(["RISK", "AUDIT"]),
        search: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { type, search } = input;
      let data: any[] = [];
      let columns: any[] = [];

      if (type === "RISK") {
        const risks = await prisma.riskRegister.findMany({
          where: {
            ...(search && {
              riskCode: { contains: search, mode: "insensitive" },
            }),
          },
          include: { opd: { select: { code: true } } },
          orderBy: { riskCode: "asc" },
        });

        columns = [
          { key: "riskCode", header: "Code", width: 25 },
          { key: "opdCode", header: "OPD", width: 20 },
          { key: "riskDescription", header: "Description", width: 40 },
          { key: "riskCategory", header: "Category", width: 20 },
          { key: "impactLevel", header: "Impact", width: 15 },
          { key: "likelihoodLevel", header: "Likelihood", width: 15 },
          { key: "mitigationPlan", header: "Mitigation", width: 40 },
        ];

        data = risks.map((r) => ({
          ...r,
          opdCode: r.opd.code,
        }));
      } else {
        const audits = await prisma.securityAudit.findMany({
          where: {
            ...(search && {
              auditor: { contains: search, mode: "insensitive" },
            }),
          },
          include: { app: { select: { code: true } } },
          orderBy: { auditDate: "desc" },
        });

        columns = [
          { key: "appCode", header: "App", width: 25 },
          { key: "auditDate", header: "Date", width: 20 },
          { key: "auditor", header: "Auditor", width: 20 },
          { key: "findings", header: "Findings", width: 40 },
          { key: "score", header: "Score", width: 10 },
          { key: "status", header: "Status", width: 20 },
        ];

        data = audits.map((a) => ({
          ...a,
          appCode: a.app.code,
          auditDate: a.auditDate.toISOString().split("T")[0],
        }));
      }

      const buffer = await ExcelService.exportData(
        data,
        columns,
        `${type} Data`
      );
      return buffer.toString("base64");
    }),

  /**
   * Import Data
   */
  import: protectedProcedure
    .input(
      z.object({ fileBase64: z.string(), type: z.enum(["RISK", "AUDIT"]) })
    )
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");

      if (input.type === "RISK") {
        if (ctx.user.role !== "SUPER_ADMIN" && ctx.user.role !== "OPERATOR") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only Admin/Operator can import risks",
          });
        }

        const rowSchema = z.object({
          "Code (Unique)": z.string().regex(/^RISK-[A-Z0-9-]+$/),
          "OPD Code": z.string(),
          Description: z.string().min(10),
          Category: z.string().optional(),
          Impact: riskLevelEnum.default("LOW"),
          Likelihood: riskLevelEnum.default("LOW"),
          Mitigation: z.string().optional(),
          "Person In Charge": z.string().optional(),
        });

        const columnMapping = {
          "Code (Unique)": "Code (Unique)",
          "OPD Code": "OPD Code",
          Description: "Description",
          Category: "Category",
          Impact: "Impact",
          Likelihood: "Likelihood",
          Mitigation: "Mitigation",
          "Person In Charge": "Person In Charge",
        };

        const { success: rows, errors } = await ExcelService.parseExcel(
          buffer,
          rowSchema,
          columnMapping
        );
        if (errors.length > 0)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Validation failed",
            cause: errors,
          });

        return await prisma.$transaction(async (tx) => {
          let inserted = 0;
          let updated = 0;
          for (const row of rows) {
            const code = row["Code (Unique)"];
            const opdCode = row["OPD Code"];
            const opd = await tx.opd.findUnique({ where: { code: opdCode } });
            if (!opd) throw new Error(`OPD '${opdCode}' not found`);

            // Permission check
            if (ctx.user.role === "OPERATOR" && opd.id !== ctx.user.opdId) {
              throw new Error(`Cannot import risk for OPD '${opdCode}'`);
            }

            const impact = row["Impact"] as any;
            const likelihood = row["Likelihood"] as any;
            const scoreCalc = calculateRiskScore(impact, likelihood);

            const data = {
              riskCode: code,
              opdId: opd.id,
              riskDescription: row["Description"],
              riskCategory: row["Category"],
              impactLevel: impact,
              likelihoodLevel: likelihood,
              mitigationPlan: row["Mitigation"],
              responsiblePerson: row["Person In Charge"],
              riskScore: scoreCalc.score,
            };

            const existing = await tx.riskRegister.findUnique({
              where: { riskCode: code },
            });
            if (existing) {
              await tx.riskRegister.update({
                where: { id: existing.id },
                data,
              });
              updated++;
            } else {
              await tx.riskRegister.create({ data });
              inserted++;
            }
          }
          return { insertedCount: inserted, updatedCount: updated };
        });
      }
      // AUDIT IMPORT
      if (ctx.user.role !== "SUPER_ADMIN" && ctx.user.role !== "AUDITOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admin/Auditor can import audits",
        });
      }

      const rowSchema = z.object({
        "App Code": z.string(),
        "Date (YYYY-MM-DD)": z.coerce.date(),
        Auditor: z.string().optional(),
        Findings: z.string().optional(),
        Recommendations: z.string().optional(),
        Score: z.coerce.number().min(0).max(100).optional(),
        Status: auditStatusEnum.default("PENDING"),
      });

      const columnMapping = {
        "App Code": "App Code",
        "Date (YYYY-MM-DD)": "Date (YYYY-MM-DD)",
        Auditor: "Auditor",
        Findings: "Findings",
        Recommendations: "Recommendations",
        Score: "Score",
        Status: "Status",
      };

      const { success: rows, errors } = await ExcelService.parseExcel(
        buffer,
        rowSchema,
        columnMapping
      );
      if (errors.length > 0)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Validation failed",
          cause: errors,
        });

      return await prisma.$transaction(async (tx) => {
        let inserted = 0;
        for (const row of rows) {
          const appCode = row["App Code"];
          const app = await tx.application.findUnique({
            where: { code: appCode },
          });
          if (!app) throw new Error(`App '${appCode}' not found`);

          const data = {
            appId: app.id,
            auditDate: row["Date (YYYY-MM-DD)"],
            auditor: row["Auditor"],
            findings: row["Findings"],
            recommendations: row["Recommendations"],
            score: row["Score"],
            status: row["Status"] as any,
          };

          // Audits are usually appended, not updated by code (no unique code for audit)
          // Unless we define a composite key or logic. For now, always insert new.
          await tx.securityAudit.create({ data });
          inserted++;
        }
        return { insertedCount: inserted, updatedCount: 0 };
      });
    }),
});
