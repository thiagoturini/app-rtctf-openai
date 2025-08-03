import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Função para transformar texto usando RTCTF sem API externa
function transformToRTCTF(text: string): string {
  // Analisar o texto para extrair elementos e intenção
  const lowerText = text.toLowerCase();
  
  // Detectar tipo de tarefa
  const isCreation = lowerText.includes('criar') || lowerText.includes('gerar') || lowerText.includes('desenvolver') || lowerText.includes('fazer') || lowerText.includes('escrever');
  const isAnalysis = lowerText.includes('analis') || lowerText.includes('avaliar') || lowerText.includes('estudar') || lowerText.includes('comparar');
  const isExplanation = lowerText.includes('explicar') || lowerText.includes('ensinar') || lowerText.includes('como') || lowerText.includes('aprender');
  const isPlanning = lowerText.includes('plano') || lowerText.includes('estratégia') || lowerText.includes('organizar');
  
  // Detectar domínio/área
  const isBusinessRelated = lowerText.includes('negócio') || lowerText.includes('empresa') || lowerText.includes('vendas') || lowerText.includes('marketing');
  const isTechRelated = lowerText.includes('programação') || lowerText.includes('código') || lowerText.includes('software') || lowerText.includes('tecnologia');
  const isEducationRelated = lowerText.includes('aula') || lowerText.includes('curso') || lowerText.includes('estudar') || lowerText.includes('aprender');
  
  // Gerar contexto específico baseado na análise
  let specificContext = "Este é um pedido que requer atenção aos detalhes e aplicação de melhores práticas.";
  if (isBusinessRelated) {
    specificContext = "Contexto profissional/empresarial que requer abordagem estratégica e orientada a resultados.";
  } else if (isTechRelated) {
    specificContext = "Contexto técnico que requer precisão, melhores práticas e considerações de implementação.";
  } else if (isEducationRelated) {
    specificContext = "Contexto educacional que requer clareza didática e progressão lógica do aprendizado.";
  }
  
  // Gerar resultado esperado baseado no tipo de tarefa
  let expectedResult = "Obter uma resposta completa e estruturada";
  if (isCreation) {
    expectedResult = "Criar/desenvolver algo original e funcional com qualidade profissional";
  } else if (isAnalysis) {
    expectedResult = "Obter uma análise detalhada com insights acionáveis e conclusões fundamentadas";
  } else if (isExplanation) {
    expectedResult = "Receber uma explicação clara, didática e progressiva do tema";
  } else if (isPlanning) {
    expectedResult = "Desenvolver um plano estruturado com etapas claras e cronograma";
  }
  
  // Gerar critérios específicos
  const baseCriteria = [
    "Seja preciso e objetivo na resposta",
    "Use linguagem clara e profissional",
    "Baseie-se em informações confiáveis e atualizadas",
    "Mantenha foco no objetivo principal"
  ];
  
  const specificCriteria = [
    ...baseCriteria,
    ...(isBusinessRelated ? ["Considere viabilidade comercial e ROI", "Use dados e métricas quando possível"] : []),
    ...(isTechRelated ? ["Considere escalabilidade e manutenibilidade", "Inclua melhores práticas e padrões"] : []),
    ...(isEducationRelated ? ["Use exemplos práticos e analogias", "Estruture de forma progressiva"] : [])
  ];
  
  return `
**PROMPT OTIMIZADO USANDO METODOLOGIA RTCTF:**

**R (Resultado Desejado):** 
${expectedResult} sobre o tema solicitado, com aplicabilidade prática e valor agregado.

**T (Tarefa Específica):** 
${text}

**C (Contexto Relevante):** 
${specificContext} Considere as nuances e complexidades do tema, bem como a aplicabilidade prática no contexto atual.

**C (Critérios e Restrições):** 
${specificCriteria.map(c => `- ${c}`).join('\n')}
- Considere diferentes perspectivas quando relevante
- Forneça exemplos práticos e acionáveis
- Mantenha um tom profissional e assertivo

**F (Formato de Resposta):** 
Estruture sua resposta de forma organizada e profissional:
1. **Introdução/Contextualização:** Breve overview do tema
2. **Desenvolvimento Principal:** Conteúdo detalhado e estruturado
3. **Exemplos Práticos:** Casos concretos ou aplicações
4. **Conclusões/Próximos Passos:** Insights finais e recomendações acionáveis
5. **Recursos Adicionais:** Se aplicável, sugira referências ou ferramentas

---

**PROMPT FINAL CONSOLIDADO:**
"${text}

Por favor, forneça uma resposta abrangente e bem estruturada seguindo os critérios acima. Organize o conteúdo de forma lógica e didática, use linguagem clara e profissional, e inclua exemplos práticos quando relevante. Certifique-se de abordar todos os aspectos importantes do tema e conclua com insights acionáveis ou próximos passos recomendados. ${isBusinessRelated ? 'Considere aspectos comerciais e de viabilidade.' : ''} ${isTechRelated ? 'Inclua melhores práticas técnicas e considerações de implementação.' : ''} ${isEducationRelated ? 'Use abordagem didática e exemplos esclarecedores.' : ''}"
`;
}

export async function POST(request: Request) {
  try {
    const { text, useAI = false } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Texto é obrigatório.' }, { status: 400 });
    }

    // Sempre tentar a versão local primeiro (mais rápida e sem custo)
    const localResult = transformToRTCTF(text);

    // Se useAI for true e tiver a chave, tentar OpenAI também
    if (useAI && process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const prompt = `
Você é um especialista em prompt engineering e metodologia RTCTF. Sua tarefa é transformar o texto do usuário em um prompt estruturado e otimizado.

METODOLOGIA RTCTF ESPECÍFICA:
- R (Resultado): O que exatamente se espera como output/resposta
- T (Tarefa): A ação específica que deve ser executada  
- C (Contexto): Informações de background relevantes
- C (Critérios): Diretrizes, restrições e padrões de qualidade
- F (Formato): Estrutura e apresentação da resposta

INSTRUÇÕES DETALHADAS:
1. Analise o texto do usuário e identifique a intenção principal
2. Extraia ou deduza elementos para cada componente RTCTF
3. Crie um prompt completo, detalhado e acionável
4. Use linguagem clara e específica
5. Inclua exemplos quando relevante
6. Garanta que o prompt seja autocontido e não ambíguo

TEXTO DO USUÁRIO: """${text}"""

TRANSFORME em um prompt seguindo EXATAMENTE esta estrutura:

**PROMPT OTIMIZADO RTCTF:**

**R (Resultado Desejado):**
[Descreva o output específico esperado]

**T (Tarefa):**
[Defina a ação exata a ser executada]

**C (Contexto):**
[Forneça informações de background relevantes]

**C (Critérios e Restrições):**
[Liste diretrizes, limitações e padrões de qualidade]

**F (Formato):**
[Especifique como estruturar a resposta]

**PROMPT FINAL CONSOLIDADO:**
[Versão concisa e acionável do prompt completo]

Seja específico, detalhado e prático. O prompt final deve ser algo que qualquer LLM possa executar perfeitamente.
`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Você é um especialista mundial em prompt engineering e metodologia RTCTF. Sua especialidade é criar prompts estruturados, detalhados e altamente eficazes que produzem resultados excepcionais quando usados com LLMs.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1200,
          temperature: 0.7,
        });

        const aiResult = completion.choices[0].message?.content;
        if (aiResult) {
          return NextResponse.json({ 
            prompt: aiResult, 
            source: 'AI Enhanced',
            fallback: localResult 
          });
        }
      } catch (aiError) {
        console.error('OpenAI error:', aiError);
        // Em caso de erro da AI, usa a versão local
      }
    }

    // Retorna a versão local (sempre funciona)
    return NextResponse.json({ 
      prompt: localResult, 
      source: useAI ? 'Local (AI unavailable)' : 'Local' 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao gerar prompt.' }, { status: 500 });
  }
}
