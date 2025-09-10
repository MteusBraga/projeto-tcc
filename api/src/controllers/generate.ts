import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const handleGenerateQuestions = async (req, res) => {
  const { quantidade, ano, topico, subtopico, nivel } = req.body;
  console.log(req.body);

  const prompt = `
Gere ${quantidade} questão(ões) de matemática do ${ano} do ensino médio sobre ${topico}, especificamente sobre ${subtopico}.

REGRAS IMPORTANTES:
1. Gere exatamente ${quantidade} questões.
2. Evite questões com enunciados muito semelhantes entre si
3. Evite enunciados simples demais com pouco texto
4. As questões devem ter um enunciado claro e 5 alternativas (A, B, C, D, E), sendo apenas uma correta
5. Forneça também uma justificativa resumida do porquê da resposta correta
6. Forneça uma justificativa detalhada explicando um pouco do assunto da questão e com o passo a passo para resolver a questão
7. A justificativa deve ser didática, como se fosse para um estudante que está aprendendo o assunto
8. Forneça uma justificativa do porquê as alternativas erradas estão erradas com detalhes e explicações
9. Use o nível de dificuldade ${nivel}
10. Nunca forneça explicações fora do JSON
11. A saída deve ser APENAS um JSON válido, exatamente neste formato (sem comentários):
INSTRUÇÕES IMPORTANTES:
 Use APENAS caracteres UTF-8 normais (não use sequências Unicode escapadas como \\u00e9)
 Para equações matemáticas, use formatação LaTeX entre cifrões $...$
 Mantenha o texto em português do Brasil com acentuação correta
FORMATO DA RESPOSTA (APENAS JSON):
[{
  "enunciado": "texto com $equações$ em LaTeX quando necessário",
  "alternativas": {
    "A": "texto da alternativa A",
    "B": "texto da alternativa B", 
    "C": "texto da alternativa C",
    "D": "texto da alternativa D",
    "E": "texto da alternativa E"
  },
  "correta": "B",
  "justificativaRapida": "explicação com $equações$ quando necessário"
  "justificativaDetalhada": "explicação detalhada com $equações$ quando necessário"
  "justificativaAlternativasErradas": "explicação do porquê as alternativas erradas estão erradas com $equações$ quando necessário"
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    let text = response.choices[0].message?.content ?? "[]";
    text = text.replace(/```json|```/g, "").trim();
    console.log("Resposta do modelo:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error("Erro no parse do JSON:", parseErr);
      return res.status(500).json({ error: "Resposta inválida do modelo" });
    }

    // Salvar questões no banco de dados
    const savedQuestions = [];
    for (const question of data) {
      const savedQuestion = await prisma.question.create({
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
      savedQuestions.push(savedQuestion);
    }

    return res.json(savedQuestions);
  } catch (err) {
    console.error("Erro geral:", err);
    return res.status(500).json({ error: "Erro ao gerar questões" });
  }
};
