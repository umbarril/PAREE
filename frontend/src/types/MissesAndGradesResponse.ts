export interface MissesAndGradesResponse {
    idTurma: number
    idMatriculaComponente: number
    notasPorUnidade: NotaPorUnidade[]
    mediaFinal: number | null
    numeroDeFaltas: number | null
    situacao: string
    recuperacao: number | null
}

export interface NotaPorUnidade {
    unidade: number
    nota: number
}

export const MATRICULADO = "MATRICULADO"

export const MOCK_MISSES_AND_GRADES_RESPONSE: MissesAndGradesResponse = {
    idTurma: 123,
    idMatriculaComponente: 456,
    notasPorUnidade: [
        { unidade: 1, nota: 7.5 },
        { unidade: 2, nota: 8.0 },
        { unidade: 3, nota: 6.0 },
        { unidade: 4, nota: 9.0 }
    ],
    mediaFinal: null,
    numeroDeFaltas: null,
    situacao: MATRICULADO,
    recuperacao: null
}
