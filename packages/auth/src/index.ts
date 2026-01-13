import prisma from "@simapbe/db";
import { env } from "@simapbe/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { adminAccessControl, adminPluginRoles } from "./admin-access";

/**
 * User Role definitions for SPBE RBAC
 * Ref: Perpres 132/2022 - Domain Keamanan SPBE
 */
export type UserRole = "SUPER_ADMIN" | "OPERATOR" | "AUDITOR" | "LEADER";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [
    env.CORS_ORIGIN,
    // Add production Vercel URLs here
    ...(env.NODE_ENV === "production" && env.VERCEL_URL
      ? [`https://${env.VERCEL_URL}`]
      : []),
  ],
  emailAndPassword: {
    enabled: true,
  },

  // Extend user schema with RBAC fields
  // These map to the Prisma User model fields (role, opdId)
  user: {
    additionalFields: {
      // Role-Based Access Control
      role: {
        type: "string",
        required: false,
        defaultValue: "OPERATOR",
        input: false, // Prevent users from setting their own role during signup
      },
      // Multi-tenancy: Link user to their OPD
      opdId: {
        type: "string",
        required: false,
        input: false, // OPD assignment is done by Super Admin
      },
    },
  },

  advanced: {
    defaultCookieAttributes: {
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      secure: env.NODE_ENV === "production",
      httpOnly: true,
    },
  },

  // Plugins
  plugins: [
    // Admin plugin for user management
    // Only SUPER_ADMIN can perform admin operations (listUsers, setRole, etc.)
    admin({
      defaultRole: "OPERATOR",
      ac: adminAccessControl,
      roles: adminPluginRoles,
    }),
  ],
});

// Export auth types for use in API and frontend
export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
