import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Função para transformar texto usando RTCTF sem API externa
function transformToRTCTF(text: string): string {
  // Analisar o texto para extrair elementos
  const isCreationTask = text.toLowerCase().includes('criar') || text.toLowerCase().includes('gerar') || text.toLowerCase().includes('desenvolver');
  const isAnalysisTask = text.toLowerCase().includes('analis') || text.toLowerCase().includes('avaliar') || text.toLowerCase().includes('estudar');
  
  return `
**PROMPT OTIMIZADO USANDO METODOLOGIA RTCTF:**

**R (Resultado Desejado):** 
${isCreationTask ? 'Criar/desenvolver' : isAnalysisTask ? 'Analisar e fornecer insights sobre' : 'Obter uma resposta completa e estruturada sobre'} o que foi solicitado, com qualidade profissional e aplicabilidade prática.

**T (Tarefa Específica):** 
${text}

**C (Contexto Relevante):** 
Este é um pedido que requer atenção aos detalhes, aplicação de melhores práticas e consideração das nuances do tema. Leve em conta a aplicabilidade prática e a relevância atual do assunto.

**C (Critérios e Restrições):** 
- Seja preciso e objetivo na resposta
- Use linguagem clara e profissional
- Baseie-se em informações confiáveis e atualizadas
- Mantenha foco no objetivo principal
- Considere diferentes perspectivas quando relevante
- Forneça exemplos práticos quando aplicável

**F (Formato de Resposta):** 
Estruture sua resposta de forma organizada e profissional:
1. Introdução/contextualização do tema
2. Desenvolvimento detalhado do conteúdo principal
3. Conclusões práticas e/ou próximos passos recomendados
4. Se aplicável, inclua exemplos ou referências relevantes

---

**PROMPT FINAL OTIMIZADO:**
"${text}

Por favor, forneça uma resposta abrangente e bem estruturada. Organize o conteúdo de forma lógica, use linguagem clara e profissional, e inclua exemplos práticos quando relevante. Certifique-se de abordar todos os aspectos importantes do tema e conclua com insights acionáveis ou próximos passos recomendados."
`;
}

export async function POST(request: Request) {
  try {
    const { text, useAI = false } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Texto é obrigatório.' }, { status: 400 });
    }

    // Se useAI for true e tiver a chave, usa OpenAI
    if (useAI && process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const prompt = `
Transforme o texto abaixo em um prompt otimizado usando ESTA metodologia RTCTF específica:

R = Resultado desejado (o que se espera obter)
T = Tarefa específica (o que deve ser feito)
C = Contexto relevante (informações de fundo)
C = Critérios e restrições (diretrizes e limitações)
F = Formato de resposta (como estruturar a resposta)

IMPORTANTE: NÃO confunda com outras metodologias RTCTF. Use EXATAMENTE esta definição acima.

Texto do usuário: """${text}"""

Crie um prompt estruturado seguindo EXATAMENTE esta metodologia RTCTF (Resultado, Tarefa, Contexto, Critérios, Formato).
`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Você é um assistente especialista em prompt engineering que ajuda a transformar textos usando a metodologia RTCTF.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 800,
        });

        const transformed = completion.choices[0].message?.content;
        return NextResponse.json({ prompt: transformed, source: 'AI' });
      } catch (aiError) {
        console.error('OpenAI error:', aiError);
        // Se falhar com AI, usa a versão local
        const transformed = transformToRTCTF(text);
        return NextResponse.json({ prompt: transformed, source: 'Local (AI failed)' });
      }
    }

    // Usar transformação local
    const transformed = transformToRTCTF(text);
    return NextResponse.json({ prompt: transformed, source: 'Local' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao gerar prompt.' }, { status: 500 });
  }
}
