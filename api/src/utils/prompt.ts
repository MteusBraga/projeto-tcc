export function textPrompt(
  quantidade: number,
  ano: string,
  topico: string,
  subtopico: string,
  nivel: string
) {
  console.log("quantidade: ", quantidade);
  return `Gere ${quantidade} questão(ões) de matemática do ${ano} do ensino médio sobre ${topico}, especificamente sobre ${subtopico}.

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
 Use APENAS caracteres UTF-8 normais (não use sequências Unicode escapadas como \\u00e9).
 Para equações matemáticas, use formatação LaTeX entre cifrões $...$.
 Ao gerar LaTeX dentro de strings JSON, use sempre \\\\ em vez de \\ para comandos LaTeX. Por exemplo, use \\\\frac{a}{b} em vez de \\frac{a}{b}.
 Mantenha o texto em português do Brasil com acentuação correta.
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
}
