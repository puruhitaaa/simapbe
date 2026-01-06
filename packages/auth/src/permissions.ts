import { createAccessControl } from "better-auth/plugins/access";
import { statement } from "./definitions";

export { rolePermissions, statement } from "./definitions";

export const ac = createAccessControl(statement);
