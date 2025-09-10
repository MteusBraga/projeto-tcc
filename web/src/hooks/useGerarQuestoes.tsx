// hooks/useGerarQuestoes.ts
"use client";

import { useMutation } from "@tanstack/react-query";

interface Questao {
  enunciado: string;
  alternativas: Record<string, string>;
  correta: string;
  justificativaRapida: string;
  justificativaDetalhada: string;
  justificativaAlternativasErradas: Record<string, string>;
}

interface Params {
  quantidade: number;
  ano: string;
  topico: string;
  subtopico: string[];
  nivel: string;
}

const urlDev = "http://localhost:3001/generate";

export function useGerarQuestoes() {
  return useMutation<Questao[], Error, Params>({
    mutationFn: async (params: Params) => {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const res = await fetch(urlDev, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...params,
          subtopico: params.subtopico.join(", "),
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      if (!res.ok) throw new Error("Erro ao gerar questões");

      return res.json();
    },
  });
}
