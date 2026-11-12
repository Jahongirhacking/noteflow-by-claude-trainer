import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class LocalAuthGuard extends AuthGuard("local") {
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (info?.message === "Missing credentials")
      throw new BadRequestException(info.message);
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    return user;
  }
}
