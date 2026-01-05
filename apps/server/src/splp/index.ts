/**
 * SPLP REST API (Sistem Penghubung Layanan Pemerintah)
 * Ref: Perpres 132/2022, Satu Data Indonesia
 *
 * External interoperability endpoints for:
 * - Reference Data synchronization (Kode Referensi)
 * - Data Exchange (Satu Data Indonesia)
 * - Service Catalog (Public)
 * - Statistics (SPBE Metrics)
 *
 * Standards:
 * - RESTful API with JSON responses
 * - Token-based authentication for restricted data
 */

import { Elysia } from "elysia";
import { dataExchangeRoutes } from "./data-exchange";
import { referenceRoutes } from "./references";
import { serviceCatalogRoutes } from "./service-catalog";
import { statisticsRoutes } from "./statistics";

/**
 * SPLP API Response wrapper
 * Consistent response format for all SPLP endpoints
 */
export interface SPLPResponse<T> {
  status: "success" | "error";
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    version: string;
    source: string;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Create standardized SPLP response
 */
export function createSPLPResponse<T>(
  data: T,
  requestId?: string
): SPLPResponse<T> {
  return {
    status: "success",
    data,
    metadata: {
      version: "2025-Q1",
      source: "Pemkot Bandung - SIMAPBE",
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Create standardized SPLP error response
 */
export function createSPLPError(
  code: string,
  message: string,
  requestId?: string
): SPLPResponse<never> {
  return {
    status: "error",
    error: { code, message },
    metadata: {
      version: "2025-Q1",
      source: "Pemkot Bandung - SIMAPBE",
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Extract request ID from headers
 */
export function getRequestId(request: Request): string {
  return request.headers.get("X-Transaction-ID") || crypto.randomUUID();
}

/**
 * SPLP Router - combines all SPLP endpoints
 */
export const splpRouter = new Elysia({ prefix: "/api/splp/v1" })
  // Health check
  .get("/health", ({ request }) =>
    createSPLPResponse(
      { status: "healthy", uptime: process.uptime() },
      getRequestId(request)
    )
  )

  // API Info
  .get("/", ({ request }) =>
    createSPLPResponse(
      {
        name: "SIMAPBE SPLP API",
        version: "1.0.0",
        description:
          "Sistem Penghubung Layanan Pemerintah - Kota Bandung SPBE Integration API",
        endpoints: {
          references: "/api/splp/v1/references",
          data: "/api/splp/v1/data",
          services: "/api/splp/v1/services",
          statistics: "/api/splp/v1/statistics",
        },
      },
      getRequestId(request)
    )
  )

  // Mount sub-routers
  .use(referenceRoutes)
  .use(dataExchangeRoutes)
  .use(serviceCatalogRoutes)
  .use(statisticsRoutes);
