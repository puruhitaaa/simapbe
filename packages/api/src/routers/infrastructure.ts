/**
 * Infrastructure Router (Domain 4: Arsitektur Infrastruktur)
 * Ref: Source 76, 134 - Asset management for servers, cloud, network
 *
 * Key features:
 * - PDN vs LOCAL location tracking
 * - Capacity aggregation for budget planning
 * - App-to-infra mapping
 *
 * Access:
 * - SUPER_ADMIN: Full CRUD
 * - OPERATOR: CRUD for own OPD
 * - AUDITOR: Read only
 * - LEADER: Read only
 */

import prisma from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminProcedure,
  operatorProcedure,
  protectedProcedure,
  router,
} from "../index";
import { ExcelService } from "../services/excel-service";

// ============================================
// Input Schemas (Matching Prisma Enums)
// ============================================

const infraTypeEnum = z.enum([
  "SERVER_PHYSICAL",
  "VIRTUAL_MACHINE",
  "CLOUD_SaaS",
  "CLOUD_IaaS",
  "NETWORK_DEVICE",
]);

const locationEnum = z.enum(["PDN", "LOCAL"]);

const createInfraSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(30)
    .regex(/^INFRA-[A-Z0-9-]+$/, "Code must follow format: INFRA-XXXX"),
  name: z.string().min(3),
  description: z.string().optional(),
  type: infraTypeEnum.default("VIRTUAL_MACHINE"),
  location: locationEnum.default("LOCAL"),
  specs: z.string().optional(),
  cpuCores: z.number().int().min(0).optional(),
  ramGB: z.number().int().min(0).optional(),
  storageGB: z.number().int().min(0).optional(),
  ipAddress: z.string().optional(),
  opdId: z.cuid(),
});

const updateInfraSchema = z.object({
  id: z.cuid(),
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  type: infraTypeEnum.optional(),
  location: locationEnum.optional(),
  specs: z.string().optional(),
  cpuCores: z.number().int().min(0).optional(),
  ramGB: z.number().int().min(0).optional(),
  storageGB: z.number().int().min(0).optional(),
  ipAddress: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Infrastructure Router
// ============================================

export const infraRouter = router({
  /**
   * List infrastructure assets with filtering
   */
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          opdId: z.cuid().optional(),
          type: infraTypeEnum.optional(),
          location: locationEnum.optional(),
          isActive: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const {
        search,
        opdId,
        type,
        location,
        isActive,
        limit = 50,
        cursor,
      } = input ?? {};

      // Operators see their own OPD by default
      let filterOpdId = opdId;
      if (ctx.user.role === "OPERATOR" && !opdId) {
        filterOpdId = ctx.user.opdId || undefined;
      }

      const items = await prisma.infrastructure.findMany({
        where: {
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }),
          ...(filterOpdId && { opdId: filterOpdId }),
          ...(type && { type }),
          ...(location && { location }),
          ...(isActive !== undefined && { isActive }),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { name: "asc" },
        include: {
          opd: {
            select: { id: true, code: true, name: true, acronym: true },
          },
          _count: {
            select: { applications: true },
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
   * Get single infrastructure with full details
   */
  getById: protectedProcedure
    .input(z.object({ id: z.cuid() }))
    .query(async ({ input }) => {
      const infra = await prisma.infrastructure.findUnique({
        where: { id: input.id },
        include: {
          opd: true,
          applications: {
            include: {
              app: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  status: true,
                  platform: true,
                },
              },
            },
          },
        },
      });

      if (!infra) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Infrastructure not found",
        });
      }

      return infra;
    }),

  /**
   * Register new infrastructure asset
   */
  register: operatorProcedure
    .input(createInfraSchema)
    .mutation(async ({ input, ctx }) => {
      // Check code uniqueness
      const existing = await prisma.infrastructure.findUnique({
        where: { code: input.code },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Infrastructure with code "${input.code}" already exists`,
        });
      }

      // Operators can only register for their own OPD
      if (ctx.user.role === "OPERATOR" && input.opdId !== ctx.user.opdId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only register infrastructure for your own OPD",
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

      const infra = await prisma.infrastructure.create({
        data: {
          ...input,
          isActive: true,
        },
        include: {
          opd: true,
        },
      });

      return infra;
    }),

  /**
   * Update infrastructure asset
   */
  update: operatorProcedure
    .input(updateInfraSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await prisma.infrastructure.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Infrastructure not found",
        });
      }

      // Operators can only update their own OPD's infra
      if (ctx.user.role === "OPERATOR" && existing.opdId !== ctx.user.opdId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update infrastructure from your own OPD",
        });
      }

      const infra = await prisma.infrastructure.update({
        where: { id },
        data,
        include: {
          opd: true,
        },
      });

      return infra;
    }),

  /**
   * Delete infrastructure asset
   */
  delete: adminProcedure
    .input(z.object({ id: z.cuid() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const existing = await prisma.infrastructure.findUnique({
        where: { id },
        include: {
          _count: { select: { applications: true } },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Infrastructure not found",
        });
      }

      if (existing._count.applications > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete infrastructure with ${existing._count.applications} linked applications. Unlink all applications first.`,
        });
      }

      await prisma.infrastructure.delete({
        where: { id },
      });

      return { success: true, deletedId: id };
    }),

  /**
   * Capacity aggregation by OPD
   * Used for "Peta Rencana" budgeting phase
   * Ref: Source 76 - Capacity Planning
   */
  getCapacityByOpd: protectedProcedure.query(async () => {
    const capacities = await prisma.infrastructure.groupBy({
      by: ["opdId"],
      _sum: {
        cpuCores: true,
        ramGB: true,
        storageGB: true,
      },
      _count: {
        _all: true,
      },
      where: {
        isActive: true,
      },
    });

    // Enrich with OPD names
    const opdIds = capacities.map((c) => c.opdId);
    const opds = await prisma.opd.findMany({
      where: { id: { in: opdIds } },
      select: { id: true, code: true, name: true, acronym: true },
    });

    const opdMap = new Map(opds.map((o) => [o.id, o]));

    return capacities.map((c) => ({
      opd: opdMap.get(c.opdId),
      totalAssets: c._count._all,
      totalCpuCores: c._sum.cpuCores || 0,
      totalRamGB: c._sum.ramGB || 0,
      totalStorageGB: c._sum.storageGB || 0,
    }));
  }),

  /**
   * Get infrastructure by location (PDN vs LOCAL)
   * Used for PDN migration planning
   */
  getByLocation: protectedProcedure.query(async () => {
    const byLocation = await prisma.infrastructure.groupBy({
      by: ["location", "type"],
      _count: { _all: true },
      _sum: {
        cpuCores: true,
        ramGB: true,
        storageGB: true,
      },
      where: {
        isActive: true,
      },
    });

    // Separate PDN and LOCAL for quick comparison
    const pdnAssets = byLocation.filter((l) => l.location === "PDN");
    const localAssets = byLocation.filter((l) => l.location === "LOCAL");

    const totals = {
      pdn: {
        count: pdnAssets.reduce((acc, a) => acc + a._count._all, 0),
        cpuCores: pdnAssets.reduce((acc, a) => acc + (a._sum.cpuCores || 0), 0),
        ramGB: pdnAssets.reduce((acc, a) => acc + (a._sum.ramGB || 0), 0),
        storageGB: pdnAssets.reduce(
          (acc, a) => acc + (a._sum.storageGB || 0),
          0
        ),
      },
      local: {
        count: localAssets.reduce((acc, a) => acc + a._count._all, 0),
        cpuCores: localAssets.reduce(
          (acc, a) => acc + (a._sum.cpuCores || 0),
          0
        ),
        ramGB: localAssets.reduce((acc, a) => acc + (a._sum.ramGB || 0), 0),
        storageGB: localAssets.reduce(
          (acc, a) => acc + (a._sum.storageGB || 0),
          0
        ),
      },
    };

    return {
      breakdown: byLocation,
      totals,
      migrationCandidates: localAssets.reduce(
        (acc, a) => acc + a._count._all,
        0
      ),
    };
  }),

  /**
   * Get PDN migration candidates
   * Lists LOCAL infrastructure that should be migrated to PDN
   */
  getMigrationCandidates: protectedProcedure.query(async () => {
    const candidates = await prisma.infrastructure.findMany({
      where: {
        location: "LOCAL",
        isActive: true,
      },
      include: {
        opd: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: [{ opdId: "asc" }, { name: "asc" }],
    });

    return candidates;
  }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async () => {
    const byType = await prisma.infrastructure.groupBy({
      by: ["type"],
      _count: { _all: true },
    });

    const byLocation = await prisma.infrastructure.groupBy({
      by: ["location"],
      _count: { _all: true },
    });

    const total = await prisma.infrastructure.count();
    const active = await prisma.infrastructure.count({
      where: { isActive: true },
    });

    return {
      total,
      active,
      inactive: total - active,
      byType: byType.map((t) => ({ type: t.type, count: t._count._all })),
      byLocation: byLocation.map((l) => ({
        location: l.location,
        count: l._count._all,
      })),
    };
  }),

  /**
   * Download Excel Template
   */
  downloadTemplate: protectedProcedure
    .input(
      z.object({
        columns: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ input }) => {
      const columnDefinitions = [
        {
          key: "code",
          header: "Code (Unique)",
          width: 20,
          note: "Required. Must be unique. Format: INFRA-XXXX",
        },
        { key: "name", header: "Name", width: 30, note: "Required." },
        { key: "description", header: "Description", width: 40 },
        {
          key: "type",
          header: "Type",
          width: 20,
          validation: {
            type: "list",
            formulae: [
              '"SERVER_PHYSICAL,VIRTUAL_MACHINE,CLOUD_SaaS,CLOUD_IaaS,NETWORK_DEVICE"',
            ],
          },
        },
        {
          key: "location",
          header: "Location",
          width: 15,
          validation: { type: "list", formulae: ['"PDN,LOCAL"'] },
        },
        { key: "specs", header: "Specs", width: 30 },
        { key: "cpuCores", header: "CPU Cores", width: 15 },
        { key: "ramGB", header: "RAM (GB)", width: 15 },
        { key: "storageGB", header: "Storage (GB)", width: 15 },
        { key: "ipAddress", header: "IP Address", width: 20 },
        {
          key: "opdCode",
          header: "OPD Code",
          width: 20,
          note: "Required. Must match existing OPD Code.",
        },
      ] as const;

      // Filter columns based on user selection
      const selectedColumns = columnDefinitions.filter((col) =>
        input.columns.includes(col.key)
      );

      if (selectedColumns.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No valid columns selected",
        });
      }

      const buffer = await ExcelService.generateTemplate(selectedColumns);

      // Return base64 string because tRPC handles JSON best
      return buffer.toString("base64");
    }),

  /**
   * Export Data to Excel
   */
  export: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        opdId: z.cuid().optional(),
        type: infraTypeEnum.optional(),
        location: locationEnum.optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { search, opdId, type, location, isActive } = input;

      // Operators see their own OPD by default
      let filterOpdId = opdId;
      if (ctx.user.role === "OPERATOR" && !opdId) {
        filterOpdId = ctx.user.opdId || undefined;
      }

      const items = await prisma.infrastructure.findMany({
        where: {
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          }),
          ...(filterOpdId && { opdId: filterOpdId }),
          ...(type && { type }),
          ...(location && { location }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          opd: true,
        },
        orderBy: { name: "asc" },
      });

      const columns = [
        { key: "code", header: "Code", width: 20 },
        { key: "name", header: "Name", width: 30 },
        { key: "description", header: "Description", width: 40 },
        { key: "type", header: "Type", width: 20 },
        { key: "location", header: "Location", width: 15 },
        { key: "specs", header: "Specs", width: 30 },
        { key: "cpuCores", header: "CPU Cores", width: 15 },
        { key: "ramGB", header: "RAM (GB)", width: 15 },
        { key: "storageGB", header: "Storage (GB)", width: 15 },
        { key: "ipAddress", header: "IP Address", width: 20 },
        { key: "opdName", header: "OPD", width: 30 },
      ];

      const data = items.map((item) => ({
        ...item,
        opdName: item.opd?.name || "Unknown",
      }));

      const buffer = await ExcelService.exportData(
        data,
        columns,
        "Infrastructure List"
      );
      return buffer.toString("base64");
    }),

  /**
   * Import Data from Excel
   */
  import: operatorProcedure
    .input(
      z.object({
        fileBase64: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");

      // Define Schema for Validation
      const rowSchema = z.object({
        "Code (Unique)": z.string().min(3),
        Name: z.string().min(3),
        Description: z.string().optional(),
        Type: infraTypeEnum.optional().default("VIRTUAL_MACHINE"),
        Location: locationEnum.optional().default("LOCAL"),
        Specs: z.string().optional(),
        "CPU Cores": z.coerce.number().min(0).optional(),
        "RAM (GB)": z.coerce.number().min(0).optional(),
        "Storage (GB)": z.coerce.number().min(0).optional(),
        "IP Address": z.string().optional(),
        "OPD Code": z.string(),
      });

      const columnMapping: Record<string, string> = {
        "Code (Unique)": "Code (Unique)",
        Name: "Name",
        Description: "Description",
        Type: "Type",
        Location: "Location",
        Specs: "Specs",
        "CPU Cores": "CPU Cores",
        "RAM (GB)": "RAM (GB)",
        "Storage (GB)": "Storage (GB)",
        "IP Address": "IP Address",
        "OPD Code": "OPD Code",
      };

      const { success: rows, errors } = await ExcelService.parseExcel(
        buffer,
        rowSchema,
        columnMapping
      );

      if (errors.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Validation failed for ${errors.length} rows. First error: ${JSON.stringify(errors[0])}`,
          cause: errors,
        });
      }

      // Use Transaction for Atomicity
      const result = await prisma.$transaction(async (tx) => {
        let insertedCount = 0;
        let updatedCount = 0;

        for (const row of rows) {
          // Resolve OPD
          const opdCode = row["OPD Code"];
          const opd = await tx.opd.findUnique({ where: { code: opdCode } });

          if (!opd) {
            throw new Error(`OPD with code '${opdCode}' not found.`);
          }

          // Check permissions if Operator
          if (ctx.user.role === "OPERATOR" && opd.id !== ctx.user.opdId) {
            throw new Error(`You cannot import data for OPD '${opdCode}'.`);
          }

          const infraData = {
            code: row["Code (Unique)"],
            name: row["Name"],
            description: row["Description"],
            type: row["Type"] as any,
            location: row["Location"] as any,
            specs: row["Specs"],
            cpuCores: row["CPU Cores"],
            ramGB: row["RAM (GB)"],
            storageGB: row["Storage (GB)"],
            ipAddress: row["IP Address"],
            opdId: opd.id,
            isActive: true,
          };

          const existing = await tx.infrastructure.findUnique({
            where: { code: infraData.code },
          });

          if (existing) {
            await tx.infrastructure.update({
              where: { id: existing.id },
              data: infraData,
            });
            updatedCount++;
          } else {
            await tx.infrastructure.create({
              data: infraData,
            });
            insertedCount++;
          }
        }

        return { insertedCount, updatedCount };
      });

      return result;
    }),
});
