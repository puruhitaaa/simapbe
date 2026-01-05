/**
 * SPLP Reference Data Endpoints
 * Ref: Perpres 132/2022 - Kode Referensi Synchronization
 *
 * Provides standardized reference codes for:
 * - Business Processes (Probismet)
 * - OPD codes
 * - Enum values
 */

import prisma from "@simapbe/db";
import { Elysia, t } from "elysia";
import { createSPLPError, createSPLPResponse, getRequestId } from "./index";

export const referenceRoutes = new Elysia({ prefix: "/references" })
  /**
   * GET /references/probis
   * Returns Business Process hierarchy (Probismet codes)
   */
  .get(
    "/probis",
    async ({ query, request }) => {
      const requestId = getRequestId(request);
      const { level, parentId, limit = "100", offset = "0" } = query;

      const processes = await prisma.businessProcess.findMany({
        where: {
          ...(level && { level: Number.parseInt(level) }),
          ...(parentId && { parentId }),
        },
        take: Math.min(Number.parseInt(limit), 500),
        skip: Number.parseInt(offset),
        orderBy: [{ level: "asc" }, { kodeProbismet: "asc" }],
      });

      const total = await prisma.businessProcess.count({
        where: {
          ...(level && { level: Number.parseInt(level) }),
          ...(parentId && { parentId }),
        },
      });

      return createSPLPResponse(
        {
          items: processes.map((p) => ({
            code: p.kodeProbismet,
            name: p.name,
            level: p.level,
            description: p.description,
            parentId: p.parentId,
          })),
          pagination: {
            total,
            limit: Number.parseInt(limit),
            offset: Number.parseInt(offset),
            hasMore: Number.parseInt(offset) + processes.length < total,
          },
        },
        requestId
      );
    },
    {
      query: t.Object({
        level: t.Optional(t.String()),
        parentId: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  /**
   * GET /references/probis/:code
   * Returns a specific business process by code
   */
  .get(
    "/probis/:code",
    async ({ params, request }) => {
      const requestId = getRequestId(request);

      const process = await prisma.businessProcess.findUnique({
        where: { kodeProbismet: params.code },
        include: {
          parent: {
            select: { id: true, kodeProbismet: true, name: true },
          },
          children: {
            select: {
              id: true,
              kodeProbismet: true,
              name: true,
              level: true,
            },
          },
        },
      });

      if (!process) {
        return createSPLPError(
          "NOT_FOUND",
          `Business process with code ${params.code} not found`,
          requestId
        );
      }

      return createSPLPResponse(
        {
          code: process.kodeProbismet,
          name: process.name,
          description: process.description,
          level: process.level,
          parent: process.parent
            ? {
                code: process.parent.kodeProbismet,
                name: process.parent.name,
              }
            : null,
          children: process.children.map((c) => ({
            code: c.kodeProbismet,
            name: c.name,
            level: c.level,
          })),
        },
        requestId
      );
    },
    {
      params: t.Object({
        code: t.String(),
      }),
    }
  )

  /**
   * GET /references/opd
   * Returns list of OPD codes
   */
  .get(
    "/opd",
    async ({ query, request }) => {
      const requestId = getRequestId(request);
      const { search, limit = "100", offset = "0" } = query;

      const opds = await prisma.opd.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
                { acronym: { contains: search, mode: "insensitive" } },
              ],
            }
          : undefined,
        take: Math.min(Number.parseInt(limit), 500),
        skip: Number.parseInt(offset),
        orderBy: { code: "asc" },
      });

      const total = await prisma.opd.count({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
                { acronym: { contains: search, mode: "insensitive" } },
              ],
            }
          : undefined,
      });

      return createSPLPResponse(
        {
          items: opds.map((o) => ({
            code: o.code,
            name: o.name,
            acronym: o.acronym,
            address: o.address,
            phone: o.phone,
            email: o.email,
          })),
          pagination: {
            total,
            limit: Number.parseInt(limit),
            offset: Number.parseInt(offset),
            hasMore: Number.parseInt(offset) + opds.length < total,
          },
        },
        requestId
      );
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  /**
   * GET /references/opd/:code
   * Returns a specific OPD with statistics
   */
  .get(
    "/opd/:code",
    async ({ params, request }) => {
      const requestId = getRequestId(request);

      const opd = await prisma.opd.findUnique({
        where: { code: params.code },
        include: {
          _count: {
            select: {
              users: true,
              applications: true,
              infrastructure: true,
            },
          },
        },
      });

      if (!opd) {
        return createSPLPError(
          "NOT_FOUND",
          `OPD with code ${params.code} not found`,
          requestId
        );
      }

      return createSPLPResponse(
        {
          code: opd.code,
          name: opd.name,
          acronym: opd.acronym,
          address: opd.address,
          phone: opd.phone,
          email: opd.email,
          statistics: {
            users: opd._count.users,
            applications: opd._count.applications,
            infrastructure: opd._count.infrastructure,
          },
        },
        requestId
      );
    },
    {
      params: t.Object({
        code: t.String(),
      }),
    }
  )

  /**
   * GET /references/enums
   * Returns all enum values for reference
   */
  .get("/enums", ({ request }) => {
    const requestId = getRequestId(request);

    return createSPLPResponse(
      {
        userRole: ["SUPER_ADMIN", "OPERATOR", "AUDITOR", "LEADER"],
        appType: ["UMUM", "KHUSUS"],
        platformType: ["WEB", "MOBILE", "DESKTOP", "API"],
        appStatus: ["PLANNING", "DEVELOPMENT", "ACTIVE", "ARCHIVED"],
        dataClass: ["PUBLIC", "RESTRICTED", "SECRET"],
        dataRelation: ["PRODUCER", "CONSUMER"],
        infraType: [
          "SERVER_PHYSICAL",
          "VIRTUAL_MACHINE",
          "CLOUD_SaaS",
          "CLOUD_IaaS",
          "NETWORK_DEVICE",
        ],
        infraLocation: ["PDN", "LOCAL"],
        serviceType: ["G2C", "G2B", "G2G", "G2E"],
        auditStatus: ["PENDING", "PASSED", "FAILED_REMEDIATION_REQUIRED"],
        riskLevel: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        planStatus: ["PLANNED", "BUDGETED", "ONGOING", "COMPLETED", "DELAYED"],
      },
      requestId
    );
  });
