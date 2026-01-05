/**
 * SPLP Statistics Endpoints
 * Ref: Perpres 132/2022 - SPBE Monitoring
 *
 * Provides SPBE architecture statistics and metrics
 */

import prisma from "@simapbe/db";
import { Elysia } from "elysia";
import { createSPLPResponse, getRequestId } from "./index";

export const statisticsRoutes = new Elysia({ prefix: "/statistics" })
  /**
   * GET /statistics/overview
   * Returns high-level SPBE architecture statistics
   */
  .get("/overview", async ({ request }) => {
    const requestId = getRequestId(request);

    const [
      opdCount,
      probisCount,
      dataCount,
      appCount,
      infraCount,
      serviceCount,
      activeServices,
    ] = await Promise.all([
      prisma.opd.count(),
      prisma.businessProcess.count(),
      prisma.dataStandard.count(),
      prisma.application.count(),
      prisma.infrastructure.count(),
      prisma.service.count(),
      prisma.service.count({ where: { isActive: true } }),
    ]);

    return createSPLPResponse(
      {
        summary: {
          totalOpd: opdCount,
          totalBusinessProcesses: probisCount,
          totalDataStandards: dataCount,
          totalApplications: appCount,
          totalInfrastructure: infraCount,
          totalServices: serviceCount,
          activeServices,
        },
        lastUpdated: new Date().toISOString(),
      },
      requestId
    );
  })

  /**
   * GET /statistics/domains
   * Returns per-domain metrics
   */
  .get("/domains", async ({ request }) => {
    const requestId = getRequestId(request);

    // Domain 1: Business Process statistics
    const probisStats = await prisma.businessProcess.groupBy({
      by: ["level"],
      _count: { _all: true },
    });

    // Domain 2: Data statistics
    const dataStats = await prisma.dataStandard.groupBy({
      by: ["classification"],
      _count: { _all: true },
    });

    const validatedData = await prisma.dataStandard.count({
      where: { isValidated: true },
    });

    // Domain 3: Application statistics
    const appTypeStats = await prisma.application.groupBy({
      by: ["type"],
      _count: { _all: true },
    });

    const appStatusStats = await prisma.application.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    // Domain 4: Infrastructure statistics
    const infraTypeStats = await prisma.infrastructure.groupBy({
      by: ["type"],
      _count: { _all: true },
    });

    const infraLocationStats = await prisma.infrastructure.groupBy({
      by: ["location"],
      _count: { _all: true },
    });

    // Domain 5: Service statistics
    const serviceTypeStats = await prisma.service.groupBy({
      by: ["type"],
      _count: { _all: true },
    });

    // Build level distribution
    const levelLabels = ["Sektor", "Urusan", "Fungsi", "Sub-Fungsi"];
    const probisLevelDist: Record<string, number> = {};
    for (const stat of probisStats) {
      const label = levelLabels[stat.level - 1] || `Level ${stat.level}`;
      probisLevelDist[label] = stat._count._all;
    }

    // Build classification distribution
    const dataClassDist: Record<string, number> = {
      PUBLIC: 0,
      RESTRICTED: 0,
      SECRET: 0,
    };
    for (const stat of dataStats) {
      dataClassDist[stat.classification] = stat._count._all;
    }

    // Build app type distribution
    const appTypeDist: Record<string, number> = { UMUM: 0, KHUSUS: 0 };
    for (const stat of appTypeStats) {
      appTypeDist[stat.type] = stat._count._all;
    }

    // Build app status distribution
    const appStatusDist: Record<string, number> = {
      PLANNING: 0,
      DEVELOPMENT: 0,
      ACTIVE: 0,
      ARCHIVED: 0,
    };
    for (const stat of appStatusStats) {
      appStatusDist[stat.status] = stat._count._all;
    }

    // Build infra type distribution
    const infraTypeDist: Record<string, number> = {
      SERVER_PHYSICAL: 0,
      VIRTUAL_MACHINE: 0,
      CLOUD_SaaS: 0,
      CLOUD_IaaS: 0,
      NETWORK_DEVICE: 0,
    };
    for (const stat of infraTypeStats) {
      infraTypeDist[stat.type] = stat._count._all;
    }

    // Build infra location distribution
    const infraLocationDist: Record<string, number> = { PDN: 0, LOCAL: 0 };
    for (const stat of infraLocationStats) {
      infraLocationDist[stat.location] = stat._count._all;
    }

    // Build service type distribution
    const serviceTypeDist: Record<string, number> = {
      G2C: 0,
      G2B: 0,
      G2G: 0,
      G2E: 0,
    };
    for (const stat of serviceTypeStats) {
      serviceTypeDist[stat.type] = stat._count._all;
    }

    return createSPLPResponse(
      {
        domain1_probisBisnis: {
          name: "Arsitektur Proses Bisnis",
          byLevel: probisLevelDist,
        },
        domain2_data: {
          name: "Arsitektur Data",
          byClassification: dataClassDist,
          validatedCount: validatedData,
        },
        domain3_aplikasi: {
          name: "Arsitektur Aplikasi",
          byType: appTypeDist,
          byStatus: appStatusDist,
        },
        domain4_infrastruktur: {
          name: "Arsitektur Infrastruktur",
          byType: infraTypeDist,
          byLocation: infraLocationDist,
        },
        domain5_layanan: {
          name: "Arsitektur Layanan",
          byType: serviceTypeDist,
        },
      },
      requestId
    );
  })

  /**
   * GET /statistics/integration
   * Returns integration scores and recommendations
   */
  .get("/integration", async ({ request }) => {
    const requestId = getRequestId(request);

    // Count integration metrics
    const [
      servicesWithApp,
      servicesWithProbis,
      appsWithData,
      appsWithInfra,
      totalServices,
      totalApps,
    ] = await Promise.all([
      prisma.service.count({ where: { appId: { not: null } } }),
      prisma.service.count({ where: { probisId: { not: null } } }),
      prisma.application.count({
        where: { usedData: { some: {} } },
      }),
      prisma.application.count({
        where: { infrastructure: { some: {} } },
      }),
      prisma.service.count(),
      prisma.application.count(),
    ]);

    // Calculate integration scores
    const serviceAppScore =
      totalServices > 0 ? (servicesWithApp / totalServices) * 100 : 0;
    const serviceProbisScore =
      totalServices > 0 ? (servicesWithProbis / totalServices) * 100 : 0;
    const appDataScore = totalApps > 0 ? (appsWithData / totalApps) * 100 : 0;
    const appInfraScore = totalApps > 0 ? (appsWithInfra / totalApps) * 100 : 0;

    const overallScore =
      (serviceAppScore + serviceProbisScore + appDataScore + appInfraScore) / 4;

    // Generate recommendations
    const recommendations: string[] = [];
    if (serviceAppScore < 80) {
      recommendations.push(
        `${totalServices - servicesWithApp} layanan belum terhubung dengan aplikasi`
      );
    }
    if (serviceProbisScore < 80) {
      recommendations.push(
        `${totalServices - servicesWithProbis} layanan belum terhubung dengan proses bisnis`
      );
    }
    if (appDataScore < 80) {
      recommendations.push(
        `${totalApps - appsWithData} aplikasi belum memiliki definisi data`
      );
    }
    if (appInfraScore < 80) {
      recommendations.push(
        `${totalApps - appsWithInfra} aplikasi belum terhubung dengan infrastruktur`
      );
    }

    return createSPLPResponse(
      {
        scores: {
          serviceToApplication: Math.round(serviceAppScore * 10) / 10,
          serviceToProcess: Math.round(serviceProbisScore * 10) / 10,
          applicationToData: Math.round(appDataScore * 10) / 10,
          applicationToInfrastructure: Math.round(appInfraScore * 10) / 10,
          overall: Math.round(overallScore * 10) / 10,
        },
        metrics: {
          servicesWithApplication: servicesWithApp,
          servicesWithProcess: servicesWithProbis,
          applicationsWithData: appsWithData,
          applicationsWithInfrastructure: appsWithInfra,
          totalServices,
          totalApplications: totalApps,
        },
        recommendations,
        integrationLevel:
          overallScore >= 80
            ? "OPTIMAL"
            : overallScore >= 60
              ? "ADEQUATE"
              : overallScore >= 40
                ? "DEVELOPING"
                : "INITIAL",
      },
      requestId
    );
  })

  /**
   * GET /statistics/planning
   * Returns Peta Rencana (Roadmap) statistics
   */
  .get("/planning", async ({ request }) => {
    const requestId = getRequestId(request);

    const plans = await prisma.spbePlan.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { budget: true },
    });

    const plansByYear = await prisma.spbePlan.groupBy({
      by: ["year"],
      _count: { _all: true },
      _sum: { budget: true },
    });

    const plansByDomain = await prisma.spbePlan.groupBy({
      by: ["domain"],
      _count: { _all: true },
    });

    // Build status distribution
    const statusDist: Record<string, { count: number; budget: number }> = {};
    for (const plan of plans) {
      statusDist[plan.status] = {
        count: plan._count._all,
        budget: Number(plan._sum.budget || 0),
      };
    }

    // Build year distribution
    const yearDist: Record<number, { count: number; budget: number }> = {};
    for (const plan of plansByYear) {
      yearDist[plan.year] = {
        count: plan._count._all,
        budget: Number(plan._sum.budget || 0),
      };
    }

    // Build domain distribution
    const domainDist: Record<string, number> = {};
    for (const plan of plansByDomain) {
      domainDist[plan.domain] = plan._count._all;
    }

    // Calculate totals
    const totalPlans = plans.reduce((sum, p) => sum + p._count._all, 0);
    const totalBudget = plans.reduce(
      (sum, p) => sum + Number(p._sum.budget || 0),
      0
    );
    const completedPlans = statusDist.COMPLETED?.count ?? 0;
    const ongoingPlans = statusDist.ONGOING?.count ?? 0;

    return createSPLPResponse(
      {
        summary: {
          totalPlans,
          completedPlans,
          ongoingPlans,
          totalBudget,
          completionRate:
            totalPlans > 0
              ? Math.round((completedPlans / totalPlans) * 1000) / 10
              : 0,
        },
        byStatus: statusDist,
        byYear: yearDist,
        byDomain: domainDist,
      },
      requestId
    );
  });
