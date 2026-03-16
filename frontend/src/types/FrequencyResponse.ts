
export type FrequencyResponse = FrequencyResponseItem[]

export interface FrequencyResponseItem {
    data: string
    matriculaDiscente: number
    nomeDiscente: string
    qtdFaltas: number
    qtdHorarios: number
    urlFotoDiscente: string
}
