import { useState, useEffect } from 'react';

export type Language = 'en' | 'pt';

interface Translations {
  // Header
  title: string;
  subtitle: string;
  
  // Form
  inputLabel: string;
  inputPlaceholder: string;
  transformButton: string;
  processing: string;
  clearButton: string;
  
  // Output
  outputLabel: string;
  outputPlaceholder: string;
  copyButton: string;
  copied: string;
  downloadButton: string;
  formatLabel: string;
  
  // History
  historyButton: string;
  historyTitle: string;
  clearHistoryButton: string;
  noHistory: string;
  
  // Examples
  examplesTitle: string;
  examples: string[];
  
  // Methodology
  methodologyTitle: string;
  methodologyDescription: string;
  
  // RTCTF Components (Correct methodology: Role, Task, Context, Tone, Format)
  role: string;
  roleDesc: string;
  task: string;
  taskDesc: string;
  context: string;
  contextDesc: string;
  tone: string;
  toneDesc: string;
  format: string;
  formatDesc: string;
  
  // Tech credibility section
  techTitle: string;
  techSpecs: string[];
  
  // Dynamic placeholder examples
  placeholderExamples: string[];
  
  // Footer
  version: string;
  
  // Analytics events
  analytics: {
    languageChanged: string;
    formatChanged: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    title: "RTCTF Transformer",
    subtitle: "Boost your GenAI results with structured prompts",
    
    inputLabel: "Your Idea",
    inputPlaceholder: "Describe what you want to achieve with AI...",
    transformButton: "Transform",
    processing: "Processing...",
    clearButton: "Clear",
    
    outputLabel: "Optimized Prompt",
    outputPlaceholder: "Your structured prompt will appear here",
    copyButton: "Copy",
    copied: "Copied!",
    downloadButton: "Download",
    formatLabel: "Format",
    
    historyButton: "History",
    historyTitle: "Recent Transformations",
    clearHistoryButton: "Clear All",
    noHistory: "No history yet",
    
    examplesTitle: "Quick examples:",
    examples: [
      "Create a marketing strategy for a new app",
      "Explain machine learning to beginners",
      "Analyze customer feedback data",
      "Plan a team productivity workshop"
    ],
    
    methodologyTitle: "About RTCTF Methodology",
    methodologyDescription: "RTCTF methodology structures prompt engineering for clear communication with AI models. Follow: Role (who AI should be), Task (what to do), Context (background info), Tone (writing style), Format (response structure).",
    
    // RTCTF Components - Correct methodology
    role: "Role",
    roleDesc: "Who the AI should be or what persona to adopt",
    task: "Task", 
    taskDesc: "The specific action to be performed",
    context: "Context",
    contextDesc: "Background information to help AI understand",
    tone: "Tone",
    toneDesc: "Writing style: formal, casual, technical, educational",
    format: "Format",
    formatDesc: "Response structure: list, table, paragraph, code",
    
    // Tech credibility
    techTitle: "🚀 Powered by Advanced AI Technology",
    techSpecs: [
      "OpenAI GPT-4 Integration",
      "Real-time Prompt Optimization",
      "Multi-language Support (EN/PT)",
      "Export: TXT, Markdown, YAML",
      "Rate-limited Secure API",
      "Next.js 15 + TypeScript"
    ],
    
    // Dynamic examples for input placeholder
    placeholderExamples: [
      "Create a marketing strategy for my startup...",
      "Explain quantum computing to beginners...",
      "Analyze this sales data and provide insights...",
      "Write a professional email to investors...",
      "Plan a team building workshop agenda...",
      "Generate creative ideas for app features..."
    ],
    
    version: "v2.1",
    
    analytics: {
      languageChanged: "Language switched to English",
      formatChanged: "Output format changed"
    }
  },
  
  pt: {
    title: "RTCTF Transformer",
    subtitle: "Melhore seus resultados com IA usando prompts estruturados",
    
    inputLabel: "Sua Ideia",
    inputPlaceholder: "Descreva o que você quer alcançar com IA...",
    transformButton: "Transformar",
    processing: "Processando...",
    clearButton: "Limpar",
    
    outputLabel: "Prompt Otimizado",
    outputPlaceholder: "Seu prompt estruturado aparecerá aqui",
    copyButton: "Copiar",
    copied: "Copiado!",
    downloadButton: "Baixar",
    formatLabel: "Formato",
    
    historyButton: "Histórico",
    historyTitle: "Transformações Recentes",
    clearHistoryButton: "Limpar Tudo",
    noHistory: "Nenhum histórico ainda",
    
    examplesTitle: "Exemplos rápidos:",
    examples: [
      "Criar uma estratégia de marketing para um novo app",
      "Explicar machine learning para iniciantes",
      "Analisar dados de feedback de clientes",
      "Planejar um workshop de produtividade em equipe"
    ],
    
    methodologyTitle: "Sobre a Metodologia RTCTF",
    methodologyDescription: "RTCTF estrutura prompt engineering para comunicação clara com IAs. Siga: Role (quem a IA deve ser), Task (o que fazer), Context (informações de fundo), Tone (estilo de escrita), Format (estrutura da resposta).",
    
    // Componentes RTCTF - Metodologia correta
    role: "Role (Papel)",
    roleDesc: "Quem a IA deve ser ou qual persona adotar",
    task: "Task (Tarefa)",
    taskDesc: "A ação específica a ser executada", 
    context: "Context (Contexto)",
    contextDesc: "Informações de fundo para ajudar a IA",
    tone: "Tone (Tom)",
    toneDesc: "Estilo de escrita: formal, casual, técnico, educativo",
    format: "Format (Formato)",
    formatDesc: "Estrutura da resposta: lista, tabela, parágrafo, código",
    
    // Credibilidade tecnológica
    techTitle: "🚀 Tecnologia de IA Avançada",
    techSpecs: [
      "Integração OpenAI GPT-4",
      "Otimização de Prompts em Tempo Real",
      "Suporte Multi-idioma (EN/PT)",
      "Export: TXT, Markdown, YAML",
      "API Segura com Rate Limiting",
      "Next.js 15 + TypeScript"
    ],
    
    // Exemplos dinâmicos para placeholder
    placeholderExamples: [
      "Criar uma estratégia de marketing para minha startup...",
      "Explicar computação quântica para iniciantes...",
      "Analisar estes dados de vendas e dar insights...",
      "Escrever um email profissional para investidores...",
      "Planejar agenda de workshop de team building...",
      "Gerar ideias criativas para funcionalidades de app..."
    ],
    
    version: "v2.1",
    
    analytics: {
      languageChanged: "Idioma alterado para Português",
      formatChanged: "Formato de saída alterado"
    }
  }
};

export function useTranslations() {
  const [language, setLanguage] = useState<Language>('en');
  
  // Load language preference from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('rtctf-language') as Language;
      if (savedLang && (savedLang === 'en' || savedLang === 'pt')) {
        setLanguage(savedLang);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  }, []);
  
  // Save language preference
  const changeLanguage = (newLang: Language) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('rtctf-language', newLang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };
  
  return {
    language,
    changeLanguage,
    t: translations[language]
  };
}
