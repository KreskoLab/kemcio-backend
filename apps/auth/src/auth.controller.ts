import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { Tokens } from '@app/common/interfaces/tokens.interfaces';
import { Token } from './schemas/token.schema';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'auth-tokens' })
  async generateTokens(@Payload() data: { _id: string }): Promise<Tokens> {
    const { accessToken, refreshToken } = await this.authService.generateTokens({ _id: data._id });

    const token: Token = {
      tokenId: this.authService.getRefreshTokenId(refreshToken),
      createdAt: new Date(),
    };

    await this.authService.saveToken(token);

    return { accessToken, refreshToken };
  }

  @MessagePattern({ cmd: 'auth-verify-accessToken' })
  async verifyAccessToken(@Payload() data: Pick<Tokens, 'accessToken'>): Promise<string> {
    const valid = await this.authService.verifyAccessToken(data.accessToken);

    if (valid) {
      const decodedToken = this.authService.decodeToken(data.accessToken);
      return decodedToken._id;
    } else throw new RpcException({ code: 403, msg: 'Unauthorized' });
  }

  @MessagePattern({ cmd: 'auth-verify-refreshToken' })
  async verifyTokens(@Payload() data: Tokens): Promise<Pick<Tokens, 'accessToken'>> {
    const validRefreshToken = await this.authService.verifyRefreshToken(data.refreshToken);

    if (validRefreshToken) {
      const refreshTokenId = this.authService.getRefreshTokenId(data.refreshToken);
      const tokenId = await this.authService.findToken(refreshTokenId);

      if (tokenId) {
        const decodedRefreshToken = this.authService.decodeToken(data.refreshToken);
        const newAccessToken = await this.authService.generateAccessToken({ _id: decodedRefreshToken._id });

        return { accessToken: newAccessToken };
      } else throw new RpcException({ code: 403, msg: 'Unauthorized' });
    } else throw new RpcException({ code: 403, msg: 'Unauthorized' });
  }
}
