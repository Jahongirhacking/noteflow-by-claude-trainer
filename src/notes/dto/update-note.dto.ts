import { Transform } from "class-transformer";
import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from "class-validator";

export class UpdateNoteDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Length(1, 200)
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(10_000)
  @IsOptional()
  content?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
