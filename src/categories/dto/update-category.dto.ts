import { Transform } from "class-transformer";
import { IsOptional, IsString, Length, MaxLength } from "class-validator";

export class UpdateCategoryDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Length(1, 100)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;
}
