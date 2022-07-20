import { tokenStub } from '../stubs/token.stub';

export const MockAuthRepository = jest.fn().mockReturnValue({
  findByTokenId: jest.fn().mockResolvedValue(tokenStub()),
  updateOrCreate: jest.fn().mockImplementation(),
});
