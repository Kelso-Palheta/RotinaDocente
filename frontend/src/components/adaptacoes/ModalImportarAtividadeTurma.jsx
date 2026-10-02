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

  useEffect(() => {
    if (turmaSelecionadaId) {
      setTurmaId(turmaSelecionadaId);
    } else if (turmas.length > 0 && !turmaId) {
      setTurmaId(turmas[0].id);
    }
  }, [turmaSelecionadaId, turmas]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101942]/50 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Puxar Atividade da Turma"
    >
      <div
        className="bg-white rounded-3xl border border-[#dce0f0] shadow-2xl p-6 w-full max-w-xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#fff2f6] border border-[#fde4ec] flex items-center justify-center text-[#f60c49]">
              <FolderOpen size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#101942]">
                Puxar Atividade Cadastrada da Turma
              </h3>
              <p className="text-[11px] text-[#6070a0] font-medium">
                Importe os enunciados e questões originais para adaptar para o estudante (RN-60)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Seleção de Turma & Busca */}
        <div className="py-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#6070a0] mb-1">
                Turma
              </label>
              <select
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                className="w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-2 text-xs font-bold text-[#101942] outline-none focus:border-[#f60c49] transition-all"
              >
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome || t.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#6070a0] mb-1">
                Filtrar por nome
              </label>
              <input
                type="text"
                placeholder="Ex: Prova, Lista, Revolução..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-2 text-xs text-[#101942] outline-none focus:border-[#f60c49] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Lista de Atividades */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 min-h-[180px]">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-10 text-xs text-[#6070a0] gap-2">
              <Loader2 size={18} className="animate-spin text-[#f60c49]" />
              <span>Buscando atividades cadastradas...</span>
            </div>
          ) : erro ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs text-center">
              <AlertCircle size={18} className="mx-auto mb-1 text-rose-600" />
              <p>{erro}</p>
            </div>
          ) : atividadesFiltradas.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#f7f8fc] border border-dashed border-[#dce0f0] rounded-2xl">
              <FileText size={24} className="mx-auto mb-2 text-[#9098c0]" />
              <p className="text-xs font-bold text-[#101942]">
                Nenhuma atividade encontrada nesta turma.
              </p>
              <p className="text-[11px] text-[#6070a0] mt-1">
                Você pode anexar um arquivo PDF/Word ou colar as questões manualmente.
              </p>
            </div>
          ) : (
            atividadesFiltradas.map((atv) => (
              <div
                key={atv.id}
                onClick={() => handleSelecionar(atv)}
                className="p-3.5 rounded-2xl border border-[#dce0f0] hover:border-[#f60c49] hover:bg-[#fff2f6]/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#101942] group-hover:text-[#d40840] transition-colors truncate">
                      {atv.titulo || atv.nome}
                    </span>
                    {atv.bimestre && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 text-[#6070a0]">
                        {atv.bimestre}º Bimestre
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6070a0]">
                    {atv.disciplina || "Geral"}
                    {Array.isArray(atv.questoes) && ` • ${atv.questoes.length} questão(ões)`}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 px-3 py-1.5 bg-white border border-[#dce0f0] group-hover:border-[#f60c49] group-hover:bg-[#f60c49] group-hover:text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                >
                  Selecionar
                </button>
              </div>
            ))
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#6070a0]">
          <span>
            {atividadesFiltradas.length} atividade(s) disponível(is)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
