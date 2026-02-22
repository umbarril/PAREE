// https://api.ufpb.br/sigaa/mobile/turma/364649/discentes
export interface StudentResponse {
    matricula: number;
    urlFoto: string | null;
    situacaoMatricula: string;
    email: string;
    curso: string;
    nome: string;
}