import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AuthRepository } from '../src/auth.repository';
import { Token, TokenSchema } from '../src/schemas/token.schema';
import { tokenStub } from './stubs/token.stub';
import { MockTokenModel } from './__mocks__/token.model.mock';

describe('AuthRepository', () => {
  let authRepository: AuthRepository;
  let tokenModel: MockTokenModel;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthRepository,
        {
          provide: getModelToken(Token.name),
          useClass: MockTokenModel,
        },
      ],
    }).compile();

    authRepository = moduleRef.get<AuthRepository>(AuthRepository);
    tokenModel = moduleRef.get<MockTokenModel>(getModelToken(Token.name));

    jest.clearAllMocks();
  });

  describe('updateOrCreate', () => {
    let token: Token;

    beforeEach(async () => {
      jest.spyOn(tokenModel, 'create');
      token = await authRepository.updateOrCreate(tokenStub());
    });

    it('should call the tokenModel', () => {
      const { createdAt, tokenId } = tokenStub();
      expect(tokenModel.create).toBeCalledWith({ createdAt, tokenId });
    });

    it('should return a created token', () => {
      expect(token).toEqual(tokenStub());
    });
  });

  describe('findByTokenId', () => {
    let token: Token;

    beforeEach(async () => {
      jest.spyOn(tokenModel, 'findOne');
      token = await authRepository.findByTokenId(tokenStub()._id);
    });

    it('should call the tokenModel', () => {
      expect(tokenModel.findOne).toBeCalledWith({ tokenId: tokenStub()._id });
    });

    it('should return a finded token', () => {
      expect(token).toEqual(tokenStub());
    });
  });
});
