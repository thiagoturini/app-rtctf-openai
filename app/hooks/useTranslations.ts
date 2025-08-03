import { useState, useEffect } from 'react';

export type Language = 'en' | 'pt';

interface Translations {
  // Header
  title: string;
  subtitle: string;
  valueProposition: string;
  
  // Form
  inputLabel: string;
  inputPlaceholder: string;
  transformButton: string;
  processing: string;
  clearButton: string;
  
  // Output
  outputLabel: string;
  outputPlaceholder: string;
  optimizedPromptLabel: string;
  consolidatedPromptLabel: string;
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
    subtitle: "Transform any question into a structured prompt",
    valueProposition: "Turn simple questions into optimized prompts that follow the RTCTF methodology (Role-Task-Context-Tone-Format) to get better responses from AI models.",
    
    inputLabel: "Your Question or Idea",
    inputPlaceholder: "Describe what you want to achieve with AI...",
    transformButton: "Transform",
    processing: "Processing...",
    clearButton: "Clear",
    
    outputLabel: "Optimized Prompt",
    outputPlaceholder: "Your structured prompt will appear here",
    optimizedPromptLabel: "Optimized Prompt",
    consolidatedPromptLabel: "Consolidated Prompt",
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
    
    methodologyTitle: "✅ What is the RTCTF methodology?",
    methodologyDescription: "RTCTF is a framework for writing clear, objective and effective prompts for language models (like ChatGPT). It helps you guide AI with precision, providing the right context and instructions to get better, more useful responses aligned with your goal.",
    
    // RTCTF Components - Correct methodology
    role: "Role",
    roleDesc: "Who the AI should represent (teacher, doctor, programmer)",
    task: "Task", 
    taskDesc: "Exactly what the AI should do (write, summarize, compare)",
    context: "Context",
    contextDesc: "Background information to help AI understand the situation",
    tone: "Tone",
    toneDesc: "Writing style: professional, didactic, motivational, concise",
    format: "Format",
    formatDesc: "Response structure: list, table, paragraph, code",
    
    // Dynamic examples for input placeholder
    placeholderExamples: [
      "Help me write an email to my boss asking for a raise",
      "Create a study plan for learning Python in 3 months", 
      "Explain machine learning to a 12-year-old",
      "Write a LinkedIn post about my career change",
      "Plan a marketing strategy for my online store",
      "Summarize the main benefits of remote work"
    ],
    
    version: "v2.1",
    
    analytics: {
      languageChanged: "Language switched to English",
      formatChanged: "Output format changed"
    }
  },
  
  pt: {
    title: "RTCTF Transformer",
    subtitle: "Transforme qualquer pergunta em um prompt estruturado",
    valueProposition: "Transforme perguntas simples em prompts otimizados que seguem a metodologia RTCTF (Papel-Tarefa-Contexto-Tom-Formato) para obter melhores respostas de modelos de IA.",
    
    inputLabel: "Sua Pergunta ou Ideia",
    inputPlaceholder: "Descreva o que você quer alcançar com IA...",
    transformButton: "Transformar",
    processing: "Processando...",
    clearButton: "Limpar",
    
    outputLabel: "Prompt Otimizado",
    outputPlaceholder: "Seu prompt estruturado aparecerá aqui",
    optimizedPromptLabel: "Prompt Otimizado", 
    consolidatedPromptLabel: "Prompt Consolidado",
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
    
    methodologyTitle: "✅ O que é a metodologia RTCTF?",
    methodologyDescription: "RTCTF é uma estrutura usada para escrever prompts claros, objetivos e eficazes para modelos de linguagem (como o ChatGPT). Ela ajuda você a guiar a IA com precisão, fornecendo o contexto e as instruções certas para obter respostas melhores, mais úteis e alinhadas com o seu objetivo.",
    
    // Componentes RTCTF - Metodologia correta
    role: "Role (Papel)",
    roleDesc: "Quem a IA deve representar (professor, médico, programador)",
    task: "Task (Tarefa)",
    taskDesc: "Exatamente o que a IA deve fazer (escrever, resumir, comparar)", 
    context: "Context (Contexto)",
    contextDesc: "Informações de fundo que ajudam a IA a entender a situação",
    tone: "Tone (Tom)",
    toneDesc: "Estilo de escrita: profissional, didático, motivador, conciso",
    format: "Format (Formato)",
    formatDesc: "Estrutura da resposta: lista, tabela, parágrafo, código",
    
    // Exemplos dinâmicos para placeholder
    placeholderExamples: [
      "Me ajude a escrever um email pro meu chefe pedindo aumento",
      "Criar um plano de estudos para aprender Python em 3 meses",
      "Explicar machine learning para uma criança de 12 anos",
      "Escrever um post no LinkedIn sobre minha mudança de carreira", 
      "Planejar uma estratégia de marketing para minha loja online",
      "Resumir os principais benefícios do trabalho remoto"
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
