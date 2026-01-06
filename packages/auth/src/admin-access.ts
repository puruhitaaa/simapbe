import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements as adminDefaultStatements,
  adminAc as adminPluginAc,
} from "better-auth/plugins/admin/access";

const statement = {
  ...adminDefaultStatements,
} as const;

export const adminAccessControl = createAccessControl(statement);

const noPermissions = adminAccessControl.newRole({
  user: [],
  session: [],
});

export const adminPluginRoles = {
  SUPER_ADMIN: adminAccessControl.newRole({
    ...adminPluginAc.statements,
  }),
  OPERATOR: noPermissions,
  AUDITOR: noPermissions,
  LEADER: noPermissions,
} as const;
