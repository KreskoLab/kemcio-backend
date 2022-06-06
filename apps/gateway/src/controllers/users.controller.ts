import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Res,
  UseFilters,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { LoginUserDto } from '@app/common/dto/login-user.dto';
import { CreateUserDto } from '@app/common/dto/create-user.dto';
import { UserI } from '@app/common/interfaces/user.interface';
import { TokensI } from '@app/common/interfaces/tokens.interfaces';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AllExceptionsFilter } from '../rpc-exception.filter';

@Controller('users')
export class UsersController {
  constructor(
    @Inject('users') private readonly userService: ClientProxy,
    @Inject('auth') private readonly authService: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @UseFilters(new AllExceptionsFilter())
  async login(@Body() loginDto: LoginUserDto, @Res({ passthrough: true }) response: Response): Promise<string> {
    const user: UserI = await firstValueFrom(this.userService.send({ cmd: 'user-login' }, loginDto));
    const tokens: TokensI = await firstValueFrom(this.authService.send({ cmd: 'auth-tokens' }, { userId: user._id }));

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: this.configService.get<number>('REFRESH_TOKEN_LIFETIME'),
      domain: this.configService.get<string>('FRONTEND_DOMAIN'),
    });

    return tokens.accessToken;
  }

  @Post('registration')
  @UseFilters(new AllExceptionsFilter())
  async registration(
    @Body() registrationDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const user: UserI = await firstValueFrom(this.userService.send({ cmd: 'user-registration' }, registrationDto));
    const tokens: TokensI = await firstValueFrom(this.authService.send({ cmd: 'auth-tokens' }, { userId: user._id }));

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: this.configService.get<number>('REFRESH_TOKEN_LIFETIME'),
      domain: this.configService.get<string>('FRONTEND_DOMAIN'),
    });

    return tokens.accessToken;
  }

  @Get('me')
  async getUserData(@Headers() headers: object): Promise<UserI> {
    if (headers['authorization']) {
      const accessToken = headers['authorization'].replace('Bearer', '').trim();

      const userId: string = await firstValueFrom(
        this.authService.send({ cmd: 'auth-verify-accessToken' }, { accessToken }),
      );

      const user: UserI = await firstValueFrom(this.userService.send({ cmd: 'user-data' }, userId));

      if (user) return user;
      else throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }
}
