import { IsString, Length } from "class-validator";

export class UpdateUserDto {
  @IsString()
  @Length(1, 100)
  fullName: string;
}
