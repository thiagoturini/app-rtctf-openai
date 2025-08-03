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
  
  // RTCTF Components
  result: string;
  resultDesc: string;
  task: string;
  taskDesc: string;
  context: string;
  contextDesc: string;
  criteria: string;
  criteriaDesc: string;
  format: string;
  formatDesc: string;
  
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
    methodologyDescription: "RTCTF is a proven framework for creating effective AI prompts that deliver better results from ChatGPT, Claude, Gemini, and other LLMs.",
    
    result: "Result",
    resultDesc: "Expected outcome",
    task: "Task", 
    taskDesc: "Specific action",
    context: "Context",
    contextDesc: "Background info",
    criteria: "Criteria",
    criteriaDesc: "Guidelines & limits",
    format: "Format",
    formatDesc: "Response structure",
    
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
    methodologyDescription: "RTCTF é um framework comprovado para criar prompts eficazes que entregam melhores resultados do ChatGPT, Claude, Gemini e outros LLMs.",
    
    result: "Resultado",
    resultDesc: "Resultado esperado",
    task: "Tarefa",
    taskDesc: "Ação específica", 
    context: "Contexto",
    contextDesc: "Informações de contexto",
    criteria: "Critérios",
    criteriaDesc: "Diretrizes e limites",
    format: "Formato",
    formatDesc: "Estrutura da resposta",
    
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
