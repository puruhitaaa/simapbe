import prisma, { AuditStatus, RiskLevel } from "@simapbe/db";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

// Zod schemas for Security
const securityAuditCreateSchema = z.object({
  appId: z.string(),
  auditDate: z.string().transform((s) => new Date(s)),
  score: z.number().min(0).max(100).optional(),
  status: z.enum(AuditStatus),
  findings: z.string().optional(),
});

const riskRegisterCreateSchema = z.object({
  opdId: z.string(),
  riskDescription: z.string().min(1),
  impactLevel: z.enum(RiskLevel),
  likelihood: z.enum(RiskLevel).default(RiskLevel.MEDIUM),
  mitigationPlan: z.string().optional(),
});

const riskUpdateSchema = riskRegisterCreateSchema.partial().extend({
  id: z.string(),
});

export const securityRouter = router({
  // ===== SECURITY AUDITS =====

  // Get all audits
  listAudits: publicProcedure.query(async () => {
    return await prisma.securityAudit.findMany({
      orderBy: { auditDate: "desc" },
      include: { application: { include: { opd: true } } },
    });
  }),

  // Get audits by app
  auditsByApp: publicProcedure
    .input(z.object({ appId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.securityAudit.findMany({
        where: { appId: input.appId },
        orderBy: { auditDate: "desc" },
      });
    }),

  // Get pending audits (for pre-launch checks)
  pendingAudits: publicProcedure.query(async () => {
    return await prisma.securityAudit.findMany({
      where: { status: AuditStatus.PENDING },
      include: { application: true },
    });
  }),

  // Create security audit
  createAudit: protectedProcedure
    .input(securityAuditCreateSchema)
    .mutation(async ({ input }) => {
      return await prisma.securityAudit.create({
        data: input,
      });
    }),

  // Update audit status
  updateAuditStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(AuditStatus),
        findings: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await prisma.securityAudit.update({
        where: { id },
        data,
      });
    }),

  // ===== RISK REGISTER =====

  // Get all risks
  listRisks: publicProcedure.query(async () => {
    return await prisma.riskRegister.findMany({
      orderBy: [{ impactLevel: "desc" }, { likelihood: "desc" }],
      include: { opd: true },
    });
  }),

  // Get risks by OPD
  risksByOpd: publicProcedure
    .input(z.object({ opdId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.riskRegister.findMany({
        where: { opdId: input.opdId },
        orderBy: { impactLevel: "desc" },
      });
    }),

  // Get risk heatmap data (5x5 matrix)
  riskHeatmap: publicProcedure.query(async () => {
    const risks = await prisma.riskRegister.findMany({
      select: { impactLevel: true, likelihood: true },
    });

    const levels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
    const heatmap: Record<string, Record<string, number>> = {};

    for (const impact of levels) {
      heatmap[impact] = {};
      for (const likelihood of levels) {
        heatmap[impact][likelihood] = risks.filter(
          (r) => r.impactLevel === impact && r.likelihood === likelihood
        ).length;
      }
    }

    return heatmap;
  }),

  // Create risk
  createRisk: protectedProcedure
    .input(riskRegisterCreateSchema)
    .mutation(async ({ input }) => {
      return await prisma.riskRegister.create({
        data: input,
      });
    }),

  // Update risk
  updateRisk: protectedProcedure
    .input(riskUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await prisma.riskRegister.update({
        where: { id },
        data,
      });
    }),

  // Delete risk
  deleteRisk: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.riskRegister.delete({
        where: { id: input.id },
      });
    }),
});
