// hooks/useGerarQuestoes.ts
"use client";

import { useMutation } from "@tanstack/react-query";

interface Questao {
  enunciado: string;
  alternativas: Record<string, string>;
  correta: string;
  justificativa: string;
}

interface Params {
  quantidade: number;
  ano: string;
  topico: string;
  subtopico: string[];
  modelo: string;
}

export function useGerarQuestoes() {
  return useMutation<Questao[], Error, Params>({
    mutationFn: async (params: Params) => {
      const res = await fetch("http://localhost:3001/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Erro ao gerar questões");
      return res.json();
    },
  });
}
