import { Tokens } from '@app/common';
import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject('auth') private readonly authService: ClientProxy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (request['headers']['authorization']) {
      const accessToken = String(request['headers']['authorization']).replace('Bearer', '').trim();

      try {
        await firstValueFrom(
          this.authService.send<string, Pick<Tokens, 'accessToken'>>(
            { cmd: 'auth-verify-accessToken' },
            { accessToken: accessToken },
          ),
        );

        return true;
      } catch (error) {
        return false;
      }
    } else return false;
  }
}
