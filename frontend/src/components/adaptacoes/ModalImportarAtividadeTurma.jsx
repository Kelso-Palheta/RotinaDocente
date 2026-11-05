"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  X,
  Loader2,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { listAtividades, listAllAtividades } from "@/lib/firebase-atividades";
import { extrairTextoAtividadeTurma } from "@/dominio/adaptacoes/importadorAtividadeTurma";

export function ModalImportarAtividadeTurma({
  isOpen,
  onClose,
  turmas = [],
  turmaSelecionadaId = "",
  user = null,
  onImportarAtividade,
}) {
  const [turmaId, setTurmaId] = useState(turmaSelecionadaId || turmas[0]?.id || "");
  const [atividades, setAtividades] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [termoBusca, setTermoBusca] = useState("");

  const [turmaExternaAnterior, setTurmaExternaAnterior] = useState(turmaSelecionadaId);
  if (turmaExternaAnterior !== turmaSelecionadaId) {
    setTurmaExternaAnterior(turmaSelecionadaId);
    setTurmaId(turmaSelecionadaId || turmas[0]?.id || "");
  } else if (!turmaId && turmas.length > 0) {
    setTurmaId(turmas[0].id);
  }

  useEffect(() => {
    if (!isOpen) return;

    let cancel = false;
    async function carregarAtividades() {
      setCarregando(true);
      setErro("");
      try {
        let lista = [];
        if (user?.uid) {
          if (turmaId) {
            lista = await listAtividades(user.uid, turmaId);
          } else {
            lista = await listAllAtividades(user.uid);
          }
        }

        // Se não encontrou na coleção de atividades ou o professor usa apenas a grade do diário:
        const turmaAtual = turmas.find((t) => t.id === turmaId);
        if (turmaAtual && turmaAtual.bimestres) {
          Object.entries(turmaAtual.bimestres).forEach(([bKey, bData]) => {
            if (Array.isArray(bData?.atividades)) {
              bData.atividades.forEach((atvDiario) => {
                if (!lista.some((l) => l.id === atvDiario.id || l.titulo === atvDiario.nome)) {
                  lista.push({
                    id: atvDiario.id || `diario_${bKey}_${atvDiario.nome}`,
                    titulo: atvDiario.nome || "Atividade do Diário",
                    bimestre: Number(bKey),
                    disciplina: turmaAtual.disciplina || "Geral",
                    anoEscolar: turmaAtual.nome || "",
                    origem: "diario",
                  });
                }
              });
            }
          });
        }

        if (!cancel) {
          setAtividades(lista);
        }
      } catch (err) {
        if (!cancel) {
          console.error("Erro ao carregar atividades da turma:", err);
          setErro("Falha ao buscar atividades da turma. Tente novamente.");
        }
      } finally {
        if (!cancel) setCarregando(false);
      }
    }

    carregarAtividades();
    return () => {
      cancel = true;
    };
  }, [isOpen, turmaId, user, turmas]);

  if (!isOpen) return null;

  const atividadesFiltradas = atividades.filter((atv) => {
    if (!termoBusca.trim()) return true;
    const termo = termoBusca.toLowerCase();
    const titulo = (atv.titulo || atv.nome || "").toLowerCase();
    const disciplina = (atv.disciplina || "").toLowerCase();
    return titulo.includes(termo) || disciplina.includes(termo);
  });

  const handleSelecionar = (atv) => {
    const textoExtraido = extrairTextoAtividadeTurma(atv);
    const turmaAtual = turmas.find((t) => t.id === turmaId);

    onImportarAtividade({
      tema: atv.titulo || atv.nome || "",
      disciplina: atv.disciplina || turmaAtual?.disciplina || "Geral",
      anoEscolar: atv.anoEscolar || turmaAtual?.nome || "",
      conteudoBase: textoExtraido || atv.titulo || "",
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25104a]/50 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Puxar Atividade da Turma"
    >
      <div
        className="bg-white rounded-3xl border border-[#e2d9f7] shadow-2xl p-6 w-full max-w-xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F3EDFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#f3edff] border border-[#e7dbfd] flex items-center justify-center text-[#6315d9]">
              <FolderOpen size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#25104a]">
                Puxar Atividade Cadastrada da Turma
              </h3>
              <p className="text-[11px] text-[#5b4b86] font-medium">
                Importe os enunciados e questões originais para adaptar para o estudante (RN-60)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-[#5B4B86] p-1 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Seleção de Turma & Busca */}
        <div className="py-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5b4b86] mb-1">
                Turma
              </label>
              <select
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                className="w-full bg-[#f3edff] border border-[#e2d9f7] rounded-xl px-3 py-2 text-xs font-bold text-[#25104a] outline-none focus:border-[#6315d9] transition-all"
              >
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome || t.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5b4b86] mb-1">
                Filtrar por nome
              </label>
              <input
                type="text"
                placeholder="Ex: Prova, Lista, Revolução..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full bg-[#f3edff] border border-[#e2d9f7] rounded-xl px-3 py-2 text-xs text-[#25104a] outline-none focus:border-[#6315d9] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Lista de Atividades */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 min-h-[180px]">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-10 text-xs text-[#5b4b86] gap-2">
              <Loader2 size={18} className="animate-spin text-[#6315d9]" />
              <span>Buscando atividades cadastradas...</span>
            </div>
          ) : erro ? (
            <div className="p-4 bg-[#F3EDFF] border border-[#E2D9F7] rounded-2xl text-[#5411B8] text-xs text-center">
              <AlertCircle size={18} className="mx-auto mb-1 text-[#6315D9]" />
              <p>{erro}</p>
            </div>
          ) : atividadesFiltradas.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#f3edff] border border-dashed border-[#e2d9f7] rounded-2xl">
              <FileText size={24} className="mx-auto mb-2 text-[#6e5f94]" />
              <p className="text-xs font-bold text-[#25104a]">
                Nenhuma atividade encontrada nesta turma.
              </p>
              <p className="text-[11px] text-[#5b4b86] mt-1">
                Você pode anexar um arquivo PDF/Word ou colar as questões manualmente.
              </p>
            </div>
          ) : (
            atividadesFiltradas.map((atv) => (
              <div
                key={atv.id}
                onClick={() => handleSelecionar(atv)}
                className="p-3.5 rounded-2xl border border-[#e2d9f7] hover:border-[#6315d9] hover:bg-[#f3edff]/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#25104a] group-hover:text-[#5411b8] transition-colors truncate">
                      {atv.titulo || atv.nome}
                    </span>
                    {atv.bimestre && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#F3EDFF] text-[#5b4b86]">
                        {atv.bimestre}º Bimestre
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#5b4b86]">
                    {atv.disciplina || "Geral"}
                    {Array.isArray(atv.questoes) && ` • ${atv.questoes.length} questão(ões)`}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 px-3 py-1.5 bg-white border border-[#e2d9f7] group-hover:border-[#6315d9] group-hover:bg-[#6315d9] group-hover:text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                >
                  Selecionar
                </button>
              </div>
            ))
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="pt-3 border-t border-[#F3EDFF] flex items-center justify-between text-[11px] text-[#5b4b86]">
          <span>
            {atividadesFiltradas.length} atividade(s) disponível(is)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-[#E2D9F7] hover:bg-[#F3EDFF] text-[#4A3B7C] rounded-xl font-bold transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
