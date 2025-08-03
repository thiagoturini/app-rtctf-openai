'use client';

import { useState } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/rtctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, useAI }),
      });
      const data = await res.json();
      setResult(data.prompt || data.error);
    } catch (error) {
      setResult('Erro ao conectar com a API');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transformador RTCTF
          </h1>
          <p className="text-xl text-gray-600">
            Transforme seus textos em prompts otimizados usando a metodologia RTCTF
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                Digite seu texto:
              </label>
              <textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Exemplo: Preciso de ajuda para criar uma apresentação sobre vendas..."
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useAI"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="useAI" className="text-sm text-gray-700">
                Usar OpenAI (mais inteligente, mas usa créditos)
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Transformando...' : useAI ? 'Transformar com IA (OpenAI)' : 'Transformar Gratuitamente'}
            </button>
          </form>

          {result && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Prompt Otimizado:
              </h3>
              <div className="bg-gray-50 p-4 rounded-md border">
                <pre className="whitespace-pre-wrap text-sm text-gray-800">
                  {result}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            O que é RTCTF?
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-blue-600">R - Resultado</h3>
              <p className="text-gray-600">O que você espera obter como resposta final</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600">T - Tarefa</h3>
              <p className="text-gray-600">A ação específica que deve ser executada</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600">C - Contexto</h3>
              <p className="text-gray-600">Informações de fundo relevantes para o pedido</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600">C - Critérios</h3>
              <p className="text-gray-600">Diretrizes, limitações e restrições a seguir</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-semibold text-blue-600">F - Formato</h3>
              <p className="text-gray-600">Como a resposta deve ser estruturada e apresentada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
