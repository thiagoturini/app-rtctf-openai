'use client';

import { useState, useEffect } from 'react';
import { useAnalytics } from './hooks/useAnalytics';
import { useTranslations } from './hooks/useTranslations';
import { useOutputFormat } from './hooks/useOutputFormat';
import { useDynamicPlaceholder } from './hooks/useDynamicPlaceholder';

interface HistoryItem {
  id: string;
  input: string;
  output: string;
  timestamp: number;
}

export default function Home() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Initialize hooks
  const analytics = useAnalytics();
  const { language, changeLanguage, t } = useTranslations();
  const { format, changeFormat, formatContent, formatConfig } = useOutputFormat();
  const dynamicPlaceholder = useDynamicPlaceholder();

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('rtctf-history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, []);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Copy shortcut (Ctrl+C or Cmd+C) when result is available and not in textarea
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && result && 
          !(e.target as HTMLElement)?.tagName?.toLowerCase().includes('textarea')) {
        e.preventDefault();
        // Copy and track directly here
        if (result) {
          navigator.clipboard.writeText(result);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          // Use analytics directly without dependency issue
          analytics.trackPromptCopied('keyboard_shortcut', format);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [result, analytics, format]); // Add missing dependencies

  // Save history to localStorage
  const saveToHistory = (input: string, output: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      input,
      output,
      timestamp: Date.now()
    };
    
    const updatedHistory = [newItem, ...history].slice(0, 10); // Keep last 10
    setHistory(updatedHistory);
    
    try {
      localStorage.setItem('rtctf-history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/rtctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, useAI: true, language }),
      });
      const data = await res.json();
      const prompt = data.prompt || data.error;
      
      // Format the output based on selected format
      const formattedPrompt = formatContent(prompt);
      setResult(formattedPrompt);
      
      if (prompt && !data.error) {
        saveToHistory(text, formattedPrompt);
        // Track successful prompt generation with new parameters
        analytics.trackPromptGenerated(data.source || 'Local', text, formattedPrompt, format, language);
        
        // Track AI fallback if it occurred
        if (data.source === 'Local (AI unavailable)') {
          analytics.trackAIFallback('api_error');
        }
      } else if (data.error) {
        // Track error
        analytics.trackError('api_error', data.error);
      }
    } catch {
      const errorMessage = language === 'pt' ? 'Erro ao conectar com a API' : 'Error connecting to API';
      setResult(errorMessage);
      analytics.trackError('network_error', errorMessage);
    }
    setLoading(false);
  };

  const copyToClipboard = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      analytics.trackPromptCopied('copy_button', format);
    }
  };

  const clearAll = () => {
    setText('');
    setResult('');
    setCopied(false);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setText(item.input);
    setResult(item.output);
    setShowHistory(false);
    // Track history item reuse
    analytics.trackHistoryItemReused(item.timestamp);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('rtctf-history');
  };

  const downloadPrompt = () => {
    if (result) {
      const blob = new Blob([result], { type: formatConfig.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rtctf-prompt-${Date.now()}.${formatConfig.extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // Track download action with format
      analytics.trackPromptDownloaded(format);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-mono">
      {/* Header minimalista */}
      <div className="border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-slate-900">{t.title}</h1>
              <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <div className="flex items-center gap-1 border border-slate-200 rounded-md p-1">
                <button
                  onClick={() => {
                    const oldLang = language;
                    changeLanguage('en');
                    analytics.trackLanguageChanged(oldLang, 'en');
                  }}
                  className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                    language === 'en' 
                      ? 'bg-slate-800 text-white' 
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => {
                    const oldLang = language;
                    changeLanguage('pt');
                    analytics.trackLanguageChanged(oldLang, 'pt');
                  }}
                  className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                    language === 'pt' 
                      ? 'bg-slate-800 text-white' 
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  PT
                </button>
              </div>
              
              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  if (!showHistory) {
                    // Track when user opens history
                    analytics.trackHistoryViewed(history.length);
                  }
                }}
                className="text-xs text-slate-600 hover:text-slate-800 px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 transition-all duration-200"
              >
                {t.historyButton} ({history.length})
              </button>
              <div className="text-xs text-slate-400 font-mono">
                {t.version}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.inputLabel}
              </label>
              <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  className="w-full p-4 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent bg-white/70 font-mono placeholder-slate-400 resize-none"
                  placeholder={dynamicPlaceholder || t.inputPlaceholder}
                  required
                />
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || !text.trim()}
                    className="flex-1 bg-slate-800 text-white py-2.5 px-4 rounded-lg hover:bg-slate-900 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t.processing}
                      </span>
                    ) : (
                      t.transformButton
                    )}
                  </button>
                  
                  {(text || result) && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="px-4 py-2.5 text-slate-600 hover:text-slate-800 transition-colors text-sm"
                    >
                      {t.clearButton}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Tech Credibility */}
            <div className="mt-6">
              <p className="text-xs text-slate-700 font-medium mb-3">{t.techTitle}</p>
              <div className="grid grid-cols-2 gap-2">
                {t.techSpecs.map((spec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded px-2 py-1"
                  >
                    <span className="text-green-500">✓</span>
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="block text-sm font-medium text-slate-700">
                  {t.outputLabel}
                </label>
                
                {/* Format Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{t.formatLabel}:</span>
                  <select
                    value={format}
                    onChange={(e) => {
                      const oldFormat = format;
                      const newFormat = e.target.value as 'txt' | 'md' | 'yaml';
                      changeFormat(newFormat);
                      analytics.trackOutputFormatChanged(oldFormat, newFormat);
                      
                      // Re-format existing result if available
                      if (result) {
                        setResult(formatContent(result));
                      }
                    }}
                    className="text-xs border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  >
                    <option value="txt">Text</option>
                    <option value="md">Markdown</option>
                    <option value="yaml">YAML</option>
                  </select>
                </div>
              </div>
              
              {result && (
                <div className="flex gap-2">
                  <button
                    onClick={downloadPrompt}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 transition-all duration-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t.downloadButton}
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 transition-all duration-200"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {t.copied}
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {t.copyButton}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            <div className="min-h-[400px] p-4 border border-slate-200 rounded-lg bg-white/70">
              {result ? (
                <pre className="whitespace-pre-wrap text-xs text-slate-700 font-mono leading-relaxed">
                  {result}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <div className="text-2xl mb-2">⌨️</div>
                    <p className="text-sm">{t.outputPlaceholder}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="mt-8 border-t border-slate-200 pt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-700">{t.historyTitle}</h3>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {t.clearHistoryButton}
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">{t.noHistory}</p>
            ) : (
              <div className="grid gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600 truncate">{item.input}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400 ml-2">→</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Methodology Info */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <details className="group">
            <summary 
              className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              onClick={() => analytics.trackMethodologyViewed(language)}
            >
              {t.methodologyTitle}
            </summary>
            <div className="mt-6 space-y-6">
              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed">
                {t.methodologyDescription}
              </p>
              
              {/* RTCTF Components */}
              <div className="grid md:grid-cols-5 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-slate-800">R</span>
                    <strong className="text-slate-700 text-sm">{t.role}</strong>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{t.roleDesc}</p>
                  <div className="text-xs text-slate-500 italic">
                    {language === 'pt' ? 'Ex: "Você é um especialista em marketing"' : 'Ex: "You are a marketing expert"'}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-slate-800">T</span>
                    <strong className="text-slate-700 text-sm">{t.task}</strong>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{t.taskDesc}</p>
                  <div className="text-xs text-slate-500 italic">
                    {language === 'pt' ? 'Ex: "Analise o mercado de apps"' : 'Ex: "Analyze the app market"'}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-slate-800">C</span>
                    <strong className="text-slate-700 text-sm">{t.context}</strong>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{t.contextDesc}</p>
                  <div className="text-xs text-slate-500 italic">
                    {language === 'pt' ? 'Ex: "Para startup B2B no Brasil"' : 'Ex: "For B2B startup in Brazil"'}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-slate-800">T</span>
                    <strong className="text-slate-700 text-sm">{t.tone}</strong>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{t.toneDesc}</p>
                  <div className="text-xs text-slate-500 italic">
                    {language === 'pt' ? 'Ex: "Tom profissional e técnico"' : 'Ex: "Professional and technical tone"'}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-slate-800">F</span>
                    <strong className="text-slate-700 text-sm">{t.format}</strong>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{t.formatDesc}</p>
                  <div className="text-xs text-slate-500 italic">
                    {language === 'pt' ? 'Ex: "Lista com 5 itens"' : 'Ex: "List with 5 items"'}
                  </div>
                </div>
              </div>

              {/* Before/After Example */}
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-3">
                    ❌ {language === 'pt' ? 'Prompt Básico' : 'Basic Prompt'}
                  </h4>
                  <p className="text-xs text-red-700 font-mono bg-white/50 p-3 rounded">
                    {language === 'pt' 
                      ? '"Crie uma estratégia de marketing"'
                      : '"Create a marketing strategy"'
                    }
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    {language === 'pt' 
                      ? 'Muito vago, sem contexto ou direcionamento'
                      : 'Too vague, lacks context and direction'
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-3">
                    ✅ {language === 'pt' ? 'Prompt RTCTF' : 'RTCTF Prompt'}
                  </h4>
                  <p className="text-xs text-green-700 font-mono bg-white/50 p-3 rounded">
                    {language === 'pt' 
                      ? '"Role: Você é um especialista em marketing digital com 10 anos de experiência em startups B2B.\nTask: Desenvolva uma estratégia completa de marketing para um app de produtividade.\nContext: Startup brasileira, foco em empresas médias, orçamento de R$ 50k.\nTone: Profissional, com dados e métricas, linguagem acessível para executivos.\nFormat: Apresentação com 8 slides: situação atual, personas, canais, cronograma, métricas e orçamento."'
                      : '"Role: You are a digital marketing expert with 10 years of B2B startup experience.\nTask: Develop a comprehensive marketing strategy for a productivity app.\nContext: Brazilian startup, targeting mid-size companies, R$ 50k budget.\nTone: Professional, data-driven, executive-friendly language.\nFormat: 8-slide presentation: current situation, personas, channels, timeline, metrics and budget."'
                    }
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    {language === 'pt' 
                      ? 'Específico, contextualizado e com formato claro'
                      : 'Specific, contextualized with clear format'
                    }
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-3">
                  🚀 {language === 'pt' ? 'Por que usar RTCTF?' : 'Why use RTCTF?'}
                </h4>
                <div className="grid md:grid-cols-3 gap-3 text-xs text-blue-700">
                  <div>
                    <strong>{language === 'pt' ? '3x mais precisão' : '3x more precision'}</strong>
                    <p>{language === 'pt' ? 'Respostas mais relevantes' : 'More relevant responses'}</p>
                  </div>
                  <div>
                    <strong>{language === 'pt' ? '5x menos retrabalho' : '5x less rework'}</strong>
                    <p>{language === 'pt' ? 'Primeira tentativa certa' : 'Right on first try'}</p>
                  </div>
                  <div>
                    <strong>{language === 'pt' ? 'Consistência' : 'Consistency'}</strong>
                    <p>{language === 'pt' ? 'Resultados reproduzíveis' : 'Reproducible results'}</p>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
