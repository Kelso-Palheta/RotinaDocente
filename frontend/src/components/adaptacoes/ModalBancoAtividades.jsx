"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  BookOpen,
  Filter,
  Search,
  Copy,
  Trash2,
  Check,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { CATEGORIAS_DEFICIENCIA, CATEGORIAS_MAP } from "@/dominio/adaptacoes/CategoriasDeficiencia";

export function ModalBancoAtividades({
  isOpen,
  onClose,
  repository,
  alunoRepository,
  userId = "usuario_atual",
  onCarregarAtividade,
}) {
  const [atividades, setAtividades] = useState([]);
  const [alunosPEI, setAlunosPEI] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroNecessidade, setFiltroNecessidade] = useState("");

  // Estado do reaproveitamento inline
  const [reaproveitandoId, setReaproveitandoId] = useState(null);
  const [alunoDestinoId, setAlunoDestinoId] = useState("");
  const [alunoDestinoNome, setAlunoDestinoNome] = useState("");
  const [processandoReaproveitamento, setProcessandoReaproveitamento] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState("");

  const carregarDados = useCallback(async () => {
    if (!repository) return;
    setCarregando(true);
    try {
      const filtro = filtroNecessidade ? { filtroNecessidades: [filtroNecessidade] } : {};
      const lista = await repository.listarAtividades(userId, filtro);
      setAtividades(lista);

      if (alunoRepository) {
        const alunos = await alunoRepository.listarAlunos(userId);
        setAlunosPEI(alunos);
      }
    } catch (err) {
      console.warn("Erro ao buscar banco de atividades:", err);
    } finally {
      setCarregando(false);
    }
  },[repository,alunoRepository,userId,filtroNecessidade]);

  useEffect(() => {
    const timer=setTimeout(()=>{if (isOpen) {
      carregarDados();
      setReaproveitandoId(null);
      setSucessoMsg("");
    }},0);return()=>clearTimeout(timer);
  }, [isOpen, carregarDados]);

  if (!isOpen) return null;

  const handleExcluir = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Deseja realmente remover esta atividade do banco?")) return;
    try {
      await repository.removerAtividade(userId, id);
      setAtividades((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.warn("Erro ao excluir atividade:", err);
    }
  };

  const handleIniciarReaproveitamento = (ativ, e) => {
    e.stopPropagation();
    setReaproveitandoId(ativ.id);
    setAlunoDestinoId("");
    setAlunoDestinoNome("");
    setSucessoMsg("");
  };

  const handleConfirmarReaproveitamento = async (atividadeId) => {
    const nomeFinal = alunoDestinoNome.trim() || (alunoDestinoId ? alunosPEI.find(a => a.id === alunoDestinoId)?.nome : "");
    if (!nomeFinal) {
      alert("Por favor, selecione um estudante do PEI ou informe o nome do aluno.");
      return;
    }

    setProcessandoReaproveitamento(true);
    try {
      const clonada = await repository.reaproveitarParaAluno(userId, atividadeId, {
        ...(alunosPEI.find(a=>a.id===alunoDestinoId)||{}),
        id: alunoDestinoId,
        nome: nomeFinal,
      });

      setSucessoMsg(`Atividade reaproveitada com sucesso para ${nomeFinal}!`);
      setReaproveitandoId(null);
      await carregarDados();

      if (onCarregarAtividade) {
        onCarregarAtividade(clonada);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      alert("Erro ao reaproveitar atividade: " + err.message);
    } finally {
      setProcessandoReaproveitamento(false);
    }
  };

  // Filtragem local por termo de busca
  const atividadesFiltradas = atividades.filter((ativ) => {
    if (!busca) return true;
    const term = busca.toLowerCase();
    const tituloMatch = ativ.titulo?.toLowerCase().includes(term);
    const discMatch = ativ.disciplina?.toLowerCase().includes(term);
    const alunoMatch = ativ.alunoNome?.toLowerCase().includes(term);
    return tituloMatch || discMatch || alunoMatch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#123c3a]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-[#d5e3dc] rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#d5e3dc]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f3f8f5] border border-[#daebe5] text-[#0f766e] flex items-center justify-center">
              <FolderOpen size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#123c3a] flex items-center gap-2">
                Banco de Atividades & Provas Adaptadas (RN-38)
              </h3>
              <p className="text-xs text-[#4f6b63]">
                Reaproveite atividades e questões completas para estudantes com as mesmas necessidades
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#4f6b63] hover:text-[#123c3a] hover:bg-[#f3f7f5] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mensagem de sucesso */}
        {sucessoMsg && (
          <div className="p-3 bg-[#F3F8F5] border border-[#D5E3DC] text-[#123C3A] text-xs rounded-xl font-bold flex items-center gap-2">
            <Check size={16} className="text-[#0F766E]" />
            {sucessoMsg}
          </div>
        )}

        {/* Barra de Filtros e Busca */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4f6b63]" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por disciplina, título ou aluno..."
                className="w-full bg-[#f3f7f5] border border-[#d5e3dc] focus:bg-white focus:border-[#0f766e] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#123c3a] outline-none transition-all"
              />
            </div>
          </div>

          {/* Filtro por Deficiência / Necessidade */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-bold text-[#4f6b63] flex items-center gap-1 flex-shrink-0 mr-1">
              <Filter size={12} />
              Filtrar Necessidade:
            </span>
            <button
              type="button"
              onClick={() => setFiltroNecessidade("")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                filtroNecessidade === ""
                  ? "bg-[#123c3a] text-white"
                  : "bg-[#f3f7f5] border border-[#d5e3dc] text-[#4f6b63] hover:text-[#123c3a]"
              }`}
            >
              Todas
            </button>
            {CATEGORIAS_DEFICIENCIA.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFiltroNecessidade(cat.id === filtroNecessidade ? "" : cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                  filtroNecessidade === cat.id
                    ? "bg-[#0f766e] text-white shadow-xs"
                    : "bg-[#f3f7f5] border border-[#d5e3dc] text-[#4f6b63] hover:text-[#123c3a]"
                }`}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Atividades */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {carregando ? (
            <div className="py-12 text-center text-xs text-[#4f6b63]">
              Carregando banco de atividades adaptadas...
            </div>
          ) : atividadesFiltradas.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed border-[#d5e3dc] rounded-2xl bg-[#f3f7f5]">
              <BookOpen size={32} className="mx-auto text-[#4f6b63]/60" />
              <p className="text-xs font-bold text-[#123c3a]">Nenhuma atividade encontrada no banco.</p>
              <p className="text-[11px] text-[#4f6b63] max-w-sm mx-auto">
                Ao gerar uma atividade adaptada, clique em &ldquo;Salvar no Banco&rdquo; para guardá-la e reaproveitá-la futuramente para outros estudantes.
              </p>
            </div>
          ) : (
            atividadesFiltradas.map((ativ) => {
              const totalQ =
                ativ.quantidadeQuestoes ||
                (Array.isArray(ativ.atividadeAdaptada?.questoes)
                  ? ativ.atividadeAdaptada.questoes.length
                  : 1);

              const isReaproveitando = reaproveitandoId === ativ.id;

              return (
                <div
                  key={ativ.id}
                  className="p-4 bg-white border border-[#d5e3dc] hover:border-[#0f766e]/30 rounded-2xl transition-all shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f3f8f5] text-[#0b5f59] border border-[#daebe5]">
                          {ativ.disciplina || "Geral"}
                        </span>
                        {ativ.anoEscolar && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F3F7F5] text-[#35594D]">
                            {ativ.anoEscolar}
                          </span>
                        )}
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#F3F8F5] text-[#0B5F59] border border-[#DAEBE5]">
                          {totalQ} {totalQ === 1 ? "questão" : "questões"}
                        </span>
                        {ativ.alunoNome && (
                          <span className="text-[11px] font-medium text-[#4f6b63] flex items-center gap-1">
                            <UserCheck size={12} className="text-[#0F766E]" />
                            Feita para: <strong className="text-[#123c3a]">{ativ.alunoNome}</strong>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-[#123c3a]">
                        {ativ.titulo || "Atividade Adaptada"}
                      </h4>

                      {/* Badges das necessidades */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(ativ.necessidades || []).map((necId) => {
                          const cat = CATEGORIAS_MAP[necId];
                          return (
                            <span
                              key={necId}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F7F5] text-[#35594D]"
                            >
                              {cat?.nome || necId}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2 self-end sm:self-start flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleIniciarReaproveitamento(ativ, e)}
                        className="px-3 py-1.5 rounded-xl border border-[#d5e3dc] hover:border-[#0f766e]/40 bg-[#f3f7f5] hover:bg-[#f3f8f5] text-xs font-bold text-[#123c3a] hover:text-[#0b5f59] transition-all flex items-center gap-1.5"
                        title="Reaproveitar para outro estudante com necessidades iguais"
                      >
                        <Copy size={13} />
                        Reaproveitar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onCarregarAtividade) {
                            onCarregarAtividade(ativ);
                            onClose();
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#0f766e] hover:bg-[#0b5f59] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <ArrowRight size={13} />
                        Carregar
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleExcluir(ativ.id, e)}
                        className="p-1.5 text-slate-400 hover:text-[#0F766E] transition-colors"
                        title="Excluir do banco"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Painel Inline de Reaproveitamento */}
                  {isReaproveitando && (
                    <div className="p-3.5 bg-[#F3F8F5]/60 border border-[#D5E3DC] rounded-xl space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#123C3A] flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[#0F766E]" />
                          Reaproveitar para outro estudante com as mesmas necessidades:
                        </span>
                        <button
                          type="button"
                          onClick={() => setReaproveitandoId(null)}
                          className="text-[11px] text-[#566F65] hover:text-[#194D46]"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {alunosPEI.length > 0 && (
                          <div>
                            <label className="text-[11px] font-bold text-[#35594D] block mb-0.5">
                              Selecionar Aluno do PEI:
                            </label>
                            <select
                              value={alunoDestinoId}
                              onChange={(e) => {
                                setAlunoDestinoId(e.target.value);
                                const selected = alunosPEI.find((a) => a.id === e.target.value);
                                if (selected) setAlunoDestinoNome(selected.nome);
                              }}
                              className="w-full bg-white border border-[#B7D3C8] rounded-lg px-2.5 py-1.5 text-xs text-[#194D46] outline-none"
                            >
                              <option value="">-- Escolher aluno do banco --</option>
                              {alunosPEI.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.nome} {a.turmaNome ? `(${a.turmaNome})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="text-[11px] font-bold text-[#35594D] block mb-0.5">
                            Ou Digite o Nome do Aluno:
                          </label>
                          <input
                            type="text"
                            value={alunoDestinoNome}
                            onChange={(e) => setAlunoDestinoNome(e.target.value)}
                            placeholder="Ex: Bernardo M."
                            className="w-full bg-white border border-[#B7D3C8] rounded-lg px-2.5 py-1.5 text-xs text-[#194D46] outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          disabled={processandoReaproveitamento}
                          onClick={() => handleConfirmarReaproveitamento(ativ.id)}
                          className="px-4 py-1.5 bg-[#123c3a] hover:bg-[#1b4d48] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          {processandoReaproveitamento ? "Reaproveitando..." : "Confirmar e Abrir Atividade"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="pt-2 border-t border-[#d5e3dc] flex items-center justify-between text-xs text-[#4f6b63]">
          <span>Total salvo: {atividades.length} atividades</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#d5e3dc] rounded-xl text-xs font-bold text-[#123c3a] hover:bg-[#F3F8F5] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
