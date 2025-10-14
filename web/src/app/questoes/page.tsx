// app/questoes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useGerarQuestoes } from "@/hooks/useGerarQuestoes";
import {
  FaExclamationCircle,
  FaArrowLeft,
  FaArrowRight,
  FaTrophy,
  FaRedo,
  FaChartBar,
  FaPlay,
  FaFilter,
  FaChevronUp,
  FaHome,
  FaPaperPlane,
  FaNewspaper,
  FaDoorOpen,
  FaOutdent,
} from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import { FaGear, FaQ, FaQuestion, FaX } from "react-icons/fa6";
import { estruturaMock } from "../../utils/structFilter";
import { Questao as QuestaoInterface } from "@/types/questao";
import { useAuth } from "@/hooks/useAuth";
import { BiDoorOpen } from "react-icons/bi";
import { CiLogin, CiLogout } from "react-icons/ci";

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
  // Divide em blocos de $$...$$ primeiro, depois trata inline $
  const parts = text.split(/(\$\$.*?\$\$)/);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const equation = part.slice(2, -2).trim();
          return <BlockMath key={index} math={equation} />;
        } else {
          // Agora trata inline $...$
          const inlineParts = part.split(/(\$.*?\$)/);
          return inlineParts.map((inline, i) => {
            if (inline.startsWith("$") && inline.endsWith("$")) {
              const equation = inline.slice(1, -1).trim();
              return <InlineMath key={`${index}-${i}`} math={equation} />;
            }
            return <span key={`${index}-${i}`}>{inline}</span>;
          });
        }
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

interface PerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  desempenho: {
    acertos: number;
    total: number;
    percentual: number;
  };
  onTentarNovamente: () => void;
  onAumentarDificuldade: () => void;
  onMudarAssunto: () => void;
}

const PerformanceModal = ({
  isOpen,
  onClose,
  desempenho,
  onTentarNovamente,
  onAumentarDificuldade,
  onMudarAssunto,
}: PerformanceModalProps) => {
  if (!isOpen) return null;

  const getMensagemDesempenho = () => {
    if (desempenho.percentual === 100) {
      return {
        titulo: "🎉 Excelente!",
        mensagem:
          "Parabéns! Você acertou todas as questões! Domínio total do conteúdo!",
        cor: "text-green-600",
        icone: <FaTrophy className="text-4xl text-yellow-500" />,
      };
    } else if (desempenho.percentual >= 80) {
      return {
        titulo: "👍 Muito Bom!",
        mensagem:
          "Ótimo desempenho! Você demonstrou um bom entendimento do assunto.",
        cor: "text-green-500",
        icone: <FaChartBar className="text-4xl text-green-500" />,
      };
    } else if (desempenho.percentual >= 60) {
      return {
        titulo: "💡 Bom Trabalho!",
        mensagem:
          "Bom resultado! Continue praticando para melhorar ainda mais.",
        cor: "text-blue-500",
        icone: <FaChartBar className="text-4xl text-blue-500" />,
      };
    } else if (desempenho.percentual >= 40) {
      return {
        titulo: "📚 Continue Estudando!",
        mensagem:
          "Você está no caminho certo! Revise o conteúdo e tente novamente.",
        cor: "text-orange-500",
        icone: <FaRedo className="text-4xl text-orange-500" />,
      };
    } else if (desempenho.percentual > 0) {
      return {
        titulo: "🎯 Foco no Estudo!",
        mensagem:
          "Não desanime! Use esse resultado para identificar onde precisa melhorar.",
        cor: "text-orange-600",
        icone: <FaRedo className="text-4xl text-orange-600" />,
      };
    } else {
      return {
        titulo: "🚀 Vamos Começar!",
        mensagem:
          "Essa foi uma ótima oportunidade para identificar pontos de melhoria. Vamos tentar novamente!",
        cor: "text-red-500",
        icone: <FaRedo className="text-4xl text-red-500" />,
      };
    }
  };

  const mensagem = getMensagemDesempenho();

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="text-center">
          {mensagem.icone}
          <h3 className={`sm:text-2xl font-bold mt-4 ${mensagem.cor}`}>
            {mensagem.titulo}
          </h3>
          <p className="py-4 text-lg">{mensagem.mensagem}</p>

          <div className="stats shadow my-6">
            <div className="stat place-items-center">
              <div className="stat-title">Acertos</div>
              <div className="stat-value text-primary">
                {desempenho.acertos}/{desempenho.total}
              </div>
              <div className="stat-desc">
                {desempenho.percentual}% de aproveitamento
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <button
              className="btn btn-primary btn-lg"
              onClick={onTentarNovamente}
            >
              <FaRedo className="mr-2" />
              Tentar Novamente (Mesma Dificuldade)
            </button>

            <button
              className="btn btn-warning btn-lg"
              onClick={onAumentarDificuldade}
            >
              <FaTrophy className="mr-2" />
              Aumentar Dificuldade
            </button>

            <button className="btn btn-outline btn-lg" onClick={onMudarAssunto}>
              <FaChartBar className="mr-2" />
              Mudar de Assunto
            </button>

            <button className="btn btn-ghost mt-4" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function QuestoesPage() {
  const {
    user,
    logout,
    checkAuth,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();
  const [modoCarrossel, setModoCarrossel] = useState(true);
  const [assuntosSelecionados, setAssuntosSelecionados] = useState<
    AssuntoSelecionado[]
  >([]);
  const [nivelDificuldade, setNivelDificuldade] = useState("médio");
  const [quantidade, setQuantidade] = useState(3);
  const [cooldown, setCooldown] = useState(0);
  const [ultimosParametros, setUltimosParametros] = useState<any>(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [etapaCarrossel, setEtapaCarrossel] = useState(0);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [selecionadas, setSelecionadas] = useState<Record<number, string>>({});
  const [respondidas, setRespondidas] = useState<Record<number, boolean>>({});

  const { mutate, data: questoes, isPending } = useGerarQuestoes();

  // Calcular desempenho
  const desempenho = {
    acertos: Object.keys(respostas).filter(
      (idx) => respostas[Number(idx)] === questoes?.[Number(idx)]?.correta
    ).length,
    total: questoes?.length || 0,
    percentual: questoes?.length
      ? Math.round(
          (Object.keys(respostas).filter(
            (idx) => respostas[Number(idx)] === questoes?.[Number(idx)]?.correta
          ).length /
            questoes.length) *
            100
        )
      : 0,
  };

  // Verificar se todas as questões foram respondidas
  const todasRespondidas =
    questoes && Object.keys(respondidas).length === questoes.length;

  // Mostrar modal quando todas as questões forem respondidas
  useEffect(() => {
    if (todasRespondidas && !modoCarrossel) {
      setShowPerformanceModal(true);
    }
  }, [todasRespondidas, modoCarrossel]);

  // Cooldown de 60 segundos
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((c) => c - 1), 500);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleRemoverAssunto = (index: number) => {
    setAssuntosSelecionados(assuntosSelecionados.filter((_, i) => i !== index));
  };

  const handleAdicionarAssunto = () => {
    if (assuntosSelecionados.length > 0) {
      const ultimoAssunto =
        assuntosSelecionados[assuntosSelecionados.length - 1];
      setAssuntosSelecionados([...assuntosSelecionados, { ...ultimoAssunto }]);
    } else {
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
    if (assuntosSelecionados.length === 0 || !validarAssuntosCompletos()) {
      alert("Selecione e preencha completamente pelo menos um assunto");
      return;
    }

    // Validação adicional: quantidade deve ser >= número de assuntos
    if (quantidade < assuntosSelecionados.length) {
      const confirmar = window.confirm(
        `Você está gerando ${quantidade} questões para ${assuntosSelecionados.length} assuntos. ` +
          `Recomendamos pelo menos ${assuntosSelecionados.length} questões para melhor distribuição. ` +
          `Deseja continuar?`
      );
      if (!confirmar) return;
    }

    const subtopicos = assuntosSelecionados.map((a) => a.subtopico);
    const topicos = [...new Set(assuntosSelecionados.map((a) => a.topico))];
    const anos = getAnosSelecionados(); // Agora envia múltiplos anos

    const parametros = {
      quantidade,
      ano: anos.join(", "), // Junta os anos com vírgula
      topico: topicos.join(", "),
      subtopico: subtopicos,
      nivel: nivelDificuldade,
    };
    setIsSidebarCollapsed(true); // Fecha no desktop
    setIsSidebarExpanded(false); // Fecha no mobile

    setUltimosParametros(parametros);
    mutate(parametros);

    setCooldown(60);
    setRespostas({});
    setSelecionadas({});
    setRespondidas({});
    setQuestaoAtual(0);
    setEtapaCarrossel(0);
    setShowPerformanceModal(false);
  };

  const handleTentarNovamente = () => {
    if (ultimosParametros) {
      mutate(ultimosParametros);
      setRespostas({});
      setSelecionadas({});
      setRespondidas({});
      setQuestaoAtual(0);
      setEtapaCarrossel(0);
      setShowPerformanceModal(false);
    }
  };

  const handleAumentarDificuldade = () => {
    if (ultimosParametros) {
      const novaDificuldade =
        nivelDificuldade === "fácil"
          ? "médio"
          : nivelDificuldade === "médio"
          ? "difícil"
          : "difícil";

      setNivelDificuldade(novaDificuldade);

      const novosParametros = {
        ...ultimosParametros,
        nivel: novaDificuldade,
      };

      setUltimosParametros(novosParametros);
      mutate(novosParametros);

      setRespostas({});
      setSelecionadas({});
      setRespondidas({});
      setQuestaoAtual(0);
      setEtapaCarrossel(0);
      setShowPerformanceModal(false);
    }
  };
  const validarAssuntosCompletos = (): boolean => {
    if (assuntosSelecionados.length === 0) return false;

    return assuntosSelecionados.every(
      (assunto) =>
        assunto.ano && assunto.unidade && assunto.topico && assunto.subtopico
    );
  };

  // Função para obter os anos selecionados (únicos)
  const getAnosSelecionados = (): string[] => {
    const anos = assuntosSelecionados
      .map((assunto) => assunto.ano)
      .filter(Boolean);
    return [...new Set(anos)]; // Remove duplicatas
  };
  useEffect(() => {
    // Garante que a quantidade nunca seja menor que o número de assuntos
    if (quantidade < assuntosSelecionados.length) {
      setQuantidade(Math.max(1, assuntosSelecionados.length));
    }
  }, [assuntosSelecionados.length]);
  const handleMudarAssunto = () => {
    setShowPerformanceModal(false);
    // Rolagem suave para o topo onde estão os filtros
    document
      .querySelector("details[open]")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const confirmarResposta = (idx: number) => {
    if (!selecionadas[idx]) return;
    setRespostas((prev) => ({ ...prev, [idx]: selecionadas[idx] }));
    setRespondidas((prev) => ({ ...prev, [idx]: true }));

    if (modoCarrossel) {
      setEtapaCarrossel(1);
    }
  };

  const proximaEtapaCarrossel = () => {
    if (etapaCarrossel === 2) {
      if (questaoAtual < (questoes?.length || 0) - 1) {
        setQuestaoAtual(questaoAtual + 1);
        setEtapaCarrossel(0);
      } else {
        // Última questão respondida no modo carrossel
        setShowPerformanceModal(true);
      }
    } else {
      setEtapaCarrossel(etapaCarrossel + 1);
    }
  };

  const etapaAnteriorCarrossel = () => {
    if (etapaCarrossel === 0) {
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

    (questoes as QuestaoInterface[]).forEach((q, idx) => {
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

  // Adicione este useEffect para fechar a sidebar quando a tela for grande
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setIsSidebarExpanded(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-base-300 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  const authorized = user !== null;
  console.log(user, authorized);
  return (
    <div className="p-6 bg-base-300 min-h-screen">
      {/* Header com título e usuário */}
      <div className="md:flex hidden navbar bg-base-100 mb-4 shadow-sm">
        <div className="ps-4">
          <a className="text-lg font-bold">(nome plataforma)</a>
        </div>
        <div className="flex grow justify-end px-2">
          <div className="flex items-stretch">
            {authorized && (
              <>
                <p className="btn btn-ghost">Olá, {user?.nome}!</p>
                <a className="btn rounded-field" onClick={logout}>
                  <CiLogin /> Sair
                </a>
              </>
            )}
            {!authorized && (
              <a className="btn rounded-field" href="/login">
                <CiLogout className="size-[1.2em]" />
                Entrar
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col max-w-[1024px] mx-auto">
        <div className="flex flex-col md:flex-col gap-6 min-h-screen">
          {/* Barra Lateral de Filtros */}
          <div
            className={`transition-all duration-300 ${
              // Mobile: overlay
              isSidebarExpanded
                ? "fixed inset-0 z-50 bg-base-300 md:static md:bg-transparent"
                : "hidden md:block"
            }`}
          >
            <div
              className={`bg-base-100 border-base-300 border rounded-xl p-4 md:p-6 h-full md:h-auto md:sticky md:top-6 overflow-y-auto transition-all duration-300`}
            >
              {/* Header da Sidebar */}
              <div
                className="flex justify-between items-center"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                <h2 className="font-bold text-lg">Filtros</h2>

                <div className="flex gap-2">
                  {/* Botão colapsar/expandir no desktop */}
                  <button
                    className="btn btn-circle btn-sm hidden md:flex"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  >
                    {isSidebarCollapsed ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronUp className="rotate-180" />
                    )}
                  </button>

                  {/* Botão para fechar em mobile */}
                  <button
                    className="btn btn-circle btn-sm md:hidden"
                    onClick={() => setIsSidebarExpanded(false)}
                  >
                    <FaX size={14} />
                  </button>
                </div>
              </div>
              {/* Conteúdo dos Filtros */}
              {(isSidebarExpanded || !isSidebarCollapsed) && (
                <div className="space-y-6">
                  {/* Modo de visualização */}
                  <div className="bg-base-200 p-4 rounded-xl shadow">
                    <label className="label cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="label-text font-bold whitespace-nowrap">
                          Modo de Visualização:
                        </span>
                        <input
                          type="checkbox"
                          className="toggle"
                          checked={modoCarrossel}
                          onChange={(e) => setModoCarrossel(e.target.checked)}
                        />
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="label-text text-sm sm:text-base">
                          {modoCarrossel
                            ? "Modo Estudo Aprofundado"
                            : "Modo Simulado"}
                        </span>
                        <div
                          className="tooltip tooltip-right sm:tooltip-bottom"
                          data-tip="🔹 Estudo Aprofundado: mostra uma questão por vez (recomendado).
                          🔹 Simulado: exibe todas as questões de uma vez."
                        >
                          <FaExclamationCircle className="text-gray-500 cursor-help text-sm sm:text-base" />
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Assuntos selecionados */}
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                      <h3 className="font-bold text-lg">
                        Assuntos Selecionados:
                      </h3>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          className="btn btn-sm btn-outline flex-1 sm:flex-none"
                          onClick={handleAdicionarAssunto}
                        >
                          + Adicionar Assunto
                        </button>
                      </div>
                    </div>

                    {assuntosSelecionados.map((assunto, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 mb-4 bg-base-100 p-4 rounded-lg border border-base-300"
                      >
                        {/* Grid para os selects - ajustado para sidebar */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <select
                            className="select select-bordered w-full select-sm"
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
                            className="select select-bordered w-full select-sm"
                            value={assunto.unidade}
                            onChange={(e) =>
                              handleAssuntoChange(
                                index,
                                "unidade",
                                e.target.value
                              )
                            }
                            disabled={!assunto.ano}
                          >
                            <option value="">Unidade</option>
                            {getUnidadesPorAno(assunto.ano).map((u, i) => (
                              <option key={i}>{u.nome}</option>
                            ))}
                          </select>

                          <select
                            className="select select-bordered w-full select-sm"
                            value={assunto.topico}
                            onChange={(e) =>
                              handleAssuntoChange(
                                index,
                                "topico",
                                e.target.value
                              )
                            }
                            disabled={!assunto.unidade}
                          >
                            <option value="">Tópico</option>
                            {getTopicosPorUnidade(
                              assunto.ano,
                              assunto.unidade
                            ).map((t, i) => (
                              <option key={i}>{t.nome}</option>
                            ))}
                          </select>

                          <select
                            className="select select-bordered w-full select-sm"
                            value={assunto.subtopico}
                            onChange={(e) =>
                              handleAssuntoChange(
                                index,
                                "subtopico",
                                e.target.value
                              )
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
                          {/* Botão de remover */}
                          <div className="flex justify-center">
                            <button
                              className="btn btn-error btn-sm w-full"
                              onClick={() => handleRemoverAssunto(index)}
                              disabled={assuntosSelecionados.length === 1}
                            >
                              <FaX className="mr-2" size={10} />
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Validação quantidade vs assuntos */}
                    {assuntosSelecionados.length > 0 &&
                      quantidade < assuntosSelecionados.length && (
                        <div className="alert alert-warning mb-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="stroke-current shrink-0 h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          <div>
                            <h3 className="font-bold">Atenção!</h3>
                            <div className="text-xs">
                              <p>
                                Quantidade de questões ({quantidade}) é menor
                                que a quantidade de assuntos (
                                {assuntosSelecionados.length}).
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Filtros de quantidade, nível e botão */}
                    <div className="bg-base-200 p-4 rounded-xl shadow mt-4">
                      {/* Quantidade */}
                      <div className="space-y-2 mb-4">
                        <label className="label py-0">
                          <span className="label-text font-bold">
                            Quantidade de Questões
                          </span>
                          <span className="label-text-alt">
                            Min: {Math.max(1, assuntosSelecionados.length)}
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={Math.max(1, assuntosSelecionados.length)}
                            max={20}
                            value={quantidade}
                            onChange={(e) =>
                              setQuantidade(Number(e.target.value))
                            }
                            className="range range-xs range-primary flex-1"
                          />
                          <span
                            className={`badge badge-lg min-w-[3rem] justify-center ${
                              quantidade < assuntosSelecionados.length
                                ? "badge-warning"
                                : "badge-primary"
                            }`}
                          >
                            {quantidade}
                          </span>
                        </div>
                      </div>

                      {/* Nível de Dificuldade */}
                      <div className="space-y-2 mb-4">
                        <label className="label py-0">
                          <span className="label-text font-bold">
                            Nível de Dificuldade
                          </span>
                        </label>
                        <div className="join join-vertical w-full">
                          <input
                            className="join-item btn btn-sm"
                            type="radio"
                            name="dificuldade"
                            aria-label="Fácil"
                            value="fácil"
                            checked={nivelDificuldade === "fácil"}
                            onChange={(e) =>
                              setNivelDificuldade(e.target.value)
                            }
                          />
                          <input
                            className="join-item btn btn-sm"
                            type="radio"
                            name="dificuldade"
                            aria-label="Médio"
                            value="médio"
                            checked={nivelDificuldade === "médio"}
                            onChange={(e) =>
                              setNivelDificuldade(e.target.value)
                            }
                          />
                          <input
                            className="join-item btn btn-sm"
                            type="radio"
                            name="dificuldade"
                            aria-label="Difícil"
                            value="difícil"
                            checked={nivelDificuldade === "difícil"}
                            onChange={(e) =>
                              setNivelDificuldade(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      {/* Botão Gerar Questões */}
                      <div className="space-y-2">
                        <button
                          className="btn btn-primary w-full"
                          disabled={
                            cooldown > 0 ||
                            isPending ||
                            assuntosSelecionados.length === 0 ||
                            !validarAssuntosCompletos()
                          }
                          onClick={handleGerarQuestoes}
                        >
                          {isPending ? (
                            <>
                              <span className="loading loading-spinner loading-sm"></span>
                              Gerando...
                            </>
                          ) : cooldown > 0 ? (
                            `Aguarde ${cooldown}s`
                          ) : (
                            <>
                              <FaPlay className="mr-2" />
                              Gerar Questões
                            </>
                          )}
                        </button>
                        {cooldown > 0 && (
                          <progress
                            className="progress progress-primary w-full"
                            value={cooldown}
                            max={60}
                          ></progress>
                        )}
                      </div>

                      {/* Informações resumidas */}
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Assuntos selecionados:</span>
                          <span className="badge badge-info">
                            {assuntosSelecionados.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Questões por assunto:</span>
                          <span className="badge badge-success">
                            ~
                            {assuntosSelecionados.length > 0
                              ? Math.round(
                                  quantidade / assuntosSelecionados.length
                                )
                              : 0}
                          </span>
                        </div>
                        {assuntosSelecionados.length > 0 && (
                          <div className="text-xs opacity-75 mt-2">
                            Anos: {getAnosSelecionados().join(", ")}
                          </div>
                        )}
                      </div>

                      {/* Mensagem de validação */}
                      {!validarAssuntosCompletos() && (
                        <div className="alert alert-error mt-3 py-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="stroke-current shrink-0 h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-xs">
                            Preencha todos os campos dos assuntos
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Botão para abrir filtros em mobile */}
          <div className="md:hidden mb-4">
            <button
              className="btn btn-primary w-full"
              onClick={() => setIsSidebarExpanded(true)}
            >
              <FaFilter className="mr-2" />
              Abrir Filtros
            </button>
          </div>
          {/* Mensagem quando não há questões */}
          {!isPending && (!questoes || questoes.length === 0) && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaChartBar className="text-4xl text-base-content/30" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Nenhuma questão gerada
                </h3>
                <p className="text-base-content/70 mb-6">
                  Use os filtros para criar questões personalizadas sobre os
                  assuntos que você deseja praticar.
                </p>
                <div className="space-y-2 text-sm text-base-content/60">
                  <p>🎯 Selecione os assuntos desejados</p>
                  <p>📚 Escolha a quantidade e dificuldade</p>
                  <p>🚀 Clique em "Gerar Questões"</p>
                </div>
              </div>
            </div>
          )}
          {/* Conteúdo Principal */}
          <div className="flex flex-col">
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
                  <h2 className="sm:text-2xl font-bold">Questões</h2>
                  {/* <button className="btn btn-secondary" onClick={gerarPDF}>
                Imprimir PDF
              </button> */}
                </div>

                <div className="space-y-6">
                  {(questoes as QuestaoInterface[]).map((q, idx) => (
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
                          {Object.entries(q.alternativas).map(
                            ([letra, texto]) => (
                              <label
                                key={letra}
                                className="flex items-center gap-2"
                              >
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
                                  <strong>{letra})</strong>{" "}
                                  <LatexText text={texto} />
                                </span>
                              </label>
                            )
                          )}
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
              <div className={`mt-6 sm:text-xl`}>
                <div className="flex justify-between items-center mb-4">
                  <button className="btn btn-secondary" onClick={gerarPDF}>
                    Imprimir PDF
                  </button>
                </div>

                <div className="card bg-base-100 shadow-md border border-base-300">
                  <div className="card-body min-h-[500px] flex flex-col justify-between sm:text-xl">
                    {questoes && questoes.length > 0 && (
                      <progress
                        className="progress progress-primary w-full h-4"
                        value={Object.keys(respondidas).length}
                        max={questoes.length}
                      ></progress>
                    )}
                    {/* Etapa 0: Mostrar questão e alternativas */}
                    {etapaCarrossel === 0 && (
                      <>
                        <div className="flex justify-between items-center">
                          <h2 className="card-title">
                            Questão {questaoAtual + 1}
                          </h2>
                          <button
                            className="text-red-500 hover:text-red-700"
                            title="Denunciar questão"
                          >
                            <FaExclamationCircle size={20} />
                          </button>
                        </div>

                        <div className="mb-4">
                          <LatexText
                            text={
                              (questoes[questaoAtual] as QuestaoInterface)
                                .enunciado
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          {Object.entries(
                            (questoes[questaoAtual] as QuestaoInterface)
                              .alternativas
                          ).map(([letra, texto]) => (
                            <label
                              key={letra}
                              className="flex items-center gap-2"
                            >
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
                                <strong>{letra})</strong>{" "}
                                <LatexText text={texto} />
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
                        (questoes[questaoAtual] as QuestaoInterface)
                          .correta && (
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
                            <p className="mt-2">
                              Vamos entender por que essa alternativa está
                              errada...
                            </p>
                          </div>
                          <div className="p-4 rounded-lg mb-4">
                            <LatexText
                              text={
                                (questoes[questaoAtual] as QuestaoInterface)
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
                            {
                              (questoes[questaoAtual] as QuestaoInterface)
                                .correta
                            }
                            .
                          </p>
                        </div>
                        <div className="p-4 rounded-lg mb-4">
                          <LatexText
                            text={
                              (questoes[questaoAtual] as QuestaoInterface)
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
                        (questoes[questaoAtual] as QuestaoInterface)
                          .correta && (
                        <>
                          <h2 className="card-title text-green-600">
                            Resposta Correta!
                          </h2>
                          <div className="mb-4">
                            <p>
                              Você acertou a alternativa{" "}
                              {
                                (questoes[questaoAtual] as QuestaoInterface)
                                  .correta
                              }
                              .
                            </p>
                          </div>
                          <div className="p-4 rounded-lg mb-4">
                            <LatexText
                              text={
                                (questoes[questaoAtual] as QuestaoInterface)
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

            {/* Modal de Performance */}
            <PerformanceModal
              isOpen={showPerformanceModal}
              onClose={() => setShowPerformanceModal(false)}
              desempenho={desempenho}
              onTentarNovamente={handleTentarNovamente}
              onAumentarDificuldade={handleAumentarDificuldade}
              onMudarAssunto={handleMudarAssunto}
            />
          </div>

          {/* Dock - Apenas em mobile */}
          <div className="md:hidden dock dock-md">
            <button className="dock-active">
              <FaNewspaper className="size-[1.2em]" />
              <span className="dock-label">Questões</span>
            </button>

            {authorized && (
              <button onClick={logout}>
                <CiLogout className="size-[1.2em]" />
                <span className="dock-label">Sair</span>
              </button>
            )}
            {!authorized && (
              <a href="/login">
                <CiLogin className="size-[1.2em]" />
                <span className="dock-label">Entrar</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
