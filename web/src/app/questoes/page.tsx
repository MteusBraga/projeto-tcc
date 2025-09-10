// app/questoes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useGerarQuestoes } from "@/hooks/useGerarQuestoes";
import { FaExclamationCircle, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import { FaX } from "react-icons/fa6";
import { estruturaMock } from "../utils/structFilter";

// Função para decodificar Unicode
const decodeUnicode = (text: string): string => {
  return text
    .replace(/\\u[\dA-F]{4}/gi, (match) => {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ""), 16));
    })
    .replace(/R\$/g, "R\\$"); // escapa o R$ para não bugar o LaTeX
};

// Componente para renderizar texto que pode conter equações LaTeX
const LatexText = ({ text }: { text: string }) => {
  // Decodifica Unicode primeiro
  const decodedText = decodeUnicode(text);

  // Divide o texto em partes normais e equações LaTeX
  const parts = decodedText.split(/(\$.*?\$)/);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          const equation = part.slice(1, -1);
          return <InlineMath key={index} math={equation} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

interface AssuntoSelecionado {
  ano: string;
  unidade: string;
  topico: string;
  subtopico: string;
}

interface Questao {
  enunciado: string;
  alternativas: Record<string, string>;
  correta: string;
  justificativaRapida: string;
  justificativaDetalhada: string;
  justificativaAlternativasErradas: string;
}

export default function QuestoesPage() {
  const [modoCarrossel, setModoCarrossel] = useState(false);
  const [assuntosSelecionados, setAssuntosSelecionados] = useState<
    AssuntoSelecionado[]
  >([]);
  const [nivelDificuldade, setNivelDificuldade] = useState("médio");
  const [quantidade, setQuantidade] = useState(3);
  const [cooldown, setCooldown] = useState(0);

  // Estados para o modo carrossel
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [etapaCarrossel, setEtapaCarrossel] = useState(0); // 0: questão, 1: explicação errada, 2: explicação certa

  // respostas confirmadas
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  // alternativas escolhidas antes de confirmar
  const [selecionadas, setSelecionadas] = useState<Record<number, string>>({});
  // status de bloqueio (já respondeu)
  const [respondidas, setRespondidas] = useState<Record<number, boolean>>({});

  const { mutate, data: questoes, isPending } = useGerarQuestoes();
  let fontSize = "text-xl";
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleRemoverAssunto = (index: number) => {
    setAssuntosSelecionados(assuntosSelecionados.filter((_, i) => i !== index));
  };

  const handleDuplicarUltimoAssunto = () => {
    if (assuntosSelecionados.length === 0) return;

    const ultimoAssunto = assuntosSelecionados[assuntosSelecionados.length - 1];
    setAssuntosSelecionados([...assuntosSelecionados, { ...ultimoAssunto }]);
  };

  const handleAdicionarAssunto = () => {
    // Se já houver assuntos, duplica o último para manter a configuração
    if (assuntosSelecionados.length > 0) {
      const ultimoAssunto =
        assuntosSelecionados[assuntosSelecionados.length - 1];
      setAssuntosSelecionados([...assuntosSelecionados, { ...ultimoAssunto }]);
    } else {
      // Primeiro assunto, adiciona vazio
      setAssuntosSelecionados([
        { ano: "", unidade: "", topico: "", subtopico: "" },
      ]);
    }
  };

  const handleAssuntoChange = (
    index: number,
    campo: keyof AssuntoSelecionado,
    valor: string
  ) => {
    const novosAssuntos = [...assuntosSelecionados];
    novosAssuntos[index] = { ...novosAssuntos[index], [campo]: valor };

    // Resetar campos dependentes quando mudar ano, unidade ou tópico
    if (campo === "ano") {
      novosAssuntos[index].unidade = "";
      novosAssuntos[index].topico = "";
      novosAssuntos[index].subtopico = "";
    } else if (campo === "unidade") {
      novosAssuntos[index].topico = "";
      novosAssuntos[index].subtopico = "";
    } else if (campo === "topico") {
      novosAssuntos[index].subtopico = "";
    }

    setAssuntosSelecionados(novosAssuntos);
  };

  const handleGerarQuestoes = () => {
    if (
      assuntosSelecionados.length === 0 ||
      assuntosSelecionados.some((a) => !a.ano || !a.topico || !a.subtopico)
    ) {
      alert(
        "Selecione pelo menos um assunto completo (ano, tópico e subtópico)"
      );
      return;
    }

    const subtopicos = assuntosSelecionados.map((a) => a.subtopico);
    const topicos = [...new Set(assuntosSelecionados.map((a) => a.topico))];

    mutate({
      quantidade,
      ano: assuntosSelecionados[0].ano, // Usa o primeiro ano selecionado
      topico: topicos.join(", "),
      subtopico: subtopicos,
      nivel: nivelDificuldade,
    });

    setCooldown(60);
    setRespostas({});
    setSelecionadas({});
    setRespondidas({});
    setQuestaoAtual(0);
    setEtapaCarrossel(0);
  };

  const confirmarResposta = (idx: number) => {
    if (!selecionadas[idx]) return;
    setRespostas((prev) => ({ ...prev, [idx]: selecionadas[idx] }));
    setRespondidas((prev) => ({ ...prev, [idx]: true }));

    if (modoCarrossel) {
      setEtapaCarrossel(1); // Vai para a etapa de explicação da resposta errada
    }
  };

  const proximaEtapaCarrossel = () => {
    if (etapaCarrossel === 2) {
      // Próxima questão
      if (questaoAtual < (questoes?.length || 0) - 1) {
        setQuestaoAtual(questaoAtual + 1);
        setEtapaCarrossel(0);
      }
    } else {
      setEtapaCarrossel(etapaCarrossel + 1);
    }
  };

  const etapaAnteriorCarrossel = () => {
    if (etapaCarrossel === 0) {
      // Questão anterior
      if (questaoAtual > 0) {
        setQuestaoAtual(questaoAtual - 1);
        setEtapaCarrossel(2);
      }
    } else {
      setEtapaCarrossel(etapaCarrossel - 1);
    }
  };

  const gerarPDF = () => {
    if (!questoes) return;

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Lista de Questões", 14, 10);

    (questoes as Questao[]).forEach((q, idx) => {
      const enunciado = decodeUnicode(q.enunciado).replace(/\$/g, "");

      autoTable(doc, {
        head: [[`Questão ${idx + 1}`]],
        body: [
          [enunciado],
          ...Object.entries(q.alternativas).map(([letra, texto]) => [
            `${letra}) ${decodeUnicode(texto).replace(/\$/g, "")}`,
          ]),
          [`Correta: ${q.correta}`],
          [
            `Justificativa Detalhada: ${decodeUnicode(
              q.justificativaDetalhada
            ).replace(/\$/g, "")}`,
          ],
        ],
      });
    });

    doc.save("questoes.pdf");
  };

  const getUnidadesPorAno = (ano: string) => {
    const anoData = estruturaMock.find((a) => a.ano === ano);
    return anoData?.unidades || [];
  };

  const getTopicosPorUnidade = (ano: string, unidade: string) => {
    const anoData = estruturaMock.find((a) => a.ano === ano);
    const unidadeData = anoData?.unidades.find((u) => u.nome === unidade);
    return unidadeData?.topicos || [];
  };

  const getSubTopicosPorTopico = (
    ano: string,
    unidade: string,
    topico: string
  ) => {
    const anoData = estruturaMock.find((a) => a.ano === ano);
    const unidadeData = anoData?.unidades.find((u) => u.nome === unidade);
    const topicoData = unidadeData?.topicos.find((t) => t.nome === topico);
    return topicoData?.subTopicos || [];
  };

  return (
    <div className="p-6 bg-base-300 min-h-screen">
      <div className="flex flex-col max-w-[1024px] mx-auto">
        <details className="collapse collapse-arrow bg-base-100 border-base-300 border">
          <summary className="collapse-title font-semibold">Filtros</summary>
          <div className="collapse-content">
            {/* Modo de visualização */}
            <div className="mb-6 bg-base-200 p-4 rounded-xl shadow">
              <label className="label cursor-pointer flex items-center gap-2">
                <span className="label-text font-bold">
                  Modo de Visualização:
                </span>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={modoCarrossel}
                  onChange={(e) => setModoCarrossel(e.target.checked)}
                />
                <span className="label-text">
                  {modoCarrossel ? "Modo Estudo Aprofundado" : "Modo Simulado"}
                </span>
              </label>
            </div>

            {/* Assuntos selecionados */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Assuntos Selecionados:</h3>
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={handleAdicionarAssunto}
                  >
                    + Adicionar Assunto
                  </button>
                  <button
                    className="btn btn-sm btn-outline btn-info"
                    onClick={handleDuplicarUltimoAssunto}
                    disabled={assuntosSelecionados.length === 0}
                  >
                    + Duplicar Último
                  </button>
                </div>
              </div>

              {assuntosSelecionados.map((assunto, index) => (
                <div
                  key={index}
                  className="flex justify-between gap-2 mb-2 bg-base-100 p-3 rounded-lg border border-base-300"
                >
                  <select
                    className="select select-bordered"
                    value={assunto.ano}
                    onChange={(e) =>
                      handleAssuntoChange(index, "ano", e.target.value)
                    }
                  >
                    <option value="">Ano</option>
                    {estruturaMock.map((a, i) => (
                      <option key={i}>{a.ano}</option>
                    ))}
                  </select>

                  <select
                    className="select select-bordered"
                    value={assunto.unidade}
                    onChange={(e) =>
                      handleAssuntoChange(index, "unidade", e.target.value)
                    }
                    disabled={!assunto.ano}
                  >
                    <option value="">Unidade</option>
                    {getUnidadesPorAno(assunto.ano).map((u, i) => (
                      <option key={i}>{u.nome}</option>
                    ))}
                  </select>

                  <select
                    className="select select-bordered"
                    value={assunto.topico}
                    onChange={(e) =>
                      handleAssuntoChange(index, "topico", e.target.value)
                    }
                    disabled={!assunto.unidade}
                  >
                    <option value="">Tópico</option>
                    {getTopicosPorUnidade(assunto.ano, assunto.unidade).map(
                      (t, i) => (
                        <option key={i}>{t.nome}</option>
                      )
                    )}
                  </select>

                  <select
                    className="select select-bordered"
                    value={assunto.subtopico}
                    onChange={(e) =>
                      handleAssuntoChange(index, "subtopico", e.target.value)
                    }
                    disabled={!assunto.topico}
                  >
                    <option value="">Subtópico</option>
                    {getSubTopicosPorTopico(
                      assunto.ano,
                      assunto.unidade,
                      assunto.topico
                    ).map((s, i) => (
                      <option key={i}>{s}</option>
                    ))}
                  </select>

                  <button
                    className="btn btn-circle btn-error btn-sm"
                    onClick={() => handleRemoverAssunto(index)}
                    disabled={assuntosSelecionados.length === 1}
                  >
                    <FaX></FaX>
                  </button>
                </div>
              ))}
              {/* Filtros */}
              <div className="grid grid-cols-4 gap-4 bg-base-200 p-4 rounded-xl shadow mt-4">
                <div>
                  <label className="label">
                    <span className="label-text font-bold">Quantidade</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                    className="input input-bordered w-full"
                    placeholder="Qtd"
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-bold">Nível</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={nivelDificuldade}
                    onChange={(e) => setNivelDificuldade(e.target.value)}
                  >
                    <option value="fácil">Fácil</option>
                    <option value="médio">Médio</option>
                    <option value="difícil">Difícil</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    className="btn btn-primary w-full"
                    disabled={cooldown > 0 || isPending}
                    onClick={handleGerarQuestoes}
                  >
                    {isPending
                      ? "Gerando..."
                      : cooldown > 0
                      ? `Aguarde ${cooldown}s`
                      : "Gerar Questões"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* Loading */}
        {isPending && (
          <div className="mt-6 text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-2">Gerando questões...</p>
          </div>
        )}

        {/* Lista de Questões - Modo Simulado */}
        {!modoCarrossel && questoes && questoes.length > 0 && (
          <div className={`mt-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Questões</h2>
              <button className="btn btn-secondary" onClick={gerarPDF}>
                Imprimir PDF
              </button>
            </div>

            <div className="space-y-6">
              {(questoes as Questao[]).map((q, idx) => (
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

                    <div className="mb-4">
                      <LatexText text={q.enunciado} />
                    </div>

                    <div className="space-y-2">
                      {Object.entries(q.alternativas).map(([letra, texto]) => (
                        <label key={letra} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`questao-${idx}`}
                            className="radio"
                            disabled={respondidas[idx]}
                            checked={selecionadas[idx] === letra}
                            onChange={() =>
                              setSelecionadas((prev) => ({
                                ...prev,
                                [idx]: letra,
                              }))
                            }
                          />
                          <span>
                            <strong>{letra})</strong> <LatexText text={texto} />
                          </span>
                        </label>
                      ))}
                    </div>

                    {!respondidas[idx] ? (
                      <button
                        className="btn btn-sm btn-success mt-3 w-50"
                        onClick={() => confirmarResposta(idx)}
                        disabled={!selecionadas[idx]}
                      >
                        Responder
                      </button>
                    ) : (
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
                        <p className="mt-2">
                          <LatexText text={q.justificativaDetalhada} />
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carrossel - Modo Carrossel */}
        {modoCarrossel && questoes && questoes.length > 0 && (
          <div className={`mt-6 text-xl`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                Questão {questaoAtual + 1} de {questoes.length}
              </h2>
              <button className="btn btn-secondary" onClick={gerarPDF}>
                Imprimir PDF
              </button>
            </div>

            <div className="card bg-base-100 shadow-md border border-base-300">
              <div className="card-body  min-h-[500px] flex flex-col justify-between text-xl">
                {/* Etapa 0: Mostrar questão e alternativas */}
                {etapaCarrossel === 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <h2 className="card-title">Questão {questaoAtual + 1}</h2>
                      <button
                        className="text-red-500 hover:text-red-700"
                        title="Denunciar questão"
                      >
                        <FaExclamationCircle size={20} />
                      </button>
                    </div>

                    <div className="mb-4">
                      <LatexText
                        text={(questoes[questaoAtual] as Questao).enunciado}
                      />
                    </div>

                    <div className="space-y-2">
                      {Object.entries(
                        (questoes[questaoAtual] as Questao).alternativas
                      ).map(([letra, texto]) => (
                        <label key={letra} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`questao-carrossel`}
                            className="radio"
                            checked={selecionadas[questaoAtual] === letra}
                            onChange={() =>
                              setSelecionadas((prev) => ({
                                ...prev,
                                [questaoAtual]: letra,
                              }))
                            }
                          />
                          <span>
                            <strong>{letra})</strong> <LatexText text={texto} />
                          </span>
                        </label>
                      ))}
                    </div>

                    <button
                      className="btn btn-success mt-3 w-full"
                      onClick={() => confirmarResposta(questaoAtual)}
                      disabled={!selecionadas[questaoAtual]}
                    >
                      Responder
                    </button>
                  </>
                )}

                {/* Etapa 1: Explicação da resposta errada */}
                {etapaCarrossel === 1 &&
                  selecionadas[questaoAtual] &&
                  selecionadas[questaoAtual] !==
                    (questoes[questaoAtual] as Questao).correta && (
                    <>
                      <h2 className="card-title text-red-400">
                        Resposta Incorreta
                      </h2>
                      <div className="mb-4 flex flex-col">
                        <p className="">
                          Você selecionou a alternativa{" "}
                          {selecionadas[questaoAtual]}, mas esta não é a
                          correta.
                        </p>
                        <p className=" mt-2">
                          Vamos entender por que essa alternativa está errada...
                        </p>
                      </div>
                      <div className="p-4 rounded-lg mb-4 ">
                        <LatexText
                          text={
                            (questoes[questaoAtual] as Questao)
                              .justificativaAlternativasErradas ||
                            "Explicação não disponível para esta alternativa."
                          }
                        />
                      </div>
                      <button
                        className="btn btn-primary w-full"
                        onClick={proximaEtapaCarrossel}
                      >
                        Ver Explicação da Resposta Correta
                      </button>
                    </>
                  )}

                {/* Etapa 2: Explicação da resposta correta */}
                {etapaCarrossel === 2 && (
                  <>
                    <h2 className="card-title text-green-600">
                      Resposta Correta
                    </h2>
                    <div className="mb-4">
                      <p className="">
                        A alternativa correta é{" "}
                        {(questoes[questaoAtual] as Questao).correta}.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg mb-4 ">
                      <LatexText
                        text={
                          (questoes[questaoAtual] as Questao)
                            .justificativaDetalhada
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-outline flex-1"
                        onClick={etapaAnteriorCarrossel}
                        disabled={questaoAtual === 0}
                      >
                        <FaArrowLeft /> Anterior
                      </button>
                      <button
                        className="btn btn-primary flex-1"
                        onClick={proximaEtapaCarrossel}
                        disabled={questaoAtual === questoes.length - 1}
                      >
                        {questaoAtual === questoes.length - 1
                          ? "Finalizar"
                          : "Próxima Questão"}{" "}
                        <FaArrowRight />
                      </button>
                    </div>
                  </>
                )}

                {/* Se acertou direto, vai direto para etapa 2 */}
                {etapaCarrossel === 1 &&
                  selecionadas[questaoAtual] &&
                  selecionadas[questaoAtual] ===
                    (questoes[questaoAtual] as Questao).correta && (
                    <>
                      <h2 className="card-title text-green-600">
                        Resposta Correta!
                      </h2>
                      <div className="mb-4">
                        <p>
                          Você acertou a alternativa{" "}
                          {(questoes[questaoAtual] as Questao).correta}.
                        </p>
                      </div>
                      <div className=" p-4 rounded-lg mb-4">
                        <LatexText
                          text={
                            (questoes[questaoAtual] as Questao)
                              .justificativaDetalhada
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-outline flex-1"
                          onClick={() => setEtapaCarrossel(0)}
                        >
                          <FaArrowLeft /> Voltar
                        </button>
                        <button
                          className="btn btn-primary flex-1"
                          onClick={proximaEtapaCarrossel}
                          disabled={questaoAtual === questoes.length - 1}
                        >
                          {questaoAtual === questoes.length - 1
                            ? "Finalizar"
                            : "Próxima Questão"}{" "}
                          <FaArrowRight />
                        </button>
                      </div>
                    </>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
