// app/page.tsx
"use client";

import { useState } from "react";

// Dados mockados dos filtros
const filtrosMock = {
  ano: ["1º ano", "2º ano", "3º ano"],
  unidade: ["I", "II", "III", "IV"],
  topico: ["Conjuntos numéricos", "Funções", "Geometria"],
  subTopico: [
    "Conjunto vazio, unitário e universo",
    "Subconjuntos",
    "Operações com conjuntos",
  ],
};

// Dados mockados das questões
const questoesMock = [
  {
    enunciado:
      "Com relação à Lei Orçamentária Anual (LOA), quais são os prazos para envio e aprovação?",
    alternativas: {
      A: "Envio até 31 de agosto e aprovação até o encerramento da sessão legislativa.",
      B: "Envio até 15 de agosto e aprovação até 15 de dezembro.",
      C: "Envio até 15 de abril e aprovação até 30 de junho.",
      D: "Envio até 15 de abril e aprovação até o encerramento da sessão legislativa.",
      E: "Envio até 1º de janeiro e aprovação até 31 de março.",
    },
    correta: "A",
    justificativa:
      "Segundo a Constituição Federal, a LOA deve ser enviada até 31 de agosto e aprovada até o fim da sessão legislativa.",
  },
  {
    enunciado: "Qual é o conjunto universo na teoria dos conjuntos?",
    alternativas: {
      A: "É o conjunto formado apenas pelo zero.",
      B: "É o conjunto que contém todos os elementos em consideração.",
      C: "É o conjunto vazio.",
      D: "É um subconjunto próprio de outro conjunto.",
      E: "É um conjunto unitário.",
    },
    correta: "B",
    justificativa:
      "O conjunto universo é o que contém todos os elementos de referência em um determinado contexto.",
  },
];

export default function Questoes() {
  const [filtros, setFiltros] = useState({
    ano: "",
    unidade: "",
    topico: "",
    subTopico: "",
  });
  const handleFiltroChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    campo: string
  ) => {
    console.log(filtros);
    setFiltros({ ...filtros, [campo]: e.target.value });
  };

  // Aqui futuramente você pode filtrar as questões com base nos filtros
  const questoesFiltradas = questoesMock;

  return (
    <div className="p-6">
      {/* Filtros */}
      <div className="grid grid-cols-5 gap-4 bg-base-200 p-4 rounded-xl shadow">
        <select
          className="select select-bordered"
          value={filtros.ano}
          onChange={(e) => handleFiltroChange(e, "ano")}
        >
          <option value="">Ano</option>
          {filtrosMock.ano.map((a, i) => (
            <option key={i}>{a}</option>
          ))}
        </select>

        <select
          className="select select-bordered"
          value={filtros.unidade}
          onChange={(e) => handleFiltroChange(e, "unidade")}
        >
          <option value="">Unidade</option>
          {filtrosMock.unidade.map((u, i) => (
            <option key={i}>{u}</option>
          ))}
        </select>

        <select
          className="select select-bordered"
          value={filtros.topico}
          onChange={(e) => handleFiltroChange(e, "topico")}
        >
          <option value="">Tópico</option>
          {filtrosMock.topico.map((t, i) => (
            <option key={i}>{t}</option>
          ))}
        </select>

        <select
          className="select select-bordered"
          value={filtros.subTopico}
          onChange={(e) => handleFiltroChange(e, "subTopico")}
        >
          <option value="">Subtópico</option>
          {filtrosMock.subTopico.map((s, i) => (
            <option key={i}>{s}</option>
          ))}
        </select>

        <button className="btn btn-primary">Filtrar</button>
      </div>

      {/* Lista de Questões */}
      <div className="mt-6 space-y-6">
        {questoesFiltradas.map((q, idx) => (
          <div
            key={idx}
            className="card bg-base-100 shadow-md border border-base-300"
          >
            <div className="card-body">
              <h2 className="card-title">Questão {idx + 1}</h2>
              <p className="mb-4">{q.enunciado}</p>

              <div className="space-y-2">
                {Object.entries(q.alternativas).map(([letra, texto]) => (
                  <label key={letra} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`questao-${idx}`}
                      className="radio"
                    />
                    <span>
                      <strong>{letra})</strong> {texto}
                    </span>
                  </label>
                ))}
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-primary">
                  Mostrar Resposta
                </summary>
                <div className="mt-2">
                  <p>
                    <strong>Correta:</strong> {q.correta}
                  </p>
                  <p>{q.justificativa}</p>
                </div>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
