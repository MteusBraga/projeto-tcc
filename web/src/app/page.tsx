"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FaExclamationTriangle } from "react-icons/fa";
import { jsPDF } from "jspdf";

// Simulação de backend
async function generateQuestions(params: {
  ano: string;
  unidade: string;
  topico: string;
  subTopico: string;
  quantidade: number;
  multiplosSubtopicos: boolean;
}) {
  await new Promise((res) => setTimeout(res, 1500));
  return [
    {
      enunciado: "Qual é o valor de 2 + 2?",
      alternativas: {
        A: "1",
        B: "2",
        C: "3",
        D: "4",
        E: "5",
      },
      correta: "D",
      justificativa: "2 + 2 = 4, portanto a alternativa correta é D.",
    },
  ];
}

export default function QuestoesPage() {
  const [ano, setAno] = useState("");
  const [unidade, setUnidade] = useState("");
  const [topico, setTopico] = useState("");
  const [subTopico, setSubTopico] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [multiplosSubtopicos, setMultiplosSubtopicos] = useState(false);
  const [respostas, setRespostas] = useState<Record<number, string>>({});

  const {
    mutate,
    data: questoes,
    isPending,
  } = useMutation({
    mutationFn: generateQuestions,
  });

  const handleGenerate = () => {
    mutate({
      ano,
      unidade,
      topico,
      subTopico,
      quantidade,
      multiplosSubtopicos,
    });
  };

  const handleResponder = (index: number, alternativa: string) => {
    setRespostas((prev) => ({ ...prev, [index]: alternativa }));
  };

  const exportPDF = () => {
    if (!questoes) return;
    const doc = new jsPDF();
    questoes.forEach((q, i) => {
      doc.text(`${i + 1}. ${q.enunciado}`, 10, 20 + i * 50);
      Object.entries(q.alternativas).forEach(([key, value], j) => {
        doc.text(`${key}) ${value}`, 15, 30 + i * 50 + j * 8);
      });
    });
    doc.save("questoes.pdf");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Filtro */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <select
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Selecione o ano</option>
          <option value="1">1º ano</option>
          <option value="2">2º ano</option>
          <option value="3">3º ano</option>
        </select>

        <select
          value={unidade}
          onChange={(e) => setUnidade(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Selecione a unidade</option>
          <option value="1">Unidade 1</option>
          <option value="2">Unidade 2</option>
        </select>

        <select
          value={topico}
          onChange={(e) => setTopico(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Selecione o tópico</option>
          <option value="funcoes">Funções</option>
          <option value="equacoes">Equações</option>
        </select>

        <select
          value={subTopico}
          onChange={(e) => setSubTopico(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Selecione o subtópico</option>
          <option value="afim">Função Afim</option>
          <option value="quadratica">Função Quadrática</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={multiplosSubtopicos}
            onChange={(e) => setMultiplosSubtopicos(e.target.checked)}
          />
          <label>Gerar com múltiplos subtópicos</label>
        </div>

        <input
          type="number"
          min={1}
          max={20}
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          className="border p-2 rounded"
          placeholder="Qtd. de questões"
        />
      </div>

      <button
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Gerar Questões
      </button>

      {isPending && (
        <div className="text-center animate-pulse text-lg font-semibold text-gray-600">
          ⏳ Gerando questões, aguarde...
        </div>
      )}

      {/* Exibição das questões */}
      {questoes && (
        <div className="space-y-6">
          {questoes.map((q, i) => (
            <div key={i} className="border p-4 rounded shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">
                  {i + 1}. {q.enunciado}
                </h3>
                <button className="text-red-600">
                  <FaExclamationTriangle />
                </button>
              </div>

              <div className="space-y-2 mt-2">
                {Object.entries(q.alternativas).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleResponder(i, key)}
                    className={`block w-full text-left px-3 py-2 rounded border ${
                      respostas[i] === key
                        ? "bg-blue-100 border-blue-400"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {key}) {value}
                  </button>
                ))}
              </div>

              {respostas[i] && (
                <div className="mt-3 p-2 rounded bg-gray-50 border-l-4 border-green-500">
                  {respostas[i] === q.correta ? (
                    <p className="text-green-700">✅ Resposta correta!</p>
                  ) : (
                    <p className="text-red-700">
                      ❌ Resposta incorreta. Correta: {q.correta}
                    </p>
                  )}
                  <p className="mt-1 text-gray-700">
                    <strong>Justificativa:</strong> {q.justificativa}
                  </p>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={exportPDF}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            📄 Exportar PDF
          </button>
        </div>
      )}
    </div>
  );
}
