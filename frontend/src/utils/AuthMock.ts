import type { AuthResponse } from "../types/AuthResponse";

export const AuthResponseMock: AuthResponse = {
  access_token: "mock_access_token",
  token_type: "Bearer",
  refresh_token: "mock_refresh_token",
  expires_in: 3600,
  scope: "read write",
  foto: "mock_photo_url",
  id_usuario: 123,
  nome: "Mock User",
  jti: "mock_jti",
  DISCENTE: [],
};