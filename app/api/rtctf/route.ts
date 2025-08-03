import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Security and rate limiting
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Security headers and validation
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  record.count++;
  return false;
}

function validateRequest(request: Request): { isValid: boolean; error?: string } {
  // Validate content type
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return { isValid: false, error: 'Invalid content type' };
  }
  
  // Validate origin (in production)
  if (process.env.NODE_ENV === 'production') {
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    if (origin && !allowedOrigins.includes(origin)) {
      return { isValid: false, error: 'Invalid origin' };
    }
  }
  
  return { isValid: true };
}

// Security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com;"
  );
  return response;
}

// Função para transformar texto usando RTCTF sem API externa
function transformToRTCTF(text: string, language: 'en' | 'pt' = 'en'): string {
  // Analisar o texto para extrair elementos e intenção
  const lowerText = text.toLowerCase();
  
  // Detectar tipo de tarefa
  const isCreation = lowerText.includes('criar') || lowerText.includes('gerar') || lowerText.includes('desenvolver') || lowerText.includes('fazer') || lowerText.includes('escrever');
  const isAnalysis = lowerText.includes('analis') || lowerText.includes('avaliar') || lowerText.includes('estudar') || lowerText.includes('comparar');
  const isExplanation = lowerText.includes('explicar') || lowerText.includes('ensinar') || lowerText.includes('como') || lowerText.includes('aprender');
  const isPlanning = lowerText.includes('plano') || lowerText.includes('estratégia') || lowerText.includes('organizar');
  
  // Detectar domínio/área
  const isBusinessRelated = lowerText.includes('negócio') || lowerText.includes('empresa') || lowerText.includes('vendas') || lowerText.includes('marketing') || 
                           lowerText.includes('business') || lowerText.includes('company') || lowerText.includes('sales') || lowerText.includes('marketing');
  const isTechRelated = lowerText.includes('programação') || lowerText.includes('código') || lowerText.includes('software') || lowerText.includes('tecnologia') ||
                       lowerText.includes('programming') || lowerText.includes('code') || lowerText.includes('technology') || lowerText.includes('development');
  const isEducationRelated = lowerText.includes('aula') || lowerText.includes('curso') || lowerText.includes('estudar') || lowerText.includes('aprender') ||
                            lowerText.includes('lesson') || lowerText.includes('course') || lowerText.includes('learn') || lowerText.includes('teach');
  
  // Templates de idioma
  const templates = {
    pt: {
      contexts: {
        default: "Este é um pedido que requer atenção aos detalhes e aplicação de melhores práticas.",
        business: "Contexto profissional/empresarial que requer abordagem estratégica e orientada a resultados.",
        tech: "Contexto técnico que requer precisão, melhores práticas e considerações de implementação.", 
        education: "Contexto educacional que requer clareza didática e progressão lógica do aprendizado."
      },
      results: {
        default: "Obter uma resposta completa e estruturada",
        creation: "Criar/desenvolver algo original e funcional com qualidade profissional",
        analysis: "Obter uma análise detalhada com insights acionáveis e conclusões fundamentadas",
        explanation: "Receber uma explicação clara, didática e progressiva do tema",
        planning: "Desenvolver um plano estruturado com etapas claras e cronograma"
      },
      criteria: {
        base: [
          "Seja preciso e objetivo na resposta",
          "Use linguagem clara e profissional", 
          "Baseie-se em informações confiáveis e atualizadas",
          "Mantenha foco no objetivo principal"
        ],
        business: ["Considere viabilidade comercial e ROI", "Use dados e métricas quando possível"],
        tech: ["Considere escalabilidade e manutenibilidade", "Inclua melhores práticas e padrões"],
        education: ["Use exemplos práticos e analogias", "Estruture de forma progressiva"]
      },
      template: `
**PROMPT OTIMIZADO USANDO METODOLOGIA RTCTF:**

**R (Resultado Desejado):** 
{expectedResult} sobre o tema solicitado, com aplicabilidade prática e valor agregado.

**T (Tarefa Específica):** 
{text}

**C (Contexto Relevante):** 
{specificContext} Considere as nuances e complexidades do tema, bem como a aplicabilidade prática no contexto atual.

**C (Critérios e Restrições):** 
{criteria}
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
"{text}

Por favor, forneça uma resposta abrangente e bem estruturada seguindo os critérios acima. Organize o conteúdo de forma lógica e didática, use linguagem clara e profissional, e inclua exemplos práticos quando relevante. Certifique-se de abordar todos os aspectos importantes do tema e conclua com insights acionáveis ou próximos passos recomendados. {contextualHints}"
`
    },
    en: {
      contexts: {
        default: "This is a request that requires attention to detail and application of best practices.",
        business: "Professional/business context that requires strategic approach and results-oriented thinking.",
        tech: "Technical context that requires precision, best practices and implementation considerations.",
        education: "Educational context that requires didactic clarity and logical learning progression."
      },
      results: {
        default: "Obtain a complete and structured response",
        creation: "Create/develop something original and functional with professional quality", 
        analysis: "Obtain a detailed analysis with actionable insights and well-founded conclusions",
        explanation: "Receive a clear, didactic and progressive explanation of the topic",
        planning: "Develop a structured plan with clear steps and timeline"
      },
      criteria: {
        base: [
          "Be precise and objective in the response",
          "Use clear and professional language",
          "Base on reliable and updated information", 
          "Maintain focus on the main objective"
        ],
        business: ["Consider commercial viability and ROI", "Use data and metrics when possible"],
        tech: ["Consider scalability and maintainability", "Include best practices and standards"],
        education: ["Use practical examples and analogies", "Structure progressively"]
      },
      template: `
**OPTIMIZED PROMPT USING RTCTF METHODOLOGY:**

**R (Desired Result):** 
{expectedResult} about the requested topic, with practical applicability and added value.

**T (Specific Task):** 
{text}

**C (Relevant Context):** 
{specificContext} Consider the nuances and complexities of the topic, as well as practical applicability in the current context.

**C (Criteria and Restrictions):** 
{criteria}
- Consider different perspectives when relevant
- Provide practical and actionable examples
- Maintain a professional and assertive tone

**F (Response Format):** 
Structure your response in an organized and professional way:
1. **Introduction/Contextualization:** Brief overview of the topic
2. **Main Development:** Detailed and structured content
3. **Practical Examples:** Concrete cases or applications
4. **Conclusions/Next Steps:** Final insights and actionable recommendations
5. **Additional Resources:** If applicable, suggest references or tools

---

**FINAL CONSOLIDATED PROMPT:**
"{text}

Please provide a comprehensive and well-structured response following the criteria above. Organize the content in a logical and didactic way, use clear and professional language, and include practical examples when relevant. Make sure to address all important aspects of the topic and conclude with actionable insights or recommended next steps. {contextualHints}"
`
    }
  };
  
  
  const t = templates[language];
  
  // Gerar contexto específico baseado na análise
  let specificContext = t.contexts.default;
  if (isBusinessRelated) {
    specificContext = t.contexts.business;
  } else if (isTechRelated) {
    specificContext = t.contexts.tech;
  } else if (isEducationRelated) {
    specificContext = t.contexts.education;
  }

  // Gerar resultado esperado baseado no tipo de tarefa
  let expectedResult = t.results.default;
  if (isCreation) {
    expectedResult = t.results.creation;
  } else if (isAnalysis) {
    expectedResult = t.results.analysis;
  } else if (isExplanation) {
    expectedResult = t.results.explanation;
  } else if (isPlanning) {
    expectedResult = t.results.planning;
  }

  // Gerar critérios específicos
  const specificCriteria = [
    ...t.criteria.base,
    ...(isBusinessRelated ? t.criteria.business : []),
    ...(isTechRelated ? t.criteria.tech : []),
    ...(isEducationRelated ? t.criteria.education : [])
  ];

  // Gerar hints contextuais
  const contextualHints = [
    isBusinessRelated ? (language === 'pt' ? 'Considere aspectos comerciais e de viabilidade.' : 'Consider commercial and viability aspects.') : '',
    isTechRelated ? (language === 'pt' ? 'Inclua melhores práticas técnicas e considerações de implementação.' : 'Include technical best practices and implementation considerations.') : '',
    isEducationRelated ? (language === 'pt' ? 'Use abordagem didática e exemplos esclarecedores.' : 'Use didactic approach and enlightening examples.') : ''
  ].filter(Boolean).join(' ');

  return t.template
    .replace('{expectedResult}', expectedResult)
    .replace('{text}', text)
    .replace('{specificContext}', specificContext)
    .replace('{criteria}', specificCriteria.map(c => `- ${c}`).join('\n'))
    .replace(/{text}/g, text)
    .replace('{contextualHints}', contextualHints);
}

export async function POST(request: Request) {
  try {
    // Security validation
    const validation = validateRequest(request);
    if (!validation.isValid) {
      return addSecurityHeaders(NextResponse.json({ 
        error: 'Invalid request' 
      }, { status: 400 }));
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    if (isRateLimited(clientIP)) {
      const response = NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }, { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString()
        }
      });
      return addSecurityHeaders(response);
    }

    const { text, useAI = false, language = 'en' } = await request.json();
    
    // Input validation
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return addSecurityHeaders(NextResponse.json({ 
        error: language === 'pt' ? 'Texto é obrigatório.' : 'Text is required.' 
      }, { status: 400 }));
    }

    // Text length validation (prevent abuse)
    if (text.length > 10000) {
      return addSecurityHeaders(NextResponse.json({ 
        error: language === 'pt' ? 'Texto muito longo (máximo 10.000 caracteres).' : 'Text too long (maximum 10,000 characters).' 
      }, { status: 400 }));
    }

    // Sempre tentar a versão local primeiro (mais rápida e sem custo)
    const localResult = transformToRTCTF(text, language);

    // Se useAI for true e tiver a chave, tentar OpenAI também
    if (useAI && process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const promptTemplates = {
        en: `
You are an expert in prompt engineering and RTCTF methodology. Your task is to transform the user's text into a structured and optimized prompt.

SPECIFIC RTCTF METHODOLOGY:
- R (Result): What exactly is expected as output/response
- T (Task): The specific action that should be executed
- C (Context): Relevant background information
- C (Criteria): Guidelines, restrictions and quality standards
- F (Format): Structure and presentation of the response

DETAILED INSTRUCTIONS:
1. Analyze the user's text and identify the main intention
2. Extract or deduce elements for each RTCTF component
3. Create a complete, detailed and actionable prompt
4. Use clear and specific language
5. Include examples when relevant
6. Ensure the prompt is self-contained and unambiguous

USER TEXT: """${text}"""

TRANSFORM into a prompt following EXACTLY this structure:

**OPTIMIZED RTCTF PROMPT:**

**R (Desired Result):**
[Describe the specific expected output]

**T (Task):**
[Define the exact action to be executed]

**C (Context):**
[Provide relevant background information]

**C (Criteria and Restrictions):**
[List guidelines, limitations and quality standards]

**F (Format):**
[Specify how to structure the response]

**FINAL CONSOLIDATED PROMPT:**
[Concise and actionable version of the complete prompt]

Be specific, detailed and practical. The final prompt should be something any LLM can execute perfectly.
`,
        pt: `
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
`
      };

      const prompt = promptTemplates[language as keyof typeof promptTemplates];

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: language === 'pt' 
                ? 'Você é um especialista mundial em prompt engineering e metodologia RTCTF. Sua especialidade é criar prompts estruturados, detalhados e altamente eficazes que produzem resultados excepcionais quando usados com LLMs.'
                : 'You are a world expert in prompt engineering and RTCTF methodology. Your specialty is creating structured, detailed and highly effective prompts that produce exceptional results when used with LLMs.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1200,
          temperature: 0.7,
        });

        const aiResult = completion.choices[0].message?.content;
        if (aiResult) {
          return addSecurityHeaders(NextResponse.json({ 
            prompt: aiResult, 
            source: 'AI Enhanced',
            fallback: localResult 
          }));
        }
      } catch (aiError) {
        console.error('OpenAI error:', aiError);
        // Em caso de erro da AI, usa a versão local
      }
    }

    // Retorna a versão local (sempre funciona)
    return addSecurityHeaders(NextResponse.json({ 
      prompt: localResult, 
      source: useAI ? 'Local (AI unavailable)' : 'Local' 
    }));
  } catch (error) {
    console.error(error);
    return addSecurityHeaders(NextResponse.json({ 
      error: 'Erro ao gerar prompt.' 
    }, { status: 500 }));
  }
}
