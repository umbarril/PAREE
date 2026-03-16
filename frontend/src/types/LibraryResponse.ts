export type LibraryResponse = LbiraryResponseItem[];

export interface LbiraryResponseItem {
  dataEmprestimo: string; // dd/MM/yyyy
  prazo: string;
  idTipoEmprestimo: number; // ???
  podeRenovar: boolean;
  biblioteca: string; // "Biblioteca Setorial do CCAE",
  codigoBarras: string;
  titulo: string;
  ano: string; // yyyy.
  id: number;
  atrasado: boolean;
}