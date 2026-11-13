import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ICurrentUser } from "../auth/interfaces/current-user.interface";
import { CategoryEntity } from "./category.entity";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}
  async postCategory(
    userId: ICurrentUser["id"],
    createCategoryDto: CreateCategoryDto,
  ) {
    const category = this.categoryRepository.create({
      userId,
      ...createCategoryDto,
    });
    return this.categoryRepository.save(category);
  }

  async getUserCategories(userId: ICurrentUser["id"]) {
    return this.categoryRepository.find({ where: { userId } });
  }

  async getUserCategoryById(userId: ICurrentUser["id"], categoryId: string) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category || category?.userId !== userId) throw new NotFoundException();
    return category;
  }

  async patchUserCategoryById(
    userId: ICurrentUser["id"],
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.getUserCategoryById(userId, categoryId);
    return this.categoryRepository.save({ ...category, ...updateCategoryDto });
  }

  async deleteCategory(userId: ICurrentUser["id"], categoryId: string) {
    const category = await this.getUserCategoryById(userId, categoryId);
    this.categoryRepository.remove(category);
  }
}
