import { payloadStub } from '../stubs/payload.stub';

export const MockJwtService = jest.fn().mockReturnValue({
  verifyAsync: jest.fn(),
  signAsync: jest.fn(),
  decode: () => () => jest.fn(() => payloadStub()),
});
