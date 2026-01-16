export interface HorarioTurma {
  dia: string;
  horaInicio: string;
  horaFim: string;
  dataInicio: string;
  dataFim: string;
}

export interface Turma {
  nome: string;
  local: string;
  codigoTurma: string;
  horario: string;
  ano: number;
  periodo: number;
  idTurma: number;
  horarioTurma: HorarioTurma[];
  inicio: string;
  fim: string;
  nivel: string;
  idDisciplina: number | null;
  docentes: string[] | null;
}
