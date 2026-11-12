import { UserRole } from "../../users/user-role.enum";

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
}
