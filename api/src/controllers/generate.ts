import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import { textPrompt } from "../utils/prompt.ts";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configurações
const BATCH_SIZE = 3;
const REQUEST_DELAY_MS = 1000;

export const handleGenerateQuestions = async (req, res) => {
  const { quantidade, ano, topico, subtopico, nivel } = req.body;
  console.log(req.body);

  try {
    const numBatches = Math.ceil(quantidade / BATCH_SIZE);
    const questionsPerBatch = Math.ceil(quantidade / numBatches);

    console.log(
      `Gerando ${quantidade} questões em ${numBatches} lotes de ${questionsPerBatch} questões cada`
    );

    // Criar promessas de todos os lotes de uma vez
    const batchPromises = Array.from(
      { length: numBatches },
      (_, batchIndex) => {
        const questionsInThisBatch =
          batchIndex === numBatches - 1
            ? quantidade - batchIndex * questionsPerBatch
            : questionsPerBatch;

        if (questionsInThisBatch <= 0) return Promise.resolve([]);

        const delay = batchIndex * REQUEST_DELAY_MS;

        return new Promise((resolve) => {
          setTimeout(async () => {
            try {
              console.log(
                `Processando lote ${
                  batchIndex + 1
                }/${numBatches} com ${questionsInThisBatch} questões`
              );

              const prompt = textPrompt(
                questionsInThisBatch,
                ano,
                topico,
                subtopico,
                nivel
              );

              const response = await client.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
              });

              let text = response.choices[0].message?.content ?? "[]";
              text = text.replace(/```json|```/g, "").trim();

              try {
                const batchData = JSON.parse(text);

                const validatedQuestions = Array.isArray(batchData)
                  ? batchData.map((question) => ({
                      enunciado: question.enunciado || "",
                      alternativas: question.alternativas || {},
                      correta: question.correta || "",
                      justificativaRapida: question.justificativaRapida || "",
                      justificativaDetalhada:
                        question.justificativaDetalhada || "",
                      justificativaAlternativasErradas:
                        question.justificativaAlternativasErradas || {},
                    }))
                  : [];

                console.log(
                  `Lote ${batchIndex + 1} gerou ${
                    validatedQuestions.length
                  } questões válidas`
                );
                resolve(validatedQuestions);
              } catch (parseErr) {
                console.error(
                  `Erro no parse do JSON do lote ${batchIndex + 1}:`,
                  parseErr
                );
                resolve([]);
              }
            } catch (error) {
              console.error(`Erro ao processar lote ${batchIndex + 1}:`, error);
              resolve([]);
            }
          }, delay);
        });
      }
    );

    // Executa todos os lotes em paralelo
    const batchResults = await Promise.all(batchPromises);

    // Junta tudo
    const allQuestions = batchResults.flat();

    if (allQuestions.length === 0) {
      return res
        .status(500)
        .json({ error: "Não foi possível gerar nenhuma questão" });
    }

    const finalQuestions = allQuestions.slice(0, quantidade);
    console.log(
      `Total de questões válidas: ${finalQuestions.length}/${quantidade}`
    );

    console.log("Salvando questões no banco de dados...");

    const savePromises = finalQuestions.map(async (question, index) => {
      try {
        return await prisma.question.create({
          data: {
            enunciado: question.enunciado,
            alternativas: question.alternativas,
            correta: question.correta,
            justificativaRapida: question.justificativaRapida,
            justificativaDetalhada: question.justificativaDetalhada,
            justificativaAlternativasErradas:
              question.justificativaAlternativasErradas,
            ano,
            topico,
            subtopico,
            nivel,
            userId: req.user.id,
          },
        });
      } catch (dbError) {
        console.error(`Erro ao salvar questão ${index + 1}:`, dbError);
        return null;
      }
    });

    const savedQuestions = await Promise.all(savePromises);
    const successfulQuestions = savedQuestions.filter((q) => q !== null);

    console.log(`Questões salvas com sucesso: ${successfulQuestions.length}`);

    return res.json(successfulQuestions);
  } catch (err) {
    console.error("Erro geral:", err);
    return res.status(500).json({ error: "Erro ao gerar questões" });
  }
};
function safeJsonParse(text: string, batchIndex: number) {
  try {
    let clean = text.replace(/```json|```/g, "").trim();

    // Tenta extrair apenas o JSON que começa com [ e termina com ]
    const match = clean.match(/\[.*\]/s);
    if (!match) throw new Error("Nenhum array JSON encontrado");
    clean = match[0];

    // Corrige backslashes inválidos
    clean = clean.replace(/\\(?![nrtbf"\\\/u])/g, "\\\\");

    return JSON.parse(clean);
  } catch (err: any) {
    console.error(
      `❌ Erro no parse do JSON do lote ${batchIndex + 1}:`,
      err.message
    );
    return [];
  }
}

export const exportLastQuestions = async (req, res) => {
  try {
    // Buscar as 5 últimas questões ordenadas por ID decrescente (ou createdAt)
    const lastQuestions = await prisma.question.findMany({
      take: 5,
      orderBy: {
        id: "desc", // Ou usar createdAt: 'desc' se preferir pela data
      },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    // Formatar os dados para o JSON
    const questionsData = {
      exportDate: new Date().toISOString(),
      totalQuestions: lastQuestions.length,
      questions: lastQuestions.map((question) => ({
        id: question.id,
        enunciado: question.enunciado,
        alternativas: question.alternativas,
        correta: question.correta,
        justificativaRapida: question.justificativaRapida,
        justificativaDetalhada: question.justificativaDetalhada,
        justificativaAlternativasErradas:
          question.justificativaAlternativasErradas,
        ano: question.ano,
        topico: question.topico,
        subtopico: question.subtopico,
        nivel: question.nivel,
        author: {
          id: question.user.id,
          nome: question.user.nome,
          email: question.user.email,
        },
        createdAt: question.createdAt,
      })),
    };

    // Criar nome do arquivo com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `last-questions-${timestamp}.json`;
    const filePath = path.join(process.cwd(), "exports", filename);

    // Garantir que o diretório exports existe
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Salvar o arquivo JSON
    await fs.writeFile(
      filePath,
      JSON.stringify(questionsData, null, 2),
      "utf-8"
    );

    res.json({
      success: true,
      message: "Questões exportadas com sucesso",
      filename: filename,
      filePath: filePath,
      totalQuestions: lastQuestions.length,
      exportDate: questionsData.exportDate,
    });
  } catch (error) {
    console.error("Erro ao exportar questões:", error);
    res.status(500).json({
      error: "Erro interno do servidor ao exportar questões",
      details: error.message,
    });
  }
};
