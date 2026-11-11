import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { UserEntity } from "../users/user.entity";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { password, ...otherDto } = dto;
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...otherDto,
      passwordHash,
    });
    const savedUser = await this.userRepository.save(user);
    const { passwordHash: pHash, ...rest } = savedUser;
    return rest;
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.userService.findByEmail(dto.email);
      if (!bcrypt.compare(dto.password, user.passwordHash))
        throw new UnauthorizedException("Invalid credintials");
      return {
        accessToken: this.jwtService.sign({
          sub: user.id,
        }),
      };
    } catch {
      throw new UnauthorizedException("Invalid credintials");
    }
  }
}
