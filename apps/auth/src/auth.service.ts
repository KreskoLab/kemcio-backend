import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokensI } from '@app/common/interfaces/tokens.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { TokenI } from '@app/common/interfaces/token.interface';
import { AuthRepository } from './auth.repository';
import { Token } from './schemas/token.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {}

  async generateAccessToken(payload: object): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_LIFETIME'),
    });
  }

  async generateRefreshToken(payload: object): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_LIFETIME'),
      jwtid: uuidv4(),
    });
  }

  async generateTokens(payload: object): Promise<TokensI> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      });

      return true;
    } catch (err) {
      return false;
    }
  }

  async verifyRefreshToken(token: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      return true;
    } catch (err) {
      return false;
    }
  }

  async saveToken(token: TokenI): Promise<void> {
    this.authRepository.updateOrCreate(token);
  }

  async findToken(tokenId: string): Promise<Token> {
    return this.authRepository.findByTokenId(tokenId);
  }

  async deleteToken(tokenId: string): Promise<void> {
    this.authRepository.remove(tokenId);
  }

  getRefreshTokenId(token: string): string {
    const decoced = this.jwtService.decode(token);
    return decoced['jti'];
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }
}
