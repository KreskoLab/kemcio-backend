import { Token } from 'apps/auth/src/schemas/token.schema';

export const tokenStub = (): Token => {
  return {
    _id: '1234567',
    tokenId: 'asdsarqwer324214',
    createdAt: new Date('2022-07-20'),
  };
};
