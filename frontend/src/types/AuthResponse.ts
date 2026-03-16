export interface AuthResponse {
  // access_token: string; // estão sendo armazenados em cookies HttpOnly, então não precisamos disso no frontend
  // token_type: string;
  // refresh_token: string;
  // expires_in: number;
  // scope: string;
  // jti: string;
  foto: string;
  id_usuario: number;
  nome: string; // nome do usuário
  DISCENTE: AuthDiscenteResponse[]; // vínculos ativos e não ativos
}

export interface AuthDiscenteResponse {
  matricula: number;
  idCurso: number;
  nivel: string; // "G" ou "M", ou similar
  nome: string; // nome do vínculo em CAPS
}