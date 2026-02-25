
export interface UserResponse {
    id: number,
    login: string,
    email: string,
    inativo: boolean,
    pessoa: {
        nome: string,
        sexo: string,
        email: string,
        celular: number,
        telefone: number,
        tipo: string,
        nomeResumido: string,
        primeiroNome: string,
        nomeSocialOficial: string,
        idPessoa: number
    },
    idFoto: number,
    fotoUrl: string
}