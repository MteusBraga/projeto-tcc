// hooks/useGerarQuestoes.ts
"use client";

import { Questao } from "@/types/questao";
import { urldev, urlprod } from "@/utils/url";
import { useMutation } from "@tanstack/react-query";

interface Params {
  quantidade: number;
  ano: string;
  topico: string;
  subtopico: string[];
  nivel: string;
}

export function useGerarQuestoes() {
  return useMutation<Questao[], Error, Params>({
    mutationFn: async (params: Params) => {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const res = await fetch(`${urlprod}/generate`, {
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
        window.location.href = "/login";
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      if (!res.ok) throw new Error("Erro ao gerar questões");

      const data = await res.json();
      return data as Questao[];
    },
  });
}
