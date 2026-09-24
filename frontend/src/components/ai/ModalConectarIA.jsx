"use client";

import { useState, useEffect } from 'react';
import {
  X,
  Key,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  Zap,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { AIProviders, PROVEDORES_DISPONIVEIS } from '@/dominio/ai/AIProviders';
import { useAIConfig } from '@/hooks/useAIConfig';

export function ModalConectarIA({ isOpen, onClose }) {
  const { config, temChave, salvar, remover, testar } = useAIConfig();

  const getRecommendedModel = (provId, currentModel) => {
    const prov = AIProviders[provId];
    if (!prov) return '';
    // Para o Google Gemini, se o modelo for 1.5 ou 2.5 (obsoletos/bloqueados para novas contas gratuitas), migra para 3.6
    if (provId === 'gemini') {
      if (!currentModel || currentModel.includes('1.5') || currentModel.includes('2.5')) {
        return prov.modelos?.[0]?.id || 'gemini-3.6-flash';
      }
      return currentModel;
    }
    if (currentModel && prov.modelos?.some((m) => m.id === currentModel)) {
      return currentModel;
    }
    return prov.modelos?.[0]?.id || prov.defaultModel || '';
  };

  const [provider, setProvider] = useState(config?.provider || 'gemini');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [model, setModel] = useState(getRecommendedModel(config?.provider || 'gemini', config?.model));
  const [showKey, setShowKey] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok: boolean, message: string, latencyMs?: number }
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setApiKey(config.apiKey);
      setModel(getRecommendedModel(config.provider, config.model));
    } else {
      setProvider('gemini');
      setApiKey('');
      setModel(getRecommendedModel('gemini', null));
    }
    setTestResult(null);
    setSaveSuccess(false);
  }, [config, isOpen]);

  // Ao mudar de provedor, ajusta o modelo padrão
  const handleSelectProvider = (provId) => {
    setProvider(provId);
    setModel(getRecommendedModel(provId, null));
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ ok: false, message: 'Digite uma chave de API para testar.' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await testar({ provider, apiKey: apiKey.trim(), model });
      if (res.model && res.model !== model) {
        setModel(res.model);
      }
      setTestResult({
        ok: true,
        message: `Conexão bem-sucedida! ${res.model ? `Modelo ativo: ${res.model}. ` : ''}Latência: ${res.latencyMs || 0}ms`,
        latencyMs: res.latencyMs,
      });
    } catch (err) {
      setTestResult({
        ok: false,
        message: err.message || 'Erro ao conectar. Verifique a chave e saldo.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setTestResult({ ok: false, message: 'Informe sua chave de API antes de salvar.' });
      return;
    }

    setSaving(true);
    try {
      await salvar({ provider, apiKey: apiKey.trim(), model });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      setTestResult({ ok: false, message: err.message || 'Erro ao salvar credenciais.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (confirm('Tem certeza que deseja desconectar sua chave de IA? O acesso aos recursos de IA será suspenso até uma nova chave ser conectada.')) {
      await remover();
      setApiKey('');
      setTestResult(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentProv = AIProviders[provider] || AIProviders.gemini;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101942]/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#dce0f0] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-[#101942]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Superior Navy */}
        <div className="bg-[#101942] text-white px-6 py-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f60c49] flex items-center justify-center text-white shadow-md">
              <Key size={20} />
            </div>
            <div>
              <h2 className="font-head text-lg font-bold text-white flex items-center gap-2">
                Conectar Inteligência Artificial
                <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase bg-white/10 text-white/80 border border-white/15">
                  BYOK
                </span>
              </h2>
              <p className="text-xs text-white/60">
                Conecte sua própria API para controle total de custos e cotas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Ativo Badge */}
          {temChave ? (
            <div className="p-4 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#22c55e] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#166534]">
                    Chave Própria Conectada: {AIProviders[config?.provider]?.nome || config?.provider}
                  </p>
                  <p className="text-[11px] text-[#166534]/80 mt-0.5">
                    Chave ativa: <span className="font-mono font-semibold">{config?.getMaskedKey()}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
                <span>Desconectar</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <strong className="font-bold">Nenhuma chave conectada:</strong> O Gestão Docente opera exclusivamente com a sua chave pessoal. Para corrigir redações, conversar com agentes pedagógicos ou gerar atividades, conecte seu provedor abaixo.
              </div>
            </div>
          )}

          {/* 1. Escolha de Provedor */}
          <div>
            <label className="block text-xs font-bold text-[#101942] uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Cpu size={14} className="text-[#f60c49]" />
              1. Selecione o Provedor de IA
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PROVEDORES_DISPONIVEIS.map((p) => {
                const isSelected = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProvider(p.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#f60c49] bg-[#fff2f6] shadow-sm ring-2 ring-[#f60c49]/20'
                        : 'border-[#dce0f0] bg-white hover:border-[#b0b8d8] hover:bg-[#f7f8fc]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-[#101942]">{p.nome}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#f60c49]"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6070a0] leading-snug line-clamp-2">
                        {p.descricao}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Campo de Chave de API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#101942] uppercase tracking-wider flex items-center gap-2">
                <Key size={14} className="text-[#f60c49]" />
                2. Chave de API ({currentProv.nome})
              </label>
              {currentProv.keyHelpUrl && (
                <a
                  href={currentProv.keyHelpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-[#f60c49] hover:underline flex items-center gap-1"
                >
                  <span>{currentProv.keyHelpText || 'Obter chave'}</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={currentProv.keyPlaceholder}
                className="w-full px-4 py-3 pr-12 rounded-2xl bg-white border border-[#dce0f0] text-sm text-[#101942] placeholder-[#a0a8c4] focus:outline-none focus:ring-2 focus:ring-[#f60c49]/30 focus:border-[#f60c49] font-mono transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6070a0] hover:text-[#101942] p-1.5"
                title={showKey ? 'Ocultar chave' : 'Mostrar chave'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-[#6070a0] flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#22c55e]" />
              Sua chave é salva com segurança no seu perfil e nunca compartilhada com terceiros.
            </p>
          </div>

          {/* 3. Seleção de Modelo */}
          <div>
            <label className="block text-xs font-bold text-[#101942] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Zap size={14} className="text-[#f60c49]" />
              3. Modelo Padrão
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-[#dce0f0] text-sm text-[#101942] font-semibold focus:outline-none focus:ring-2 focus:ring-[#f60c49]/30 focus:border-[#f60c49] transition-all cursor-pointer"
            >
              {currentProv.modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Feedback de Teste */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 ${
                testResult.ok
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
              )}
              <span className="flex-1">{testResult.message}</span>
            </div>
          )}

          {/* Banner de Autonomia */}
          <div className="p-4 rounded-2xl bg-[#f7f8fc] border border-[#dce0f0] text-xs text-[#6070a0] leading-relaxed">
            <strong className="text-[#101942]">Transparência total:</strong> O consumo de tokens e custos é cobrado diretamente na sua conta do provedor (Google, OpenAI, Anthropic, Maritaca ou OpenRouter). A plataforma não retém nenhuma taxa sobre seu saldo de IA.
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="bg-[#f7f8fc] border-t border-[#dce0f0] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !apiKey.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-[#101942]/20 hover:border-[#101942] text-xs font-bold text-[#101942] hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 size={14} className="animate-spin text-[#f60c49]" />
                <span>Testando conexão...</span>
              </>
            ) : (
              <>
                <Zap size={14} className="text-[#f60c49]" />
                <span>Testar Conexão</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl text-xs font-bold text-[#6070a0] hover:text-[#101942] hover:bg-[#eef0f8] transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !apiKey.trim()}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-2xl bg-[#f60c49] hover:bg-[#d40840] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Chave Salva!</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Salvar Chave</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
