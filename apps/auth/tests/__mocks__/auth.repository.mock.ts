import { tokenIdStub } from '../stubs/token-id';

export const MockAuthRepository = jest.fn().mockReturnValue({
  findByTokenId: jest.fn().mockResolvedValue(tokenIdStub()),
});
