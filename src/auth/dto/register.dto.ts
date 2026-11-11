import { IsEmail, IsString, Length, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @Length(1, 100)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
