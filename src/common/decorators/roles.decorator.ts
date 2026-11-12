import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../users/user-role.enum";

export const ROLES_KEY = Symbol("roles");

export const Roles = (...args: UserRole[]) => SetMetadata(ROLES_KEY, args);
