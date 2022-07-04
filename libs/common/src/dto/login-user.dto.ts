import { IsNotEmpty, IsString, IsDefined } from 'class-validator';

export class LoginUserDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  login: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  password: string;
}
