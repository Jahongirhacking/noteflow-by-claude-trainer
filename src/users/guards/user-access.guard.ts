import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { isUUID } from "class-validator";
import type { Request } from "express";
import { Observable } from "rxjs";
import { CurrentUser } from "../../auth/interfaces/current-user.interface";
import { UserRole } from "../user-role.enum";

@Injectable()
export class UserAccessGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as CurrentUser;
    const reqUserId = req.params.id;
    if (!isUUID(reqUserId)) throw new BadRequestException();
    if (!user) return false;
    if (
      user.role === UserRole.ADMIN ||
      (user.role === UserRole.USER && user.id === reqUserId)
    )
      return true;
    throw new ForbiddenException();
  }
}
