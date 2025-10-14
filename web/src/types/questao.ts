// interfaces/Questao.ts (crie este arquivo)
export interface Questao {
  id?: number;
  enunciado: string;
  alternativas: Record<string, string>;
  correta: string;
  justificativaRapida: string;
  justificativaDetalhada: string;
  justificativaAlternativasErradas: string;
  ano?: string;
  topico?: string;
  subtopico?: string;
  nivel?: string;
  userId?: number;
  createdAt?: string;
}
