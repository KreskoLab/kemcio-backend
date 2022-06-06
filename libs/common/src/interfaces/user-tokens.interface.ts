export interface UserAndTokensI {
  userId: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}
