import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserEntity } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    return user;
  }

  async getOneUser(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException();
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return null;
    return user;
  }

  async getUsers() {
    return this.userRepository.find({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
  }

  async patchUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException();
    const { passwordHash, ...savedUser } = await this.userRepository.save({
      ...user,
      ...updateUserDto,
    });
    return savedUser;
  }
}
