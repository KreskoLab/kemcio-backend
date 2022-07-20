import { Token } from 'apps/auth/src/schemas/token.schema';
import { tokenStub } from '../stubs/token.stub';

export class MockTokenModel {
  async create(): Promise<Token> {
    return tokenStub();
  }

  async findOne(): Promise<Token> {
    return tokenStub();
  }
}
