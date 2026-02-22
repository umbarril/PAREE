export interface CoursePlanResponse {
  metodologia: number;
  procedimentoAvaliacaoAprendizagem: number;
  horarioAtendimento: string;
  objetivos: string;
  conteudo: string;
  habilidadesCompetencias: string;
  exameFinal: string;
  reposicao: string;
  horaExameFinal: string;
  horaReposicao: string;
  topicosDeAula: LessonTopic[];
  referencias: ReferenceMaterial[];
  avaliacoes: Avaliacao[];
}

export interface LessonTopic {
    idTopicoAula: number;
    descricao: string;
    dataInicio: string;
    dataFim: string;
    conteudo: string;
    dataCadastro: string;
    arquivos: [],
    tarefas: [],
    cancelada: boolean;
}

export interface ReferenceMaterial {
    nomePessoa: string;
    tipo: string | null;
    titulo: string | null;
    descricao: string | null;
    autor: string | null;
    editora: string | null;
    edicao: string | null;
    ano: string | null,
    url: string | null;
    tipoIndicacao: number;
}

export interface Avaliacao {
    dataRealizacao: string;
    horario: string;
    descricao: string;
    ativo: boolean;
    observacoes: string | null;
}