import { Transform } from "class-transformer";
import { IsOptional, IsString, Length, MaxLength } from "class-validator";

export class CreateCategoryDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;
}
