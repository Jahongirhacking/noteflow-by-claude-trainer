import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { comparePassword, hashPassword } from "../common/utils/password.util";
import { UserRole } from "../users/user-role.enum";
import { UserEntity } from "../users/user.entity";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { CurrentUser } from "./interfaces/current-user.interface";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const foundUser = await this.userService.findByEmail(dto.email);
    if (foundUser) throw new ConflictException();
    const { password, ...otherDto } = dto;
    const passwordHash = await hashPassword(dto.password);
    const user = this.userRepository.create({
      ...otherDto,
      passwordHash,
    });
    const savedUser = await this.userRepository.save(user);
    const { passwordHash: _, ...rest } = savedUser;
    return rest;
  }

  async validate(dto: LoginDto): Promise<CurrentUser | null> {
    try {
      const user = await this.userService.findByEmail(dto.email);
      if (!user) throw new Error();
      if (!(await comparePassword(dto.password, user.passwordHash)))
        return null;
      return {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
      };
    } catch {
      return null;
    }
  }

  async login(user: CurrentUser) {
    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        email: user.email,
      }),
    };
  }

  async getMe(user: CurrentUser) {
    const currentUser = await this.userService.findById(user.id);
    if (!currentUser) throw new NotFoundException();
    const { passwordHash, ...rest } = currentUser;
    return rest;
  }
}
