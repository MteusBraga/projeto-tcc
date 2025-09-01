// app/questoes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useGerarQuestoes } from "@/hooks/useGerarQuestoes";
import { FaExclamationCircle } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

export default function QuestoesPage() {
  const [anoSelecionado, setAnoSelecionado] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [topicoSelecionado, setTopicoSelecionado] = useState("");
  const [multiSubtopicos, setMultiSubtopicos] = useState(false);
  const [subTopicosSelecionados, setSubTopicosSelecionados] = useState<
    string[]
  >([]);
  const [modelo, setModelo] = useState(false);
  const [quantidade, setQuantidade] = useState(3);
  const [cooldown, setCooldown] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, string>>({});

  const { mutate, data: questoes, isPending } = useGerarQuestoes();

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const anoAtual = estruturaMock.find((a) => a.ano === anoSelecionado);
  const unidadeAtual = anoAtual?.unidades.find(
    (u) => u.nome === unidadeSelecionada
  );
  const topicoAtual = unidadeAtual?.topicos.find(
    (t) => t.nome === topicoSelecionado
  );

  const handleSubTopicoChange = (sub: string) => {
    if (multiSubtopicos) {
      setSubTopicosSelecionados((prev) =>
        prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
      );
    } else {
      setSubTopicosSelecionados([sub]);
    }
  };

  const handleGerarQuestoes = () => {
    if (
      !anoSelecionado ||
      !topicoSelecionado ||
      subTopicosSelecionados.length === 0
    )
      return;

    mutate({
      quantidade,
      ano: anoSelecionado,
      topico: topicoSelecionado,
      subtopico: subTopicosSelecionados,
      modelo: modelo ? "ChatGPT 5" : "Outro",
    });

    setCooldown(60);
    setRespostas({});
  };

  const handleResposta = (idx: number, alternativa: string) => {
    setRespostas((prev) => ({ ...prev, [idx]: alternativa }));
  };

  const gerarPDF = () => {
    if (!questoes) return;

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Lista de Questões", 14, 10);

    questoes.forEach((q, idx) => {
      autoTable(doc, {
        head: [[`Questão ${idx + 1}`]],
        body: [
          [q.enunciado],
          ...Object.entries(q.alternativas).map(([letra, texto]) => [
            `${letra}) ${texto}`,
          ]),
          [`Correta: ${q.correta}`],
          [`Justificativa: ${q.justificativa}`],
        ],
      });
    });

    doc.save("questoes.pdf");
  };

  return (
    <div className="p-6">
      {/* Filtros */}
      <div className="grid grid-cols-5 gap-4 bg-base-200 p-4 rounded-xl shadow">
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

        <select
          className="select select-bordered"
          value={topicoSelecionado}
          onChange={(e) => {
            setTopicoSelecionado(e.target.value);
            setSubTopicosSelecionados([]);
          }}
          disabled={!unidadeSelecionada}
        >
          <option value="">Tópico</option>
          {unidadeAtual?.topicos.map((t, i) => (
            <option key={i}>{t.nome}</option>
          ))}
        </select>

        <input
          type="number"
          min={1}
          max={20}
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          className="input input-bordered w-full"
          placeholder="Qtd"
        />

        <label className="label cursor-pointer flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox"
            checked={modelo}
            onChange={(e) => setModelo(e.target.checked)}
          />
          <span>ChatGPT 5</span>
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
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={subTopicosSelecionados.includes(s)}
                    onChange={() => handleSubTopicoChange(s)}
                  />
                ) : (
                  <input
                    type="radio"
                    name="subtopico"
                    className="radio"
                    checked={subTopicosSelecionados.includes(s)}
                    onChange={() => handleSubTopicoChange(s)}
                  />
                )}
                <span>{s}</span>
              </label>
            ))}
          </div>
          <label className="label cursor-pointer flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={multiSubtopicos}
              onChange={(e) => {
                setMultiSubtopicos(e.target.checked);
                setSubTopicosSelecionados([]);
              }}
            />
            <span>Gerar vários sub-tópicos</span>
          </label>
        </div>
      )}

      {/* Botão Gerar Questões */}
      <div className="mt-4 flex gap-2">
        <button
          className="btn btn-primary"
          disabled={cooldown > 0 || isPending}
          onClick={handleGerarQuestoes}
        >
          {isPending
            ? "Gerando..."
            : cooldown > 0
            ? `Aguarde ${cooldown}s`
            : "Gerar Questões"}
        </button>

        {questoes && questoes.length > 0 && (
          <button className="btn btn-secondary" onClick={gerarPDF}>
            Imprimir PDF
          </button>
        )}
      </div>

      {/* Loading */}
      {isPending && (
        <div className="mt-6 text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-2">Gerando questões...</p>
        </div>
      )}

      {/* Lista de Questões */}
      <div className="mt-6 space-y-6">
        {questoes?.map((q, idx) => (
          <div
            key={idx}
            className="card bg-base-100 shadow-md border border-base-300"
          >
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title">Questão {idx + 1}</h2>
                <button
                  className="text-red-500 hover:text-red-700"
                  title="Denunciar questão"
                >
                  <FaExclamationCircle size={20} />
                </button>
              </div>

              <p className="mb-4">{q.enunciado}</p>

              <div className="space-y-2">
                {Object.entries(q.alternativas).map(([letra, texto]) => (
                  <label key={letra} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`questao-${idx}`}
                      className="radio"
                      checked={respostas[idx] === letra}
                      onChange={() => handleResposta(idx, letra)}
                    />
                    <span>
                      <strong>{letra})</strong> {texto}
                    </span>
                  </label>
                ))}
              </div>

              {respostas[idx] && (
                <div className="mt-4 border-t pt-2">
                  {respostas[idx] === q.correta ? (
                    <p className="text-green-600 font-bold">
                      ✅ Resposta correta!
                    </p>
                  ) : (
                    <p className="text-red-600 font-bold">
                      ❌ Resposta incorreta. Correta: {q.correta}
                    </p>
                  )}
                  <p className="mt-2">{q.justificativa}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
