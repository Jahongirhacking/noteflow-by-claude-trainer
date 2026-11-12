import { IsEmail, IsString, Length, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @Length(1, 100)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message: "Invalid password",
  })
  password: string;
}
