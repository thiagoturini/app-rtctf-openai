import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Security and rate limiting - more permissive for better UX
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000');
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
  // Basic validation only - more permissive for better UX
  const contentType = request.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    return { isValid: false, error: 'Invalid content type' };
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

// Função para transformar texto usando RTCTF correto (Role, Task, Context, Tone, Format)
function transformToRTCTF(text: string, language: 'en' | 'pt' = 'en'): string {
  // Analisar o texto para extrair elementos e intenção
  const lowerText = text.toLowerCase();
  
  // Detectar tipo de tarefa
  const isCreation = lowerText.includes('criar') || lowerText.includes('gerar') || lowerText.includes('desenvolver') || lowerText.includes('fazer') || lowerText.includes('create') || lowerText.includes('generate') || lowerText.includes('develop') || lowerText.includes('make');
  const isAnalysis = lowerText.includes('analis') || lowerText.includes('avaliar') || lowerText.includes('estudar') || lowerText.includes('analy') || lowerText.includes('evaluate') || lowerText.includes('study');
  const isExplanation = lowerText.includes('explicar') || lowerText.includes('ensinar') || lowerText.includes('como') || lowerText.includes('explain') || lowerText.includes('teach') || lowerText.includes('how');
  const isPlanning = lowerText.includes('plano') || lowerText.includes('estratégia') || lowerText.includes('organizar') || lowerText.includes('plan') || lowerText.includes('strategy') || lowerText.includes('organize');
  
  // Detectar domínio/área
  const isBusinessRelated = lowerText.includes('negócio') || lowerText.includes('empresa') || lowerText.includes('vendas') || lowerText.includes('marketing') || 
                           lowerText.includes('business') || lowerText.includes('company') || lowerText.includes('sales');
  const isTechRelated = lowerText.includes('programação') || lowerText.includes('código') || lowerText.includes('software') || lowerText.includes('tecnologia') ||
                       lowerText.includes('programming') || lowerText.includes('code') || lowerText.includes('technology') || lowerText.includes('development');
  const isEducationRelated = lowerText.includes('aula') || lowerText.includes('curso') || lowerText.includes('estudar') || lowerText.includes('aprender') ||
                            lowerText.includes('lesson') || lowerText.includes('course') || lowerText.includes('learn') || lowerText.includes('teach');
  
  // Templates RTCTF corretos
  const templates = {
    pt: {
      roles: {
        default: "especialista experiente na área",
        business: "consultor de negócios com 10+ anos em startups e empresas",
        tech: "desenvolvedor sênior e arquiteto de software com expertise técnica",
        education: "educador experiente e especialista em ensino didático"
      },
      contexts: {
        default: "público geral que busca informações claras e acionáveis",
        business: "ambiente empresarial brasileiro, com foco em resultados e ROI",
        tech: "contexto de desenvolvimento e implementação de soluções tecnológicas",
        education: "ambiente educacional, priorizando aprendizado progressivo"
      },
      tones: {
        default: "profissional, claro e objetivo",
        business: "executivo, orientado a dados e resultados",
        tech: "técnico mas acessível, com exemplos práticos",
        education: "didático, inspirador e encorajador"
      },
      formats: {
        creation: "estrutura em seções: planejamento, desenvolvimento, implementação e próximos passos",
        analysis: "formato analítico: situação atual, análise detalhada, insights e recomendações",
        explanation: "formato educativo: introdução, conceitos principais, exemplos e resumo",
        planning: "formato de planejamento: objetivos, etapas, cronograma e métricas",
        default: "texto bem estruturado com introdução, desenvolvimento e conclusão"
      },
      template: `**R (Role/Papel):** Você é um {role}.

**T (Task/Tarefa):** {task}

**C (Context/Contexto):** Considere que {context}. {specificContext}

**T (Tone/Tom):** Use um tom {tone}, sendo preciso e focado nos aspectos mais importantes.

**F (Format/Formato):** Apresente a resposta em {format}.

---
**PROMPT CONSOLIDADO:**
{consolidatedPrompt}`
    },
    en: {
      roles: {
        default: "experienced expert in the field",
        business: "business consultant with 10+ years in startups and companies",
        tech: "senior developer and software architect with technical expertise",
        education: "experienced educator and specialist in didactic teaching"
      },
      contexts: {
        default: "general audience seeking clear and actionable information",
        business: "business environment focused on results and ROI",
        tech: "development and implementation of technological solutions context",
        education: "educational environment prioritizing progressive learning"
      },
      tones: {
        default: "professional, clear and objective",
        business: "executive-level, data-driven and results-oriented",
        tech: "technical but accessible, with practical examples",
        education: "didactic, inspiring and encouraging"
      },
      formats: {
        creation: "structure in sections: planning, development, implementation and next steps",
        analysis: "analytical format: current situation, detailed analysis, insights and recommendations",
        explanation: "educational format: introduction, main concepts, examples and summary",
        planning: "planning format: objectives, stages, timeline and metrics",
        default: "well-structured text with introduction, development and conclusion"
      },
      template: `**R (Role):** You are an {role}.

**T (Task):** {task}

**C (Context):** Consider that {context}. {specificContext}

**T (Tone):** Use a {tone} tone, being precise and focused on the most important aspects.

**F (Format):** Present the response in {format}.

---
**CONSOLIDATED PROMPT:**
{consolidatedPrompt}`
    }
  };
  
  const t = templates[language];
  
  // Determinar role baseado no domínio
  let role = t.roles.default;
  if (isBusinessRelated) role = t.roles.business;
  else if (isTechRelated) role = t.roles.tech;
  else if (isEducationRelated) role = t.roles.education;
  
  // Determinar context baseado no domínio
  let context = t.contexts.default;
  let specificContext = "";
  if (isBusinessRelated) {
    context = t.contexts.business;
    specificContext = language === 'pt' ? "Foque em viabilidade comercial e resultados mensuráveis." : "Focus on commercial viability and measurable results.";
  } else if (isTechRelated) {
    context = t.contexts.tech;
    specificContext = language === 'pt' ? "Inclua melhores práticas e considerações de implementação." : "Include best practices and implementation considerations.";
  } else if (isEducationRelated) {
    context = t.contexts.education;
    specificContext = language === 'pt' ? "Use exemplos práticos e progressão lógica." : "Use practical examples and logical progression.";
  }
  
  // Determinar tone baseado no domínio
  let tone = t.tones.default;
  if (isBusinessRelated) tone = t.tones.business;
  else if (isTechRelated) tone = t.tones.tech;
  else if (isEducationRelated) tone = t.tones.education;
  
  // Determinar format baseado no tipo de tarefa
  let format = t.formats.default;
  if (isCreation) format = t.formats.creation;
  else if (isAnalysis) format = t.formats.analysis;
  else if (isExplanation) format = t.formats.explanation;
  else if (isPlanning) format = t.formats.planning;
  
  // Criar prompt consolidado melhorado
  const consolidatedPrompt = language === 'pt' 
    ? `Você é um ${role}. ${text} Considere que ${context}. ${specificContext} Use um tom ${tone}, sendo preciso e focado nos aspectos mais importantes. Apresente a resposta em ${format}.`
    : `You are an ${role}. ${text} Consider that ${context}. ${specificContext} Use a ${tone} tone, being precise and focused on the most important aspects. Present the response in ${format}.`;
  
  return t.template
    .replace('{role}', role)
    .replace('{task}', text)
    .replace('{context}', context)
    .replace('{specificContext}', specificContext)
    .replace('{tone}', tone)
    .replace('{format}', format)
    .replace('{consolidatedPrompt}', consolidatedPrompt);
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
You are an expert in prompt engineering and RTCTF methodology. Transform user input into structured, effective prompts.

RTCTF METHODOLOGY (CORRECT VERSION):
- R (Role): Who the AI should be or what persona to adopt
- T (Task): The specific action to be performed
- C (Context): Relevant background information to help AI understand
- T (Tone): Writing style - formal, casual, technical, educational, etc.
- F (Format): Response structure - list, table, paragraph, code, etc.

INSTRUCTIONS:
1. Analyze the user's input to identify intent and domain
2. Determine appropriate Role based on the topic (expert, consultant, teacher, etc.)
3. Clearly define the Task to be executed
4. Provide relevant Context for better understanding
5. Set appropriate Tone for the audience and purpose
6. Specify the desired Format for the response

USER INPUT: """${text}"""

Transform into a structured RTCTF prompt following EXACTLY this structure:

**R (Role):** You are a [specific expert/professional role]

**T (Task):** [Clear, specific action to perform]

**C (Context):** [Relevant background information and target audience]

**T (Tone):** [Appropriate writing style for the context]

**F (Format):** [Specific response structure]

[A single, clear prompt that incorporates all RTCTF elements naturally]

Be specific and actionable. The final prompt should deliver exceptional results when used with any LLM.
`,
        pt: `
Você é um especialista em prompt engineering e metodologia RTCTF. Transforme a entrada do usuário em prompts estruturados e eficazes.

METODOLOGIA RTCTF (VERSÃO CORRETA):
- R (Role/Papel): Quem a IA deve ser ou qual persona adotar
- T (Task/Tarefa): A ação específica a ser executada
- C (Context/Contexto): Informações de background relevantes para ajudar a IA
- T (Tone/Tom): Estilo de escrita - formal, casual, técnico, educativo, etc.
- F (Format/Formato): Estrutura da resposta - lista, tabela, parágrafo, código, etc.

INSTRUÇÕES:
1. Analise a entrada do usuário para identificar intenção e domínio
2. Determine o Role apropriado baseado no tópico (especialista, consultor, professor, etc.)
3. Defina claramente a Task a ser executada
4. Forneça Context relevante para melhor compreensão
5. Defina o Tone apropriado para o público e propósito
6. Especifique o Format desejado para a resposta

ENTRADA DO USUÁRIO: """${text}"""

Transforme em um prompt RTCTF estruturado seguindo EXATAMENTE esta estrutura:

**PROMPT OTIMIZADO RTCTF:**

**R (Role/Papel):** Você é um [papel específico de especialista/profissional]

**T (Task/Tarefa):** [Ação clara e específica a ser executada]

**C (Context/Contexto):** [Informações de background relevantes e público-alvo]

**T (Tone/Tom):** [Estilo de escrita apropriado para o contexto]

**F (Format/Formato):** [Estrutura específica da resposta]

[Um prompt único e claro que incorpora todos os elementos RTCTF naturalmente]

Seja específico e acionável. O prompt final deve entregar resultados excepcionais quando usado com qualquer LLM.
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
