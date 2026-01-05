/**
 * SPLP Service Catalog Endpoints
 * Ref: Perpres 132/2022 - Arsitektur Layanan
 *
 * Provides public service catalog with full traceability:
 * Service → Process → Application → Data → Infrastructure
 */

import prisma from "@simapbe/db";
import { Elysia, t } from "elysia";
import { createSPLPError, createSPLPResponse, getRequestId } from "./index";

export const serviceCatalogRoutes = new Elysia({ prefix: "/services" })
  /**
   * GET /services
   * Returns public service catalog
   */
  .get(
    "/",
    async ({ query, request }) => {
      const requestId = getRequestId(request);
      const { type, search, limit = "100", offset = "0" } = query;

      const whereClause = {
        isActive: true,
        ...(type && { type: type as "G2C" | "G2B" | "G2G" | "G2E" }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
            {
              description: { contains: search, mode: "insensitive" as const },
            },
          ],
        }),
      };

      const services = await prisma.service.findMany({
        where: whereClause,
        include: {
          businessProcess: {
            select: { kodeProbismet: true, name: true },
          },
          application: {
            select: {
              code: true,
              name: true,
              platform: true,
              opd: { select: { code: true, name: true } },
            },
          },
        },
        take: Math.min(Number.parseInt(limit), 500),
        skip: Number.parseInt(offset),
        orderBy: { code: "asc" },
      });

      const total = await prisma.service.count({ where: whereClause });

      return createSPLPResponse(
        {
          items: services.map((s) => ({
            code: s.code,
            name: s.name,
            description: s.description,
            type: s.type,
            url: s.url,
            businessProcess: s.businessProcess
              ? {
                  code: s.businessProcess.kodeProbismet,
                  name: s.businessProcess.name,
                }
              : null,
            application: s.application
              ? {
                  code: s.application.code,
                  name: s.application.name,
                  platform: s.application.platform,
                  opd: s.application.opd.code,
                }
              : null,
          })),
          pagination: {
            total,
            limit: Number.parseInt(limit),
            offset: Number.parseInt(offset),
            hasMore: Number.parseInt(offset) + services.length < total,
          },
        },
        requestId
      );
    },
    {
      query: t.Object({
        type: t.Optional(t.String()),
        search: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  /**
   * GET /services/:code
   * Returns full service traceability
   */
  .get(
    "/:code",
    async ({ params, request }) => {
      const requestId = getRequestId(request);

      const service = await prisma.service.findUnique({
        where: { code: params.code },
        include: {
          businessProcess: {
            include: {
              parent: {
                select: { kodeProbismet: true, name: true },
              },
            },
          },
          application: {
            include: {
              opd: {
                select: { code: true, name: true, acronym: true },
              },
              usedData: {
                include: {
                  data: {
                    select: {
                      dataCode: true,
                      dataName: true,
                      classification: true,
                    },
                  },
                },
              },
              infrastructure: {
                include: {
                  infra: {
                    select: {
                      code: true,
                      name: true,
                      type: true,
                      location: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!service) {
        return createSPLPError(
          "NOT_FOUND",
          `Service with code ${params.code} not found`,
          requestId
        );
      }

      return createSPLPResponse(
        {
          code: service.code,
          name: service.name,
          description: service.description,
          type: service.type,
          url: service.url,
          isActive: service.isActive,
          // Traceability: Service → Process
          businessProcess: service.businessProcess
            ? {
                code: service.businessProcess.kodeProbismet,
                name: service.businessProcess.name,
                level: service.businessProcess.level,
                parent: service.businessProcess.parent
                  ? {
                      code: service.businessProcess.parent.kodeProbismet,
                      name: service.businessProcess.parent.name,
                    }
                  : null,
              }
            : null,
          // Traceability: Service → Application
          application: service.application
            ? {
                code: service.application.code,
                name: service.application.name,
                type: service.application.type,
                platform: service.application.platform,
                status: service.application.status,
                opd: {
                  code: service.application.opd.code,
                  name: service.application.opd.name,
                  acronym: service.application.opd.acronym,
                },
              }
            : null,
          // Traceability: Application → Data
          data:
            service.application?.usedData.map((d) => ({
              code: d.data.dataCode,
              name: d.data.dataName,
              classification: d.data.classification,
              relation: d.relationType,
            })) ?? [],
          // Traceability: Application → Infrastructure
          infrastructure:
            service.application?.infrastructure.map((i) => ({
              code: i.infra.code,
              name: i.infra.name,
              type: i.infra.type,
              location: i.infra.location,
            })) ?? [],
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
   * GET /services/by-type/:type
   * Returns services grouped by type
   */
  .get(
    "/by-type/:type",
    async ({ params, query, request }) => {
      const requestId = getRequestId(request);
      const { limit = "50", offset = "0" } = query;

      const validTypes = ["G2C", "G2B", "G2G", "G2E"];
      if (!validTypes.includes(params.type.toUpperCase())) {
        return createSPLPError(
          "INVALID_TYPE",
          `Invalid service type. Valid types are: ${validTypes.join(", ")}`,
          requestId
        );
      }

      const serviceType = params.type.toUpperCase() as
        | "G2C"
        | "G2B"
        | "G2G"
        | "G2E";

      const services = await prisma.service.findMany({
        where: {
          type: serviceType,
          isActive: true,
        },
        include: {
          application: {
            select: {
              code: true,
              name: true,
              opd: { select: { code: true, name: true } },
            },
          },
        },
        take: Math.min(Number.parseInt(limit), 200),
        skip: Number.parseInt(offset),
        orderBy: { name: "asc" },
      });

      const total = await prisma.service.count({
        where: { type: serviceType, isActive: true },
      });

      return createSPLPResponse(
        {
          type: serviceType,
          description: getServiceTypeDescription(serviceType),
          items: services.map((s) => ({
            code: s.code,
            name: s.name,
            description: s.description,
            url: s.url,
            application: s.application
              ? {
                  code: s.application.code,
                  name: s.application.name,
                  opd: s.application.opd.code,
                }
              : null,
          })),
          pagination: {
            total,
            limit: Number.parseInt(limit),
            offset: Number.parseInt(offset),
            hasMore: Number.parseInt(offset) + services.length < total,
          },
        },
        requestId
      );
    },
    {
      params: t.Object({
        type: t.String(),
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  /**
   * GET /services/search
   * Full-text search across services
   */
  .get(
    "/search",
    async ({ query, request }) => {
      const requestId = getRequestId(request);
      const { q, limit = "20" } = query;

      if (!q || q.length < 2) {
        return createSPLPError(
          "INVALID_QUERY",
          "Search query must be at least 2 characters",
          requestId
        );
      }

      const services = await prisma.service.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          code: true,
          name: true,
          description: true,
          type: true,
          url: true,
        },
        take: Math.min(Number.parseInt(limit), 50),
        orderBy: { name: "asc" },
      });

      return createSPLPResponse(
        {
          query: q,
          results: services,
          count: services.length,
        },
        requestId
      );
    },
    {
      query: t.Object({
        q: t.String(),
        limit: t.Optional(t.String()),
      }),
    }
  );

/**
 * Get human-readable description for service type
 */
function getServiceTypeDescription(
  type: "G2C" | "G2B" | "G2G" | "G2E"
): string {
  const descriptions = {
    G2C: "Government to Citizen - Layanan untuk masyarakat umum",
    G2B: "Government to Business - Layanan untuk pelaku usaha",
    G2G: "Government to Government - Layanan antar instansi pemerintah",
    G2E: "Government to Employee - Layanan untuk ASN/pegawai pemerintah",
  };
  return descriptions[type];
}
