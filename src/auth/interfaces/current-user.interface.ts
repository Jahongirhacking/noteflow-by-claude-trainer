import { UserRole } from "../../users/user-role.enum";

export interface ICurrentUser {
  id: string;
  email: string;
  role: UserRole;
}
