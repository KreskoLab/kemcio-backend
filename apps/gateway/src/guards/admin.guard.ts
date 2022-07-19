import { ROLES, Tokens } from '@app/common';
import { Injectable, CanActivate, ExecutionContext, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/schemas/user.schema';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject('auth') private readonly authService: ClientProxy,
    @Inject('users') private readonly usersService: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (request['headers']['authorization']) {
      const accessToken = String(request['headers']['authorization']).replace('Bearer', '').trim();

      try {
        const userId = await firstValueFrom(
          this.authService.send<string, Pick<Tokens, 'accessToken'>>(
            { cmd: 'auth-verify-accessToken' },
            { accessToken: accessToken },
          ),
        );

        const user = await firstValueFrom(this.usersService.send<User, string>({ cmd: 'user-data' }, userId));

        switch (user.role) {
          case ROLES.ADMIN:
            return true;

          default:
            throw new HttpException('У вас немає доступу', HttpStatus.FORBIDDEN);
        }
      } catch (error) {
        throw new HttpException('У вас немає доступу', HttpStatus.FORBIDDEN);
      }
    } else throw new HttpException('У вас немає доступу', HttpStatus.FORBIDDEN);
  }
}
