// app/page.tsx
"use client";

import { useState } from "react";

// Estrutura mockada dos filtros em forma de árvore
const estruturaMock = [
  {
    ano: "1º ano",
    unidades: [
      {
        nome: "I",
        topicos: [
          {
            nome: "Conjuntos numéricos",
            subTopicos: [
              "Conjunto vazio, unitário e universo",
              "Subconjuntos",
              "Operações com conjuntos",
            ],
          },
          {
            nome: "Funções",
            subTopicos: [
              "Função afim",
              "Função quadrática",
              "Função exponencial",
            ],
          },
        ],
      },
      {
        nome: "II",
        topicos: [
          {
            nome: "Geometria",
            subTopicos: ["Ângulos", "Triângulos", "Polígonos"],
          },
        ],
      },
    ],
  },
  {
    ano: "2º ano",
    unidades: [
      {
        nome: "I",
        topicos: [
          {
            nome: "Trigonometria",
            subTopicos: [
              "Razões trigonométricas",
              "Lei dos senos",
              "Lei dos cossenos",
            ],
          },
        ],
      },
    ],
  },
];

// Dados mockados das questões
const questoesMock = [
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

export default function Home() {
  const [anoSelecionado, setAnoSelecionado] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [topicoSelecionado, setTopicoSelecionado] = useState("");
  const [multiSubtopicos, setMultiSubtopicos] = useState(false);

  // encontra o ano selecionado
  const anoAtual = estruturaMock.find((a) => a.ano === anoSelecionado);
  // encontra a unidade dentro do ano
  const unidadeAtual = anoAtual?.unidades.find(
    (u) => u.nome === unidadeSelecionada
  );
  // encontra o tópico dentro da unidade
  const topicoAtual = unidadeAtual?.topicos.find(
    (t) => t.nome === topicoSelecionado
  );

  return (
    <div className="p-6">
      {/* Filtros */}
      <div className="grid grid-cols-4 gap-4 bg-base-200 p-4 rounded-xl shadow">
        {/* Ano */}
        <select
          className="select select-bordered"
          value={anoSelecionado}
          onChange={(e) => {
            setAnoSelecionado(e.target.value);
            setUnidadeSelecionada("");
            setTopicoSelecionado("");
          }}
        >
          <option value="">Ano</option>
          {estruturaMock.map((a, i) => (
            <option key={i}>{a.ano}</option>
          ))}
        </select>

        {/* Unidade */}
        <select
          className="select select-bordered"
          value={unidadeSelecionada}
          onChange={(e) => {
            setUnidadeSelecionada(e.target.value);
            setTopicoSelecionado("");
          }}
          disabled={!anoSelecionado}
        >
          <option value="">Unidade</option>
          {anoAtual?.unidades.map((u, i) => (
            <option key={i}>{u.nome}</option>
          ))}
        </select>

        {/* Tópico */}
        <select
          className="select select-bordered"
          value={topicoSelecionado}
          onChange={(e) => setTopicoSelecionado(e.target.value)}
          disabled={!unidadeSelecionada}
        >
          <option value="">Tópico</option>
          {unidadeAtual?.topicos.map((t, i) => (
            <option key={i}>{t.nome}</option>
          ))}
        </select>

        {/* Checkbox - múltiplos sub-tópicos */}
        <label className="label cursor-pointer flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox"
            checked={multiSubtopicos}
            onChange={(e) => setMultiSubtopicos(e.target.checked)}
          />
          <span>Gerar vários sub-tópicos</span>
        </label>
      </div>

      {/* Subtópicos */}
      {topicoSelecionado && (
        <div className="mt-4 bg-base-100 p-4 rounded-lg border shadow">
          <h3 className="font-bold mb-2">Subtópicos:</h3>
          <div className="flex flex-col gap-2">
            {topicoAtual?.subTopicos.map((s, i) => (
              <label key={i} className="flex items-center gap-2">
                {multiSubtopicos ? (
                  <input type="checkbox" className="checkbox" />
                ) : (
                  <input type="radio" name="subtopico" className="radio" />
                )}
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Questões mockadas */}
      <div className="mt-6 space-y-6">
        {questoesMock.map((q, idx) => (
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
