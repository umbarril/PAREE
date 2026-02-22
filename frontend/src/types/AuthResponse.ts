export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  foto: string;
  id_usuario: number;
  nome: string;
  jti: string;
  DISCENTE: AuthDiscenteResponse[];
}

export interface AuthDiscenteResponse {
  matricula: number;
  idCurso: number;
  nivel: string;
  nome: string;
}