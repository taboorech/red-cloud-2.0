export interface ICredentials {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string;
  token_type?: string | null;
  expiry_date?: number | null;
  password?: string | null;
  is_internal_encrypted?: boolean;
}

export interface JwtPayload {
  id: number;
  email: string;
}

export interface IInternalTokens {
  accessToken: string;
  refreshToken: string;
}
