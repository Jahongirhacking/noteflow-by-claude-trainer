import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserAccessGuard } from "./guards/user-access.guard";
import { UserRole } from "./user-role.enum";
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  @UseGuards(UserAccessGuard)
  @Get(":id")
  getOneUser(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.getOneUser(id);
  }

  @UseGuards(UserAccessGuard)
  @Patch(":id")
  patchUser(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.patchUser(id, body);
  }
}
