export interface AuthResponse {
  // access_token: string; // estão sendo armazenados em cookies HttpOnly, então não precisamos disso no frontend
  // token_type: string;
  // refresh_token: string;
  // expires_in: number;
  // scope: string;
  // jti: string;
  foto: string;
  id_usuario: number;
  nome: string;
  DISCENTE: AuthDiscenteResponse[];
}

export interface AuthDiscenteResponse {
  matricula: number;
  idCurso: number;
  nivel: string;
  nome: string;
}