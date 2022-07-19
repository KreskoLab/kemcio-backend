import {
  Body,
  Controller,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseFilters,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { LoginUserDto } from '@app/common/dto/login-user.dto';
import { User } from '@app/common/interfaces/user.interface';
import { Tokens } from '@app/common/interfaces/tokens.interfaces';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AllExceptionsFilter } from '../rpc-exception.filter';
import { AUTH_CMD, AUTH_ROUTES, USERS_CMD, USERS_ROUTES } from '@app/common';

type UserPayload = Pick<User, '_id'>;

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(USERS_ROUTES.MAIN) private readonly userService: ClientProxy,
    @Inject(AUTH_ROUTES.MAIN) private readonly authService: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @UseFilters(new AllExceptionsFilter())
  async login(@Body() loginDto: LoginUserDto, @Res({ passthrough: true }) response: Response): Promise<string> {
    const user = await firstValueFrom<User>(this.userService.send({ cmd: USERS_CMD.LOGIN }, loginDto));
    const tokens = await firstValueFrom(
      this.authService.send<Tokens, UserPayload>({ cmd: AUTH_CMD.TOKENS }, { _id: user._id }),
    );

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: this.configService.get<number>('REFRESH_TOKEN_LIFETIME'),
      domain: this.configService.get<string>('FRONTEND_DOMAIN'),
    });

    return tokens.accessToken;
  }

  @Post('logout')
  @UseFilters(new AllExceptionsFilter())
  async logout(@Res({ passthrough: true }) response: Response): Promise<string> {
    response.cookie('refreshToken', '', {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1,
      domain: this.configService.get<string>('FRONTEND_DOMAIN'),
    });

    return 'bye';
  }

  @Post('me')
  @UseFilters(new AllExceptionsFilter())
  async getUserData(@Headers() headers: object): Promise<User> {
    if (headers['authorization']) {
      const accessToken = headers['authorization'].replace('Bearer', '').trim();

      const userId = await firstValueFrom(
        this.authService.send<string, Pick<Tokens, 'accessToken'>>(
          { cmd: AUTH_CMD.VERIFY_ACCESS_TOKEN },
          { accessToken: accessToken },
        ),
      );

      const user = await firstValueFrom(this.userService.send<User, string>({ cmd: USERS_CMD.USER }, userId));

      if (user) return user;
      else throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    } else throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  @Post('token')
  @UseFilters(new AllExceptionsFilter())
  async generateTokens(@Req() request: Request): Promise<string> {
    if (request.cookies['refreshToken']) {
      const refreshToken = request.cookies['refreshToken'].replace('Bearer', '').trim();

      const res = await firstValueFrom(
        this.authService.send<Pick<Tokens, 'accessToken'>, Pick<Tokens, 'refreshToken'>>(
          { cmd: AUTH_CMD.VERIFY_REFRESH_TOKEN },
          { refreshToken: refreshToken },
        ),
      );

      return res.accessToken;
    } else throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
  }
}
