// server.ts
import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import { config } from "dotenv";
import cors from "cors";
config();
const app = express();
app.use(bodyParser.json()).use(cors());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/generate", async (req, res) => {
  const { quantidade, ano, topico, subTopico, modelo } = req.body;
  console.log(req.body);
  // const prompt = `Gere ${quantidade} questão(ões) de matemática do ${ano} do ensino médio, relacionadas ao tema ${topico} e especificamente sobre ${subTopico}.
  // As questões devem seguir rigorosamente as seguintes regras:
  // 1. O enunciado deve ser claro, contextualizado e em português, sem ambiguidades.
  // 2. Devem ser fornecidas 5 alternativas (A, B, C, D, E), todas plausíveis, mas apenas uma correta.
  // 2.1. As alternativas erradas devem ser verossímeis, não óbvias nem absurdas.
  // 2.2. A alternativa correta deve ser inequívoca.
  // 3. Inclua uma justificativa detalhada, explicando por que a resposta correta está certa e, se possível, por que as outras estão erradas.
  // 4. Não adicione explicações fora do JSON.
  // 5. A saída deve ser apenas um JSON válido, exatamente neste formato:
  // [
  //   {
  //     "enunciado": "texto...",
  //     "alternativas": {
  //       "A": "texto...",
  //       "B": "texto...",
  //       "C": "texto...",
  //       "D": "texto...",
  //       "E": "texto..."
  //     },
  //     "correta": "B",
  //     "justificativa": "texto..."
  //   }
  // ]
  // `;

  const prompt = `
  Gere ${quantidade} questão(ões) de matemática do ${ano} do ensino médio de ${topico} sobre ${subTopico}. 
  Evite fazer questões com enunciados muito semelhantes entre si e evite enunciados simples demais com pouco texto, de forma que não sejam triviais.
  As questões devem ter um enunciado claro e 5 alternativas (A, B, C, D, E), sendo apenas uma correta. 
  Forneça também a justificativa da resposta correta. 
  A saída deve ser apenas um JSON nesse formato: 
  [ { "enunciado": "texto...", "alternativas": { "A": "texto...", "B": "texto...", "C": "texto...", "D": "texto...", "E": "texto..." }, "correta": "B", "justificativa": "texto..." } ]
  Para questões com equações, retorne apenas a parte do enunciado ou da alternativa que é uma equação em latex.
  `;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-5",
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

    return res.json(data); // <- sempre encerre com `return`
  } catch (err) {
    console.error("Erro geral:", err);
    return res.status(500).json({ error: "Erro ao gerar questões" });
  }
});

app.listen(3001, () => console.log("API rodando na porta 3001"));
