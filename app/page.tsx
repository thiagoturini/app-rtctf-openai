'use client';

import { useState, useEffect } from 'react';
import { useAnalytics } from './hooks/useAnalytics';
import { useTranslations } from './hooks/useTranslations';
import { useOutputFormat } from './hooks/useOutputFormat';
import { useTypingAnimation } from './hooks/useTypingAnimation';

interface HistoryItem {
  id: string;
  input: string;
  output: string;
  timestamp: number;
}

export default function Home() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [consolidatedPrompt, setConsolidatedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedOptimized, setCopiedOptimized] = useState(false);
  const [copiedConsolidated, setCopiedConsolidated] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Initialize hooks
  const analytics = useAnalytics();
  const { language, changeLanguage, t } = useTranslations();
  const { format, changeFormat, formatContent, formatConfig } = useOutputFormat();
  const { displayText: typingPlaceholder } = useTypingAnimation({
    texts: t.placeholderExamples,
    speed: 80,
    pause: 3000,
    startDelay: 2000
  });

  // Parse the result into optimized and consolidated prompts
  const parsePromptResult = (text: string) => {
    const lines = text.split('\n');
    let optimizedSection = '';
    let consolidatedSection = '';
    let currentSection = '';
    
    for (const line of lines) {
      if (line.includes('PROMPT CONSOLIDADO') || line.includes('CONSOLIDATED PROMPT')) {
        currentSection = 'consolidated';
        continue;
      }
      
      if (currentSection === 'consolidated') {
        consolidatedSection += line + '\n';
      } else {
        optimizedSection += line + '\n';
      }
    }
    
    // Clean up the consolidated prompt (remove quotes and trim)
    consolidatedSection = consolidatedSection.trim().replace(/^"/, '').replace(/"$/, '');
    
    return {
      optimized: optimizedSection.trim(),
      consolidated: consolidatedSection.trim()
    };
  };

  // Download function for individual prompts
  const downloadPrompt = (content: string, filename: string) => {
    if (content) {
      const formattedContent = formatContent(content);
      const blob = new Blob([formattedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${formatConfig.extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      analytics.trackPromptDownloaded(format);
    }
  };

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
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && (optimizedPrompt || consolidatedPrompt) && 
          !((e.target as HTMLElement | null)?.tagName?.toLowerCase().includes('textarea'))) {
        e.preventDefault();
        // Copy optimized prompt by default
        if (optimizedPrompt) {
          navigator.clipboard.writeText(optimizedPrompt);
          setCopiedOptimized(true);
          setTimeout(() => setCopiedOptimized(false), 2000);
          analytics.trackPromptCopied('keyboard_shortcut', format);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [optimizedPrompt, consolidatedPrompt, format, analytics]);

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
    setOptimizedPrompt('');
    setConsolidatedPrompt('');
    try {
      const res = await fetch('/api/rtctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, useAI: true, language }),
      });
      const data = await res.json();
      const prompt = data.prompt || data.error;
      
      if (prompt && !data.error) {
        // Parse the result into two sections
        const parsed = parsePromptResult(prompt);
        setOptimizedPrompt(parsed.optimized);
        setConsolidatedPrompt(parsed.consolidated);
        setResult(prompt); // Keep original for history
        
        saveToHistory(text, prompt);
        // Track successful prompt generation with new parameters
        analytics.trackPromptGenerated(data.source || 'Local', text, prompt, format, language);
        
        // Track AI fallback if it occurred
        if (data.source === 'Local (AI unavailable)') {
          analytics.trackAIFallback('api_error');
        }
      } else if (data.error) {
        setResult(prompt);
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

  const copyToClipboard = async (text: string, type: 'optimized' | 'consolidated') => {
    if (text) {
      await navigator.clipboard.writeText(text);
      if (type === 'optimized') {
        setCopiedOptimized(true);
        setTimeout(() => setCopiedOptimized(false), 2000);
      } else {
        setCopiedConsolidated(true);
        setTimeout(() => setCopiedConsolidated(false), 2000);
      }
      analytics.trackPromptCopied('copy_button', format);
    }
  };

  const clearAll = () => {
    setText('');
    setResult('');
    setOptimizedPrompt('');
    setConsolidatedPrompt('');
    setCopiedOptimized(false);
    setCopiedConsolidated(false);
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
              
              <div className="text-xs text-slate-400 font-mono">
                {t.version}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column - Input and Sections */}
          <div className="space-y-6">
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
                  placeholder={typingPlaceholder || t.inputPlaceholder}
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

            {/* AI Models Compatibility Section */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <h3 className="text-sm font-medium text-blue-900">
                  Compatível com os Principais Modelos de IA
                </h3>
              </div>
              
              <p className="text-xs text-blue-700 mb-3">{t.aiModelsDesc}</p>
              
              <div className="grid grid-cols-1 gap-1">
                {t.aiModels.map((model, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 rounded px-2 py-1"
                  >
                    <span className="text-blue-500">✓</span>
                    <span className="font-medium">{model}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* History Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">{t.historyTitle}</h3>
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('rtctf-history');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {t.clearHistoryButton}
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4 border border-slate-200 rounded-lg bg-slate-50">{t.noHistory}</p>
              ) : (
                <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                  {history.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setText(item.input)}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-600 truncate">{item.input}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedHistory = history.filter(h => h.id !== item.id);
                            setHistory(updatedHistory);
                            localStorage.setItem('rtctf-history', JSON.stringify(updatedHistory));
                          }}
                          className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Output and Additional Sections */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Optimized Prompt Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="block text-sm font-medium text-slate-700">
                    {t.optimizedPromptLabel}
                  </label>
                  
                  {/* Format Selector for Optimized */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{t.formatLabel}:</span>
                    <select
                      value={format}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const oldFormat = format;
                        const newFormat = e.target.value as 'txt' | 'md' | 'json';
                        changeFormat(newFormat);
                        analytics.trackOutputFormatChanged(oldFormat, newFormat);
                      }}
                      className="text-xs border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                    >
                      <option value="txt">Text</option>
                      <option value="md">Markdown</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                </div>
                
                {optimizedPrompt && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadPrompt(optimizedPrompt, 'optimized-prompt')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 transition-all duration-200"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t.downloadButton}
                    </button>
                    <button
                      onClick={() => copyToClipboard(optimizedPrompt, 'optimized')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 transition-all duration-200"
                    >
                      {copiedOptimized ? (
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
              
              <div className="min-h-[200px] p-4 border border-slate-200 rounded-lg bg-white/70">
                {optimizedPrompt ? (
                  <pre className="whitespace-pre-wrap text-xs text-slate-700 font-mono leading-relaxed">
                    {formatContent(optimizedPrompt)}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <div className="text-center">
                      <div className="text-xl mb-2">📝</div>
                      <p className="text-sm">{language === 'pt' ? 'Prompt estruturado aparecerá aqui' : 'Structured prompt will appear here'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Consolidated Prompt Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="block text-sm font-medium text-slate-700">
                    {t.consolidatedPromptLabel}
                  </label>
                  
                  {/* Format Selector for Consolidated */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{t.formatLabel}:</span>
                    <select
                      value={format}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const oldFormat = format;
                        const newFormat = e.target.value as 'txt' | 'md' | 'json';
                        changeFormat(newFormat);
                        analytics.trackOutputFormatChanged(oldFormat, newFormat);
                      }}
                      className="text-xs border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                    >
                      <option value="txt">Text</option>
                      <option value="md">Markdown</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                </div>
                
                {consolidatedPrompt && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadPrompt(consolidatedPrompt, 'consolidated-prompt')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 transition-all duration-200"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t.downloadButton}
                    </button>
                    <button
                      onClick={() => copyToClipboard(consolidatedPrompt, 'consolidated')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 transition-all duration-200"
                    >
                      {copiedConsolidated ? (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {t.copied}
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {t.copyButton}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="min-h-[200px] p-4 border border-slate-200 rounded-lg bg-white/70">
                {consolidatedPrompt ? (
                  <pre className="whitespace-pre-wrap text-xs text-slate-700 font-mono leading-relaxed">
                    {formatContent(consolidatedPrompt)}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <div className="text-center">
                      <div className="text-xl mb-2">🎯</div>
                      <p className="text-sm">{language === 'pt' ? 'Prompt consolidado aparecerá aqui' : 'Consolidated prompt will appear here'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Sections - Well organized in grid */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          
          {/* Tips Section */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-medium text-purple-900">
                {t.tipsTitle}
              </h3>
            </div>
            
            <div className="space-y-3">
              {t.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5 text-xs">•</span>
                  <p className="text-xs text-purple-700">{tip}</p>
                </div>
              ))}
            </div>

            {/* Quick Examples */}
            <div className="mt-4 pt-4 border-t border-purple-200">
              <h4 className="text-xs font-medium text-purple-800 mb-2">{t.examplesTitle}</h4>
              <div className="space-y-1">
                {t.examples.slice(0, 3).map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setText(example)}
                    className="block w-full text-left text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-100 p-2 rounded transition-colors"
                  >
                    &ldquo;{example}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">⚡</span>
              <h3 className="text-sm font-medium text-green-900">
                {language === 'pt' ? 'Por que usar RTCTF?' : 'Why use RTCTF?'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 text-xs text-green-700">
                <span className="text-green-500 text-base">🚀</span>
                <span>{language === 'pt' ? '5x mais rápido que criar prompts manualmente' : '5x faster than creating prompts manually'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-green-700">
                <span className="text-green-500 text-base">🎯</span>
                <span>{language === 'pt' ? 'Resultados mais precisos e consistentes' : 'More accurate and consistent results'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-green-700">
                <span className="text-green-500 text-base">🔄</span>
                <span>{language === 'pt' ? 'Reutilize e adapte facilmente' : 'Easily reuse and adapt'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-green-700">
                <span className="text-green-500 text-base">🌐</span>
                <span>{language === 'pt' ? 'Funciona com qualquer modelo de IA' : 'Works with any AI model'}</span>
              </div>
            </div>
          </div>

          {/* RTCTF Methodology Section */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">✅</span>
              <h3 className="text-sm font-medium text-blue-900">
                {language === 'pt' ? 'O que é a metodologia RTCTF?' : 'What is RTCTF methodology?'}
              </h3>
            </div>
            
            <p className="text-xs text-blue-700 mb-4">
              {language === 'pt' 
                ? 'RTCTF é uma estrutura para escrever prompts claros e eficazes para modelos de IA, fornecendo contexto e instruções precisas.'
                : 'RTCTF is a framework for writing clear and effective prompts for AI models, providing precise context and instructions.'
              }
            </p>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded flex items-center justify-center mt-0.5">R</div>
                <div>
                  <div className="text-xs font-medium text-blue-800">
                    {language === 'pt' ? 'Role (Papel)' : 'Role'}
                  </div>
                  <div className="text-xs text-blue-600">
                    {language === 'pt' ? 'Quem a IA deve representar' : 'Who the AI should represent'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded flex items-center justify-center mt-0.5">T</div>
                <div>
                  <div className="text-xs font-medium text-blue-800">
                    {language === 'pt' ? 'Task (Tarefa)' : 'Task'}
                  </div>
                  <div className="text-xs text-blue-600">
                    {language === 'pt' ? 'O que a IA deve fazer' : 'What the AI should do'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded flex items-center justify-center mt-0.5">C</div>
                <div>
                  <div className="text-xs font-medium text-blue-800">
                    {language === 'pt' ? 'Context (Contexto)' : 'Context'}
                  </div>
                  <div className="text-xs text-blue-600">
                    {language === 'pt' ? 'Informações de fundo' : 'Background information'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded flex items-center justify-center mt-0.5">T</div>
                <div>
                  <div className="text-xs font-medium text-blue-800">
                    {language === 'pt' ? 'Tone (Tom)' : 'Tone'}
                  </div>
                  <div className="text-xs text-blue-600">
                    {language === 'pt' ? 'Estilo de escrita' : 'Writing style'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded flex items-center justify-center mt-0.5">F</div>
                <div>
                  <div className="text-xs font-medium text-blue-800">
                    {language === 'pt' ? 'Format (Formato)' : 'Format'}
                  </div>
                  <div className="text-xs text-blue-600">
                    {language === 'pt' ? 'Estrutura da resposta' : 'Response structure'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
