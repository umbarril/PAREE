export interface MissesAndGradesResponse {
    idTurma: number
    idMatriculaComponente: number
    notasPorUnidade: {
        1: number | null
        2: number | null
        3: number | null
        // 4: number | null
    }
    mediaFinal: number | null
    numeroDeFaltas: number | null
    situacao: string
    recuperacao: number | null
}
export const MATRICULADO = "MATRICULADO"

export const MOCK_MISSES_AND_GRADES_RESPONSE: MissesAndGradesResponse = {
    idTurma: 123,
    idMatriculaComponente: 456,
    notasPorUnidade: {
        1: null,
        2: null,
        3: null,
        // 4: null
    },
    mediaFinal: null,
    numeroDeFaltas: null,
    situacao: MATRICULADO,
    recuperacao: null
}
