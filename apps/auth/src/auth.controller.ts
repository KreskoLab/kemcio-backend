import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { TokenI } from '@app/common/interfaces/token.interface';
import { TokensI } from '@app/common/interfaces/tokens.interfaces';
import { UserAndTokensI } from '@app/common/interfaces/user-tokens.interface';
import { accessTokenI } from '@app/common';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'auth-tokens' })
  async authTokens(@Payload() data: UserAndTokensI): Promise<TokensI> {
    const { accessToken, refreshToken } = await this.authService.generateTokens({ userId: data.userId });

    const token: TokenI = {
      tokenId: this.authService.getRefreshTokenId(refreshToken),
      createdAt: new Date().toISOString(),
    };

    await this.authService.saveToken(token);

    return { accessToken, refreshToken };
  }

  @MessagePattern({ cmd: 'auth-verify-accessToken' })
  async verifyAccessToken(@Payload() data: accessTokenI): Promise<string> {
    const valid = await this.authService.verifyAccessToken(data.accessToken);

    if (valid) {
      const decodedToken = this.authService.decodeToken(data.accessToken);

      return decodedToken.userId;
    } else throw new RpcException({ code: 403, msg: 'Unauthorized' });
  }

  @MessagePattern({ cmd: 'auth-verifyTokens' })
  async verifyTokens(@Payload() data: TokensI): Promise<UserAndTokensI> {
    const validRefreshToken = await this.authService.verifyRefreshToken(data.refreshToken);
    const accessRefreshToken = await this.authService.verifyAccessToken(data.accessToken);

    if (validRefreshToken) {
      const refreshTokenId = this.authService.getRefreshTokenId(data.refreshToken);
      const token = await this.authService.findToken(refreshTokenId);

      if (token) {
        const validAccessToken = await this.authService.verifyAccessToken(data.accessToken);

        if (validAccessToken) {
          const decodedAccessToken = this.authService.decodeToken(data.accessToken);
          return { userId: decodedAccessToken.id };
        } else {
          const decodedRefreshToken = this.authService.decodeToken(data.refreshToken);
          const tokens: TokensI = await this.authService.generateTokens({ id: decodedRefreshToken.id });

          const token: TokenI = {
            tokenId: this.authService.getRefreshTokenId(tokens.refreshToken),
            createdAt: new Date().toISOString(),
          };

          await this.authService.saveToken(token);

          return { userId: decodedRefreshToken.id, tokens };
        }
      } else throw new RpcException({ code: 403, msg: 'Unauthorized' });
    } else throw new RpcException({ code: 403, msg: 'Unauthorized' });
  }
}
