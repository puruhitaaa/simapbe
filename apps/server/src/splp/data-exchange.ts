/**
 * SPLP Data Exchange Endpoints
 * Ref: Satu Data Indonesia (Perpres 39/2019)
 *
 * Provides data standards and metadata exchange
 * with classification-aware access control
 */

import prisma from "@simapbe/db";
import { Elysia, t } from "elysia";
import { createSPLPError, createSPLPResponse, getRequestId } from "./index";

/**
 * Check if request has access to restricted data
 */
function hasRestrictedAccess(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  // In production, validate the token and check permissions
  return authHeader?.startsWith("Bearer ") ?? false;
}

export const dataExchangeRoutes = new Elysia({ prefix: "/data" })
  /**
   * GET /data/standards
   * Returns data standards catalog
   */
  .get(
    "/standards",
    async ({ query, request }) => {
      const requestId = getRequestId(request);
      const { classification, producerId, limit = "100", offset = "0" } = query;

      // Filter by classification based on access
      const allowedClassifications = hasRestrictedAccess(request)
        ? ["PUBLIC", "RESTRICTED"]
        : ["PUBLIC"];

      const whereClause = {
        classification: classification
          ? { equals: classification as "PUBLIC" | "RESTRICTED" | "SECRET" }
          : {
              in: allowedClassifications as Array<
                "PUBLIC" | "RESTRICTED" | "SECRET"
              >,
            },
        ...(producerId && { producerOpdId: producerId }),
      };

      const standards = await prisma.dataStandard.findMany({
        where: whereClause,
        include: {
          producerOpd: {
            select: { code: true, name: true, acronym: true },
          },
        },
        take: Math.min(Number.parseInt(limit), 500),
        skip: Number.parseInt(offset),
        orderBy: { dataCode: "asc" },
      });

      const total = await prisma.dataStandard.count({ where: whereClause });

      return createSPLPResponse(
        {
          items: standards.map((s) => ({
            code: s.dataCode,
            name: s.dataName,
            description: s.description,
            format: s.format,
            classification: s.classification,
            validityPeriod: s.validityPeriod,
            updateFrequency: s.updateFrequency,
            isValidated: s.isValidated,
            producer: s.producerOpd
              ? {
                  code: s.producerOpd.code,
                  name: s.producerOpd.name,
                  acronym: s.producerOpd.acronym,
                }
              : null,
          })),
          pagination: {
            total,
            limit: Number.parseInt(limit),
            offset: Number.parseInt(offset),
            hasMore: Number.parseInt(offset) + standards.length < total,
          },
        },
        requestId
      );
    },
    {
      query: t.Object({
        classification: t.Optional(t.String()),
        producerId: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  /**
   * GET /data/standards/:code
   * Returns specific data standard with consumers/producers
   */
  .get(
    "/standards/:code",
    async ({ params, request }) => {
      const requestId = getRequestId(request);

      const standard = await prisma.dataStandard.findUnique({
        where: { dataCode: params.code },
        include: {
          producerOpd: {
            select: { code: true, name: true, acronym: true },
          },
          applications: {
            include: {
              app: {
                select: {
                  code: true,
                  name: true,
                  opd: { select: { code: true, name: true } },
                },
              },
            },
          },
        },
      });

      if (!standard) {
        return createSPLPError(
          "NOT_FOUND",
          `Data standard with code ${params.code} not found`,
          requestId
        );
      }

      // Check access for restricted data
      if (
        standard.classification !== "PUBLIC" &&
        !hasRestrictedAccess(request)
      ) {
        return createSPLPError(
          "FORBIDDEN",
          "Access to restricted data requires authentication",
          requestId
        );
      }

      return createSPLPResponse(
        {
          code: standard.dataCode,
          name: standard.dataName,
          description: standard.description,
          format: standard.format,
          classification: standard.classification,
          validityPeriod: standard.validityPeriod,
          updateFrequency: standard.updateFrequency,
          isValidated: standard.isValidated,
          producer: standard.producerOpd
            ? {
                code: standard.producerOpd.code,
                name: standard.producerOpd.name,
                acronym: standard.producerOpd.acronym,
              }
            : null,
          consumers: standard.applications
            .filter((a) => a.relationType === "CONSUMER")
            .map((a) => ({
              appCode: a.app.code,
              appName: a.app.name,
              opdCode: a.app.opd.code,
              opdName: a.app.opd.name,
            })),
          producers: standard.applications
            .filter((a) => a.relationType === "PRODUCER")
            .map((a) => ({
              appCode: a.app.code,
              appName: a.app.name,
              opdCode: a.app.opd.code,
              opdName: a.app.opd.name,
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
   * GET /data/producers
   * Returns OPDs with their validated data standards
   */
  .get("/producers", async ({ request }) => {
    const requestId = getRequestId(request);

    const producers = await prisma.opd.findMany({
      where: {
        dataStandards: {
          some: { isValidated: true },
        },
      },
      select: {
        code: true,
        name: true,
        acronym: true,
        _count: {
          select: { dataStandards: true },
        },
        dataStandards: {
          where: { isValidated: true, classification: "PUBLIC" },
          select: {
            dataCode: true,
            dataName: true,
            format: true,
          },
          take: 10,
        },
      },
    });

    return createSPLPResponse(
      {
        items: producers.map((p) => ({
          code: p.code,
          name: p.name,
          acronym: p.acronym,
          totalDataStandards: p._count.dataStandards,
          publicData: p.dataStandards.map((d) => ({
            code: d.dataCode,
            name: d.dataName,
            format: d.format,
          })),
        })),
        total: producers.length,
      },
      requestId
    );
  })

  /**
   * GET /data/interoperability
   * Returns data interoperability graph (which apps use which data)
   */
  .get(
    "/interoperability",
    async ({ query, request }) => {
      const requestId = getRequestId(request);
      const { opdId, limit = "50" } = query;

      const connections = await prisma.applicationData.findMany({
        where: opdId
          ? {
              app: { opdId },
            }
          : undefined,
        include: {
          app: {
            select: {
              code: true,
              name: true,
              opd: { select: { code: true, name: true } },
            },
          },
          data: {
            select: {
              dataCode: true,
              dataName: true,
              classification: true,
            },
          },
        },
        take: Math.min(Number.parseInt(limit), 200),
      });

      // Build interoperability map
      const nodeMap = new Map<
        string,
        { type: "app" | "data"; code: string; name: string; opd?: string }
      >();
      const edges: Array<{
        from: { type: string; code: string };
        to: { type: string; code: string };
        relation: string;
      }> = [];

      for (const conn of connections) {
        const appCode = conn.app.code;
        const dataCode = conn.data.dataCode;

        // Add app node
        if (!nodeMap.has(`app:${appCode}`)) {
          nodeMap.set(`app:${appCode}`, {
            type: "app",
            code: appCode,
            name: conn.app.name,
            opd: conn.app.opd.code,
          });
        }

        // Add data node
        if (!nodeMap.has(`data:${dataCode}`)) {
          nodeMap.set(`data:${dataCode}`, {
            type: "data",
            code: dataCode,
            name: conn.data.dataName,
          });
        }

        // Add edge
        edges.push({
          from:
            conn.relationType === "PRODUCER"
              ? { type: "app", code: appCode }
              : { type: "data", code: dataCode },
          to:
            conn.relationType === "PRODUCER"
              ? { type: "data", code: dataCode }
              : { type: "app", code: appCode },
          relation: conn.relationType,
        });
      }

      return createSPLPResponse(
        {
          nodes: Array.from(nodeMap.values()),
          edges,
          summary: {
            totalApps: Array.from(nodeMap.values()).filter(
              (n) => n.type === "app"
            ).length,
            totalData: Array.from(nodeMap.values()).filter(
              (n) => n.type === "data"
            ).length,
            totalConnections: edges.length,
          },
        },
        requestId
      );
    },
    {
      query: t.Object({
        opdId: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  );
