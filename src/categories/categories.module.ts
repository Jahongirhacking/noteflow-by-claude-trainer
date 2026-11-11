import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoryEntity } from "./category.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
})
export class CategoriesModule {}
