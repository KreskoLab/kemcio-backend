import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  login: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  password: string;
}
