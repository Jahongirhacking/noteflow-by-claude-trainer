import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserRole } from "../../users/user-role.enum";
import { UsersService } from "../../users/users.service";
import { ICurrentUser } from "../interfaces/current-user.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: any): Promise<ICurrentUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException("Invalid user");
    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    };
  }
}
