import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { validate } from "class-validator";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
import { LoginDto } from "../dto/login.dto";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "local") {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: "email",
      passwordField: "password",
    });
  }

  async validate(email: string, password: string) {
    const credentials = Object.assign(new LoginDto(), {
      email,
      password,
    });

    const errors = await validate(credentials);

    if (errors.length) {
      throw new BadRequestException(errors);
    }
    const user = await this.authService.validate({ email, password });
    if (!user) throw new UnauthorizedException("Invalid credintials");
    return user;
  }
}
