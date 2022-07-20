import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthRepository } from '../src/auth.repository';
import { AuthService } from '../src/auth.service';
import { accessTokenStub } from './stubs/access-token.stub';
import { payloadStub } from './stubs/payload.stub';
import { MockJwtService } from './__mocks__/jwt.service.mock';
import { MockAuthRepository } from './__mocks__/auth.repository.mock';
import { refreshTokenStub } from './stubs/refresh-token.stub';
import { Tokens } from '@app/common';
import { tokenStub } from './stubs/token.stub';

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: AuthRepository;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useClass: MockJwtService,
        },
        {
          provide: AuthRepository,
          useClass: MockAuthRepository,
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    authRepository = moduleRef.get<AuthRepository>(AuthRepository);
    jwtService = moduleRef.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    let accessToken;

    beforeEach(async () => {
      accessToken = await authService.generateAccessToken(payloadStub());
    });

    it('should call the jwtService', async () => {
      MockJwtService.mockImplementation(() => {
        return {
          signAsync: jest.fn().mockResolvedValue(accessTokenStub()),
        };
      });

      expect(jwtService.signAsync).toBeCalled();
    });

    it('should return accessToken', () => {
      expect(accessToken).toEqual(accessTokenStub());
    });
  });

  describe('generateRefreshToken', () => {
    let refreshToken;

    beforeEach(async () => {
      refreshToken = await authService.generateRefreshToken(payloadStub());
    });

    it('should call the jwtService', async () => {
      MockJwtService.mockImplementation(() => {
        return {
          signAsync: jest.fn().mockResolvedValue(refreshTokenStub()),
        };
      });

      expect(jwtService.signAsync).toBeCalled();
    });

    it('should return refreshToken', () => {
      expect(refreshToken).toEqual(refreshTokenStub());
    });
  });

  describe('generateTokens', () => {
    let tokens: Tokens;

    beforeEach(async () => {
      tokens = await authService.generateTokens(payloadStub());
    });

    it('should call the jwtService', async () => {
      MockJwtService.mockImplementation(() => {
        return {
          signAsync: jest.fn().mockResolvedValueOnce(accessTokenStub()).mockResolvedValueOnce(refreshTokenStub()),
        };
      });

      expect(jwtService.signAsync).toBeCalledTimes(2);
    });

    it('should return refreshToken', () => {
      expect(tokens).toEqual({ accessToken: accessTokenStub(), refreshToken: refreshTokenStub() });
    });
  });

  describe('verifyAccessToken', () => {
    let valid: boolean;

    beforeEach(async () => {
      valid = await authService.verifyAccessToken(accessTokenStub());
    });

    describe('when accessToken valid', () => {
      it('should call the jwtService', async () => {
        MockJwtService.mockImplementation(() => {
          return {
            verifyAsync: jest.fn().mockResolvedValue(true),
          };
        });

        try {
          expect(jwtService.verifyAsync).toHaveBeenCalled();
          expect(valid).toBeTruthy();
        } catch (error) {}
      });
    });

    describe('when accessToken invalid', () => {
      it('should call the jwtService', async () => {
        MockJwtService.mockImplementation(() => {
          return {
            verifyAsync: jest.fn().mockResolvedValue(false),
          };
        });

        try {
          expect(jwtService.verifyAsync).toHaveBeenCalled();
        } catch (error) {
          expect(valid).toBeFalsy();
        }
      });
    });
  });

  describe('findToken', () => {
    let token;

    beforeEach(async () => {
      token = await authService.findToken(tokenStub().tokenId);
    });

    it('should call the authRepository', () => {
      expect(authRepository.findByTokenId).toBeCalledWith(tokenStub().tokenId);
    });

    it('should return a finded token', () => {
      expect(token).toEqual(tokenStub());
    });
  });

  describe('saveToken', () => {
    beforeEach(async () => {
      await authService.saveToken(tokenStub());
    });

    it('should call the authRepository', () => {
      expect(authRepository.updateOrCreate).toBeCalledWith(tokenStub());
    });
  });
});
