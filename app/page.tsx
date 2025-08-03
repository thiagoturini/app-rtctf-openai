'use client';

import { useState, useEffect } from 'react';

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
        body: JSON.stringify({ text, useAI: true }),
      });
      const data = await res.json();
      const prompt = data.prompt || data.error;
      setResult(prompt);
      
      if (prompt && !data.error) {
        saveToHistory(text, prompt);
      }
    } catch (error) {
      setResult('Erro ao conectar com a API');
    }
    setLoading(false);
  };

  const copyToClipboard = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('rtctf-history');
  };

  const downloadPrompt = () => {
    if (result) {
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rtctf-prompt-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-mono">
      {/* Header minimalista */}
      <div className="border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-slate-900">RTCTF Transformer</h1>
              <p className="text-sm text-slate-600 mt-1">Transform ideas into structured prompts</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-slate-600 hover:text-slate-800 px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 transition-all duration-200"
              >
                History ({history.length})
              </button>
              <div className="text-xs text-slate-400 font-mono">
                v2.0
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
                Input
              </label>
              <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  className="w-full p-4 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent bg-white/70 font-mono placeholder-slate-400 resize-none"
                  placeholder="Type your idea here..."
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
                        Processing...
                      </span>
                    ) : (
                      'Transform'
                    )}
                  </button>
                  
                  {(text || result) && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="px-4 py-2.5 text-slate-600 hover:text-slate-800 transition-colors text-sm"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Quick Examples */}
            <div className="mt-6">
              <p className="text-xs text-slate-500 mb-2">Quick examples:</p>
              <div className="space-y-1">
                {[
                  "Create a marketing strategy for a new app",
                  "Explain machine learning to beginners", 
                  "Analyze customer feedback data",
                  "Plan a team productivity workshop"
                ].map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setText(example)}
                    className="block text-left text-xs text-slate-600 hover:text-slate-800 py-1 transition-colors"
                  >
                    → {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">
                Output
              </label>
              {result && (
                <div className="flex gap-2">
                  <button
                    onClick={downloadPrompt}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 transition-all duration-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
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
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
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
                    <p className="text-sm">Your structured prompt will appear here</p>
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
              <h3 className="text-sm font-medium text-slate-700">Recent Transformations</h3>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No history yet</p>
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

        {/* Methodology Info - Compact */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              About RTCTF Methodology
            </summary>
            <div className="mt-4 grid md:grid-cols-5 gap-4 text-xs text-slate-600">
              <div>
                <strong className="text-slate-700">Result</strong>
                <p>Expected outcome</p>
              </div>
              <div>
                <strong className="text-slate-700">Task</strong>
                <p>Specific action</p>
              </div>
              <div>
                <strong className="text-slate-700">Context</strong>
                <p>Background info</p>
              </div>
              <div>
                <strong className="text-slate-700">Criteria</strong>
                <p>Guidelines & limits</p>
              </div>
              <div>
                <strong className="text-slate-700">Format</strong>
                <p>Response structure</p>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
