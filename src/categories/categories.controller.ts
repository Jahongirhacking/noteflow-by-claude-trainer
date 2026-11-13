import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ICurrentUser } from "../auth/interfaces/current-user.interface";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@UseGuards(JwtAuthGuard)
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  postCategory(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Body() body: CreateCategoryDto,
  ) {
    return this.categoriesService.postCategory(userId, body);
  }

  @Get()
  getCategories(@CurrentUser("id") userId: ICurrentUser["id"]) {
    return this.categoriesService.getUserCategories(userId);
  }

  @Get(":id")
  getOneCategory(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Param("id", ParseUUIDPipe) categoryId: string,
  ) {
    return this.categoriesService.getUserCategoryById(userId, categoryId);
  }

  @Patch(":id")
  patchOneCategory(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Param("id", ParseUUIDPipe) categoryId: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.categoriesService.patchUserCategoryById(
      userId,
      categoryId,
      body,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  deleteCategory(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Param("id") categoryId: string,
  ) {
    return this.categoriesService.deleteCategory(userId, categoryId);
  }
}
