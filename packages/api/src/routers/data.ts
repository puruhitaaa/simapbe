/**
 * Data Architecture Router (Domain 2: Arsitektur Data)
 * Ref: Satu Data Indonesia (Perpres 39/2019)
 *
 * Manages Data Standards with Walidata validation workflow:
 * - Produsen Data: OPD that produces the data
 * - Walidata: Diskominfo validates metadata standards
 * - Classification: PUBLIC, RESTRICTED, SECRET
 *
 * Access:
 * - SUPER_ADMIN: Full CRUD + Walidata validation
 * - OPERATOR: Submit standards for own OPD, read all
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
// Input Schemas
// ============================================

const dataClassEnum = z.enum(["PUBLIC", "RESTRICTED", "SECRET"]);

const createDataStandardSchema = z.object({
  dataCode: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(30, "Code must be at most 30 characters")
    .regex(/^DS-[A-Z]{3}-\d{3}$/, "Code must follow format: DS-XXX-000"),
  dataName: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  format: z.string().min(1, "Format is required"), // JSON, XML, CSV, etc.
  validityPeriod: z.string().min(1, "Validity period is required"), // Annual, Monthly, etc.
  updateFrequency: z.string().optional(),
  classification: dataClassEnum.default("PUBLIC"),
  producerOpdId: z.cuid().optional(),
});

const updateDataStandardSchema = z.object({
  id: z.cuid(),
  dataName: z.string().min(3).optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  validityPeriod: z.string().optional(),
  updateFrequency: z.string().optional(),
  classification: dataClassEnum.optional(),
});

// ============================================
// Data Router
// ============================================

export const dataRouter = router({
  /**
   * List all data standards with filtering
   */
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          classification: dataClassEnum.optional(),
          producerOpdId: z.cuid().optional(),
          isValidated: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const {
        search,
        classification,
        producerOpdId,
        isValidated,
        limit = 50,
        cursor,
      } = input ?? {};

      const dataStandards = await prisma.dataStandard.findMany({
        where: {
          ...(search && {
            OR: [
              { dataName: { contains: search, mode: "insensitive" } },
              { dataCode: { contains: search, mode: "insensitive" } },
            ],
          }),
          ...(classification && { classification }),
          ...(producerOpdId && { producerOpdId }),
          ...(isValidated !== undefined && { isValidated }),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { dataCode: "asc" },
        include: {
          producerOpd: {
            select: { id: true, code: true, name: true, acronym: true },
          },
          _count: {
            select: { applications: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (dataStandards.length > limit) {
        const nextItem = dataStandards.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: dataStandards,
        nextCursor,
      };
    }),

  /**
   * Get single data standard by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.cuid() }))
    .query(async ({ input }) => {
      const dataStandard = await prisma.dataStandard.findUnique({
        where: { id: input.id },
        include: {
          producerOpd: true,
          applications: {
            include: {
              app: {
                select: { id: true, name: true, code: true, status: true },
              },
            },
          },
        },
      });

      if (!dataStandard) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data standard not found",
        });
      }

      return dataStandard;
    }),

  /**
   * Get data standard by code
   */
  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const dataStandard = await prisma.dataStandard.findUnique({
        where: { dataCode: input.code },
        include: {
          producerOpd: true,
          _count: { select: { applications: true } },
        },
      });

      if (!dataStandard) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data standard not found",
        });
      }

      return dataStandard;
    }),

  /**
   * Submit new data standard (Produsen Data)
   * Access: SUPER_ADMIN, OPERATOR (for own OPD)
   */
  submitStandard: operatorProcedure
    .input(createDataStandardSchema)
    .mutation(async ({ input, ctx }) => {
      // Check for existing code
      const existing = await prisma.dataStandard.findUnique({
        where: { dataCode: input.dataCode },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Data standard with code "${input.dataCode}" already exists`,
        });
      }

      // Operators can only submit for their own OPD
      let producerOpdId = input.producerOpdId;

      if (ctx.user.role === "OPERATOR") {
        if (!ctx.user.opdId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You must be assigned to an OPD to submit data standards",
          });
        }
        producerOpdId = ctx.user.opdId;
      }

      // Validate OPD exists if provided
      if (producerOpdId) {
        const opd = await prisma.opd.findUnique({
          where: { id: producerOpdId },
        });

        if (!opd) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Producer OPD not found",
          });
        }
      }

      const dataStandard = await prisma.dataStandard.create({
        data: {
          ...input,
          producerOpdId,
          isValidated: false, // Requires Walidata validation
        },
        include: {
          producerOpd: true,
        },
      });

      return dataStandard;
    }),

  /**
   * Validate metadata (Walidata only - SUPER_ADMIN)
   * Validates that the data standard meets Satu Data requirements
   */
  validateMetadata: adminProcedure
    .input(
      z.object({
        id: z.cuid(),
        approve: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, approve, notes } = input;

      const existing = await prisma.dataStandard.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data standard not found",
        });
      }

      if (existing.isValidated && approve) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Data standard is already validated",
        });
      }

      const dataStandard = await prisma.dataStandard.update({
        where: { id },
        data: {
          isValidated: approve,
          validatedAt: approve ? new Date() : null,
          validatedById: approve ? ctx.user.id : null,
          // Store notes in description if rejecting
          ...(notes &&
            !approve && {
              description: `[REJECTED: ${notes}] ${existing.description || ""}`,
            }),
        },
        include: {
          producerOpd: true,
        },
      });

      return dataStandard;
    }),

  /**
   * Update data standard
   * Access: SUPER_ADMIN, OPERATOR (own OPD only)
   */
  update: operatorProcedure
    .input(updateDataStandardSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await prisma.dataStandard.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data standard not found",
        });
      }

      // Operators can only update their own OPD's data
      if (
        ctx.user.role === "OPERATOR" &&
        existing.producerOpdId !== ctx.user.opdId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update data standards from your own OPD",
        });
      }

      // If updating classification, re-validation may be required
      const needsRevalidation =
        data.classification && data.classification !== existing.classification;

      const dataStandard = await prisma.dataStandard.update({
        where: { id },
        data: {
          ...data,
          ...(needsRevalidation && {
            isValidated: false,
            validatedAt: null,
            validatedById: null,
          }),
        },
      });

      return dataStandard;
    }),

  /**
   * Delete data standard
   * Access: SUPER_ADMIN only
   */
  delete: adminProcedure
    .input(z.object({ id: z.cuid() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const existing = await prisma.dataStandard.findUnique({
        where: { id },
        include: {
          _count: { select: { applications: true } },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data standard not found",
        });
      }

      if (existing._count.applications > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete data standard used by ${existing._count.applications} applications`,
        });
      }

      await prisma.dataStandard.delete({
        where: { id },
      });

      return { success: true, deletedId: id };
    }),

  /**
   * Get classification breakdown
   * Used for dashboard visualization
   */
  getClassification: protectedProcedure.query(async () => {
    const counts = await prisma.dataStandard.groupBy({
      by: ["classification"],
      _count: { id: true },
    });

    const validated = await prisma.dataStandard.count({
      where: { isValidated: true },
    });

    const pending = await prisma.dataStandard.count({
      where: { isValidated: false },
    });

    return {
      byClassification: counts.map((c) => ({
        classification: c.classification,
        count: c._count.id,
      })),
      validated,
      pending,
      total: validated + pending,
    };
  }),

  /**
   * Get pending validations (for Walidata dashboard)
   * Access: SUPER_ADMIN only
   */
  getPendingValidations: adminProcedure.query(async () => {
    const pending = await prisma.dataStandard.findMany({
      where: { isValidated: false },
      orderBy: { createdAt: "asc" },
      include: {
        producerOpd: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return pending;
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
          key: "dataCode",
          header: "Code (Unique)",
          width: 25,
          note: "Required. Format: DS-XXX-000",
        },
        { key: "dataName", header: "Name", width: 30, note: "Required." },
        { key: "description", header: "Description", width: 40 },
        {
          key: "format",
          header: "Format",
          width: 15,
          note: "JSON, XML, CSV, etc.",
        },
        {
          key: "validityPeriod",
          header: "Validity",
          width: 15,
          note: "Annual, Monthly, etc.",
        },
        { key: "updateFrequency", header: "Update Frequency", width: 20 },
        {
          key: "classification",
          header: "Classification",
          width: 15,
          validation: {
            type: "list",
            formulae: ['"PUBLIC,RESTRICTED,SECRET"'],
          },
        },
        {
          key: "producerOpdCode",
          header: "Producer OPD Code",
          width: 20,
          note: "Required.",
        },
      ] as const;

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
        classification: dataClassEnum.optional(),
        search: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { classification, search } = input;

      const dataStandards = await prisma.dataStandard.findMany({
        where: {
          ...(classification && { classification }),
          ...(search && {
            OR: [
              { dataName: { contains: search, mode: "insensitive" } },
              { dataCode: { contains: search, mode: "insensitive" } },
            ],
          }),
        },
        include: {
          producerOpd: { select: { code: true } },
        },
        orderBy: { dataCode: "asc" },
      });

      const columns = [
        { key: "dataCode", header: "Code", width: 25 },
        { key: "dataName", header: "Name", width: 30 },
        { key: "description", header: "Description", width: 40 },
        { key: "format", header: "Format", width: 15 },
        { key: "validityPeriod", header: "Validity", width: 15 },
        { key: "updateFrequency", header: "Frequency", width: 20 },
        { key: "classification", header: "Class", width: 15 },
        { key: "producerOpdCode", header: "Producer OPD", width: 20 },
      ];

      const data = dataStandards.map((d) => ({
        ...d,
        producerOpdCode: d.producerOpd?.code || "",
      }));

      const buffer = await ExcelService.exportData(
        data,
        columns,
        "Data Standards"
      );
      return buffer.toString("base64");
    }),

  /**
   * Import Data
   */
  import: operatorProcedure
    .input(z.object({ fileBase64: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");

      const rowSchema = z.object({
        "Code (Unique)": z
          .string()
          .regex(/^DS-[A-Z]{3}-\d{3}$/, "Invalid format"),
        Name: z.string().min(3),
        Description: z.string().optional(),
        Format: z.string().min(1),
        Validity: z.string().min(1),
        "Update Frequency": z.string().optional(),
        Classification: dataClassEnum.default("PUBLIC"),
        "Producer OPD Code": z.string().optional(),
      });

      const columnMapping = {
        "Code (Unique)": "Code (Unique)",
        Name: "Name",
        Description: "Description",
        Format: "Format",
        Validity: "Validity",
        "Update Frequency": "Update Frequency",
        Classification: "Classification",
        "Producer OPD Code": "Producer OPD Code",
      };

      const { success: rows, errors } = await ExcelService.parseExcel(
        buffer,
        rowSchema,
        columnMapping
      );

      if (errors.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Validation failed for ${errors.length} rows.`,
          cause: errors,
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        let inserted = 0;
        let updated = 0;

        for (const row of rows) {
          const code = row["Code (Unique)"];
          let opdId = null;

          const opdCode = row["Producer OPD Code"];
          if (opdCode) {
            const opd = await tx.opd.findUnique({ where: { code: opdCode } });
            if (!opd) throw new Error(`OPD code '${opdCode}' not found`);
            opdId = opd.id;
          }

          // Permission check if Operator
          if (ctx.user.role === "OPERATOR") {
            if (opdId && opdId !== ctx.user.opdId) {
              throw new Error(`You cannot import data for OPD '${opdCode}'`);
            }
            if (!opdId && ctx.user.opdId) {
              opdId = ctx.user.opdId; // Default to user's OPD if missing in file
            }
          }

          const data = {
            dataCode: code,
            dataName: row["Name"],
            description: row["Description"],
            format: row["Format"],
            validityPeriod: row["Validity"],
            updateFrequency: row["Update Frequency"],
            classification: row["Classification"] as any,
            producerOpdId: opdId,
            isValidated: false, // Reset validation on bulk import
          };

          const existing = await tx.dataStandard.findUnique({
            where: { dataCode: code },
          });

          if (existing) {
            await tx.dataStandard.update({ where: { id: existing.id }, data });
            updated++;
          } else {
            await tx.dataStandard.create({ data });
            inserted++;
          }
        }
        return { insertedCount: inserted, updatedCount: updated };
      });

      return result;
    }),
});
