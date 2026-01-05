import prisma from "@simapbe/db";
import { env } from "@simapbe/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },

  // SPBE Role-Based Access Control
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "OPERATOR",
        input: false, // Prevent users from self-assigning roles
      },
      opdId: {
        type: "string",
        required: false,
        input: false, // Assigned by admin only
      },
    },
  },

  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [],
});
