// app/questoes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useGerarQuestoes } from "@/hooks/useGerarQuestoes";
import { FaExclamationCircle } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

const estruturaMock = [
  {
    ano: "1º ano",
    unidades: [
      {
        nome: "I",
        topicos: [
          {
            nome: "Conjuntos",
            subTopicos: [
              "Noção de conjunto",
              "Propriedades",
              "Igualdade de conjuntos",
              "Conjunto vazio, unitário e universo",
              "Subconjuntos e a relação de inclusão",
              "Conjunto das partes",
              "Complementar de um conjunto",
              "Operações com conjuntos",
            ],
          },
          {
            nome: "Conjuntos Numéricos",
            subTopicos: [
              "Conjunto dos números naturais",
              "Conjunto dos números inteiros",
              "Conjunto dos números racionais",
              "Conjunto dos números irracionais",
              "Conjunto dos números reais",
              "Intervalos",
              "Situações problemas",
            ],
          },
          {
            nome: "Funções",
            subTopicos: [
              "Noção intuitiva de função",
              "Noção de função via conjuntos",
              "Domínio, contradomínio e imagem",
              "Gráfico de uma função",
              "Análise de gráfico",
              "Função injetiva, sobrejetiva e bijetiva",
              "Função composta",
              "Função inversa",
            ],
          },
        ],
      },
      {
        nome: "II",
        topicos: [
          {
            nome: "Função afim",
            subTopicos: [
              "Conceitos e definições",
              "Casos particulares da função afim",
              "Valor de uma função afim",
              "Taxa de variação de uma função",
              "Gráfico da função afim",
              "Função afim crescente e decrescente",
              "Estudo do sinal da função afim",
              "Inequações do 1º grau com uma variável em R",
              "Resolução de inequações",
              "Sistemas de inequações do 1º grau",
              "Inequação - produto e inequação quociente",
            ],
          },
          {
            nome: "Função quadrática",
            subTopicos: [
              "Introdução e conceitos básicos",
              "Situações em que aparece a função quadrática",
              "Valor da função quadrática em um ponto",
              "Zero da função quadrática",
              "Gráfico da função quadrática",
              "A parábola e suas intersecções com os eixos",
              "Imagem da função quadrática",
              "Estudo do sinal da função quadrática",
              "Inequações do 2º grau",
            ],
          },
        ],
      },
      {
        nome: "III",
        topicos: [
          {
            nome: "Função Modular",
            subTopicos: [
              "Definição",
              "Propriedades",
              "Gráfico da função modular",
              "Equações e inequações modulares",
            ],
          },
          {
            nome: "Função Exponencial",
            subTopicos: [
              "Revisão de potenciação",
              "Simplificação de expressões",
              "Função exponencial",
              "Equações exponenciais",
              "Inequações exponenciais",
            ],
          },
          {
            nome: "Logaritmo e função logarítmica",
            subTopicos: [
              "Logaritmo",
              "Função logarítmica",
              "Equações logarítmicas",
            ],
          },
        ],
      },
      {
        nome: "IV",
        topicos: [
          {
            nome: "Sequências numéricas",
            subTopicos: [
              "Lei de formação de uma sequência",
              "Progressões aritméticas",
              "Lei de formação de uma PA",
              "Soma de termos de uma PA",
              "Progressões Geométricas",
              "Lei de formação de uma PG",
              "Soma de n termos de uma PG",
              "Soma de termos de uma PG convergente",
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
              "O triângulo Retângulo",
              "Teorema de Pitágoras",
              "Relações métricas",
              "Razões trigonométricas no triângulo retângulo",
              "O ciclo trigonométrico",
              "Relação entre arcos e ângulos",
              "Arcos côngruos e ângulos côngruos",
              "O seno, o cosseno e a tangente no ciclo",
              "A trigonometria num triângulo qualquer",
              "Lei dos cossenos",
              "Lei dos senos",
              "A função Seno",
              "Propriedades da função seno (domínio, período e imagem)",
              "Gráfico da função seno",
              "A função cosseno",
              "Propriedades da função cosseno (domínio, período e imagem)",
              "Gráfico da função cosseno",
              "A função tangente",
              "Propriedades da função tangente (domínio, período e imagem)",
              "Gráfico da função tangente",
            ],
          },
        ],
      },
      {
        nome: "II",
        topicos: [
          {
            nome: "Matrizes",
            subTopicos: [
              "O conceito de matriz",
              "Tipos de matrizes",
              "Operações com matrizes",
              "A matriz inversa",
              "Determinante de uma matriz quadrada",
              "Algoritmos para o cálculo de determinantes (Regra de Sarrus, Teorema de Laplace, Teorema de Chió)",
              "Propriedades dos determinantes",
            ],
          },
          {
            nome: "Sistemas Lineares",
            subTopicos: [
              "Conceito de sistema linear",
              "Representação de um sistema através de uma equação matricial",
              "Regra de Cramer",
              "Escalonamento de sistemas lineares",
              "Discussão de um sistema",
            ],
          },
        ],
      },
      {
        nome: "III",
        topicos: [
          {
            nome: "Alguns conceitos de Geometria Plana",
            subTopicos: [
              "Polígonos",
              "Polígonos regulares",
              "Área das principais superfícies poligonais planas",
              "Circunferência e círculo",
              "Área do círculo",
            ],
          },
          {
            nome: "Geometria Espacial",
            subTopicos: [
              "Ideias gerais",
              "Pontos, retas e planos",
              "Posições relativas",
              "Projeção ortogonal e distância",
              "Estudo dos poliedros",
              "Prismas: áreas e volumes",
              "Pirâmides: áreas e volumes",
              "Tronco de pirâmide reta",
              "Cilindro",
              "Cone",
              "Esfera",
            ],
          },
        ],
      },
      {
        nome: "IV",
        topicos: [
          {
            nome: "Análise Combinatória e probabilidade e tratamento da informação",
            subTopicos: [
              "Contagem",
              "Fatorial de um número natural",
              "Permutações",
              "Arranjo simples",
              "Combinação simples",
              "Triângulo de Pascal",
              "Binômio de Newton",
              "Introdução ao estudo das probabilidades",
            ],
          },
        ],
      },
    ],
  },
  {
    ano: "3º ano",
    unidades: [
      {
        nome: "I",
        topicos: [
          {
            nome: "Matemática financeira",
            subTopicos: [
              "Porcentagem",
              "Taxa Percentual",
              "Juros Simples",
              "Desconto comercial simples",
              "Juros Compostos",
              "Valor atual na capitalização composta",
              "Tratamento da informação a partir dos conceitos da Matemática Financeira",
            ],
          },
        ],
      },
      {
        nome: "II",
        topicos: [
          {
            nome: "Estatística Básica",
            subTopicos: [
              "Noções de estatística",
              "Distribuição de frequências",
              "Representações gráficas",
              "Histogramas e Polígono de frequência",
              "Tratamento da informação a partir dos conceitos estatísticos",
              "Aplicações da Estatística em situações problemas",
              "Estudo de gráficos e tabelas envolvendo informações estatísticas",
            ],
          },
        ],
      },
      {
        nome: "III",
        topicos: [
          {
            nome: "Geometria Analítica",
            subTopicos: [
              "O ponto",
              "Ponto médio",
              "Distância entre pontos",
              "A reta",
              "Posições relativas entre retas no plano",
              "Distância entre ponto e reta",
              "Medida da superfície triangular a partir dos seus vértices",
              "Problemas com distâncias",
            ],
          },
        ],
      },
      {
        nome: "IV",
        topicos: [
          {
            nome: "Circunferências",
            subTopicos: [
              "Equações da circunferência",
              "Posições relativas entre circunferências",
            ],
          },
          {
            nome: "Cônicas",
            subTopicos: [
              "Secções cônicas",
              "A elipse",
              "A parábola",
              "A hipérbole",
            ],
          },
        ],
      },
    ],
  },
];

// Componente para renderizar texto que pode conter equações LaTeX
const LatexText = ({ text }: { text: string }) => {
  // Divide o texto em partes normais e equações LaTeX
  const parts = text.split(/(\$.*?\$)/);

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

  // respostas confirmadas
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  // alternativas escolhidas antes de confirmar
  const [selecionadas, setSelecionadas] = useState<Record<number, string>>({});
  // status de bloqueio (já respondeu)
  const [respondidas, setRespondidas] = useState<Record<number, boolean>>({});

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
    setSelecionadas({});
    setRespondidas({});
  };

  const confirmarResposta = (idx: number) => {
    if (!selecionadas[idx]) return; // só confirma se tiver selecionado algo
    setRespostas((prev) => ({ ...prev, [idx]: selecionadas[idx] }));
    setRespondidas((prev) => ({ ...prev, [idx]: true }));
  };

  const gerarPDF = () => {
    if (!questoes) return;

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Lista de Questões", 14, 10);

    // Para o PDF, vamos usar texto simples (sem formatação LaTeX)
    questoes.forEach((q, idx) => {
      autoTable(doc, {
        head: [[`Questão ${idx + 1}`]],
        body: [
          [q.enunciado.replace(/\$/g, "")], // Remove os marcadores $ para o PDF
          ...Object.entries(q.alternativas).map(([letra, texto]) => [
            `${letra}) ${texto.replace(/\$/g, "")}`,
          ]),
          [`Correta: ${q.correta}`],
          [`Justificativa: ${q.justificativa.replace(/\$/g, "")}`],
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
                      disabled={respondidas[idx]} // bloqueia depois de responder
                      checked={selecionadas[idx] === letra}
                      onChange={() =>
                        setSelecionadas((prev) => ({ ...prev, [idx]: letra }))
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
                    <LatexText text={q.justificativa} />
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
