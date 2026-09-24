import React, { useState } from 'react';
import { X, FileText, Loader2, Save } from 'lucide-react';
import { useCalendarioPedagogico } from '@/hooks/calendario/useCalendarioPedagogico';
import { getClientAIHeaders } from '@/utils/aiHeaders';

export function ImportPlanejamentoModal({ isOpen, onClose, turmaSelecionada, onImportSuccess }) {
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { salvarPlanejamento } = useCalendarioPedagogico();

  if (!isOpen || !turmaSelecionada) return null;

  const handleImport = async () => {
    if (!texto.trim()) {
      setError("Por favor, insira o texto do plano de curso.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Chamar API para extrair tópicos
      const res = await fetch('/api/calendario/importar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getClientAIHeaders(),
        },
        body: JSON.stringify({
          text: texto,
          disciplina: turmaSelecionada.disciplina || 'Geral',
          anoLetivo: new Date().getFullYear(),
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar o planejamento com a IA.");
      }

      const topicos = data.topicos;

      // Adicionar um ID único e associado=false para cada tópico
      const topicosFormatados = topicos.map(t => ({
        ...t,
        id: crypto.randomUUID(),
        associado: false
      }));

      // 2. Salvar no Firestore
      await salvarPlanejamento(turmaSelecionada.id, topicosFormatados);
      
      onImportSuccess(topicosFormatados);
      onClose();
      setTexto('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-indigo-500" />
            Importar Planejamento Inteligente
          </h2>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <p className="text-sm text-gray-600">
            Cole abaixo o conteúdo do seu plano de curso ou ementa (Word, PDF, texto livre). 
            Nossa Inteligência Artificial estruturará os conteúdos em tópicos ordenados que você poderá arrastar para a grade horária de <strong>{turmaSelecionada.nome}</strong>.
          </p>

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <textarea
            className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 resize-none bg-gray-50"
            placeholder="Exemplo: Bimestre 1 - Introdução à Filosofia. Aula 1: Mito e Razão. Aula 2: Os Pré-Socráticos..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando com IA...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Extrair e Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
