"use client";

import React, { useState } from 'react';
import {
  adicionarOcorrencia,
  filtrarOcorrencias,
  removerOcorrencia,
  TIPOS_OCORRENCIA,
  LABELS_TIPO,
} from '@/dominio/diario/ocorrenciasPedagogicas';

export const DiarioDeBordo = ({ turma, onSalvarOcorrencias }) => {
  const ocorrencias = Array.isArray(turma?.ocorrencias) ? turma.ocorrencias : [];
  const alunos = Array.isArray(turma?.alunos) ? turma.alunos : [];

  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [alunoFiltro, setAlunoFiltro] = useState('');
  const [termoBusca, setTermoBusca] = useState('');
  const [apenasFamilia, setApenasFamilia] = useState(false);

  // Estado do formulário de nova ocorrência
  const [novoTipo, setNovoTipo] = useState('pedagogica');
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaData, setNovaData] = useState(() => new Date().toISOString().slice(0, 10));
  const [alunosSelecionados, setAlunosSelecionados] = useState([]);
  const [visivelFamilia, setVisivelFamilia] = useState(true);
  const [erroMsg, setErroMsg] = useState('');

  const ocorrenciasFiltradas = filtrarOcorrencias(ocorrencias, {
    tipo: tipoFiltro,
    alunoId: alunoFiltro,
    termo: termoBusca,
    apenasFamilia,
  });

  const handleToggleAluno = (alunoId) => {
    setAlunosSelecionados((prev) =>
      prev.includes(alunoId) ? prev.filter((id) => id !== alunoId) : [...prev, alunoId]
    );
  };

  const handleSalvarNova = (e) => {
    e.preventDefault();
    setErroMsg('');

    try {
      const atualizadas = adicionarOcorrencia(ocorrencias, {
        tipo: novoTipo,
        titulo: novoTitulo,
        descricao: novaDescricao,
        data: novaData,
        alunoIds: alunosSelecionados,
        visivelFamilia,
      });

      if (onSalvarOcorrencias) {
        onSalvarOcorrencias(turma.id, atualizadas);
      }

      // Resetar form
      setNovoTitulo('');
      setNovaDescricao('');
      setAlunosSelecionados([]);
      setMostrarForm(false);
    } catch (err) {
      setErroMsg(err.message || 'Erro ao registrar ocorrência.');
    }
  };

  const handleRemover = (ocorrenciaId) => {
    if (confirm('Deseja realmente excluir este registro do Diário de Bordo?')) {
      const atualizadas = removerOcorrencia(ocorrencias, ocorrenciaId);
      if (onSalvarOcorrencias) {
        onSalvarOcorrencias(turma.id, atualizadas);
      }
    }
  };

  const getNomeAluno = (id) => {
    const al = alunos.find((a) => a.id === id);
    return al?.nome || 'Aluno';
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto max-w-6xl mx-auto w-full">
      {/* Topo / Barra de Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#dce0f0]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#101942]">Diário de Bordo & Ocorrências</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#eef0f8] text-[#101942] border border-[#dce0f0]">
              {ocorrencias.length} {ocorrencias.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <p className="text-xs text-[#6070a0] mt-0.5">
            Anotações pedagógicas, convivência, elogios e alinhamentos com a família da Turma {turma?.nome}.
          </p>
        </div>

        <button
          onClick={() => {
            setMostrarForm(!mostrarForm);
            setErroMsg('');
          }}
          className="px-4 py-2 btn-brand-primary rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 self-start md:self-auto"
        >
          {mostrarForm ? '✕ Fechar Formulário' : '+ Nova Anotação'}
        </button>
      </div>

      {/* Formulário de Cadastro */}
      {mostrarForm && (
        <form onSubmit={handleSalvarNova} className="bg-white border border-[#dce0f0] rounded-2xl p-5 my-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-[#101942]">Nova Ocorrência ou Anotação Pedagógica</h3>
            <span className="text-[11px] text-slate-400">RN-58 • Histórico Formativo</span>
          </div>

          {erroMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
              ⚠️ {erroMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Data do Registro
              </label>
              <input
                type="date"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
                className="w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-2 text-xs text-[#101942] font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#f60c49]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tipo de Registro
              </label>
              <select
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value)}
                className="w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-2 text-xs text-[#101942] font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#f60c49]"
              >
                {TIPOS_OCORRENCIA.map((t) => (
                  <option key={t} value={t}>
                    {LABELS_TIPO[t]?.icon} {LABELS_TIPO[t]?.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Título / Motivo
              </label>
              <input
                type="text"
                placeholder="Ex: Evolução na produção textual dissertativa"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                className="w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-2 text-xs text-[#101942] outline-none focus:bg-white focus:ring-1 focus:ring-[#f60c49]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Descrição Detalhada & Encaminhamentos
            </label>
            <textarea
              rows={3}
              placeholder="Descreva o ocorrido, intervenção realizada ou combinados com o aluno/turma..."
              value={novaDescricao}
              onChange={(e) => setNovaDescricao(e.target.value)}
              className="w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-xl p-3 text-xs text-[#101942] outline-none focus:bg-white focus:ring-1 focus:ring-[#f60c49] leading-relaxed"
              required
            />
          </div>

          {/* Seleção de Alunos Envolvidos */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Alunos Envolvidos <span className="font-normal text-slate-400 normal-case">(opcional — deixe vazio se for sobre a turma toda)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#f7f8fc] border border-[#dce0f0] rounded-xl">
              {alunos.map((al) => {
                const selecionado = alunosSelecionados.includes(al.id);
                return (
                  <button
                    key={al.id}
                    type="button"
                    onClick={() => handleToggleAluno(al.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selecionado
                        ? 'bg-[#101942] text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {selecionado ? '✓ ' : '+ '}
                    {al.nome}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle Família */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#101942] font-semibold select-none">
              <input
                type="checkbox"
                checked={visivelFamilia}
                onChange={(e) => setVisivelFamilia(e.target.checked)}
                className="rounded border-slate-300 text-[#f60c49] focus:ring-[#f60c49]"
              />
              <span>Compartilhar na Ficha 360º / Reunião com Responsáveis</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 btn-brand-primary rounded-xl text-white text-xs font-bold transition-all shadow-xs"
              >
                Salvar Anotação
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white border border-[#dce0f0] rounded-2xl p-3.5 my-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 items-center">
        <div>
          <input
            type="text"
            placeholder="Buscar por termo ou motivo..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-1.5 text-xs text-[#101942] outline-none focus:bg-white"
          />
        </div>

        <div>
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-1.5 text-xs text-[#101942] font-medium outline-none focus:bg-white"
          >
            <option value="">Todos os tipos</option>
            {TIPOS_OCORRENCIA.map((t) => (
              <option key={t} value={t}>
                {LABELS_TIPO[t]?.icon} {LABELS_TIPO[t]?.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={alunoFiltro}
            onChange={(e) => setAlunoFiltro(e.target.value)}
            className="w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-1.5 text-xs text-[#101942] font-medium outline-none focus:bg-white"
          >
            <option value="">Todos os alunos / Turma</option>
            {alunos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              checked={apenasFamilia}
              onChange={(e) => setApenasFamilia(e.target.checked)}
              className="rounded border-slate-300 text-[#f60c49] focus:ring-[#f60c49]"
            />
            <span>Apenas Ficha 360 / Família</span>
          </label>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="space-y-3 mt-1">
        {ocorrenciasFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white/60 border border-dashed border-[#dce0f0] rounded-2xl">
            <div className="text-3xl mb-2">📝</div>
            <h4 className="text-sm font-bold text-[#101942]">Nenhuma ocorrência encontrada</h4>
            <p className="text-xs text-[#6070a0] mt-1 max-w-sm mx-auto">
              Utilize o botão acima para registrar fatos pedagógicos, atitudes de destaque ou alinhamentos com pais.
            </p>
          </div>
        ) : (
          ocorrenciasFiltradas.map((oc) => {
            const configTipo = LABELS_TIPO[oc.tipo] || LABELS_TIPO.pedagogica;
            const dataFmt = oc.data ? oc.data.split('-').reverse().join('/') : '—';

            return (
              <div
                key={oc.id}
                className="bg-white border border-[#dce0f0] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all relative group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border flex items-center gap-1 ${configTipo.badgeClass}`}
                    >
                      <span>{configTipo.icon}</span>
                      <span>{configTipo.label}</span>
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-medium">📅 {dataFmt}</span>
                    {oc.visivelFamilia && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                        ✓ Ficha 360 / Família
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemover(oc.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs font-medium transition-all self-end sm:self-auto"
                    title="Excluir ocorrência"
                  >
                    🗑 Excluir
                  </button>
                </div>

                <div className="mt-2.5">
                  <h4 className="text-sm font-extrabold text-[#101942]">{oc.titulo}</h4>
                  <p className="text-xs text-[#304060] mt-1 whitespace-pre-wrap leading-relaxed">
                    {oc.descricao}
                  </p>
                </div>

                {Array.isArray(oc.alunoIds) && oc.alunoIds.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estudantes:</span>
                    {oc.alunoIds.map((aid) => (
                      <span
                        key={aid}
                        className="px-2 py-0.5 rounded-md text-[11px] bg-[#f7f8fc] border border-[#dce0f0] text-[#101942] font-medium"
                      >
                        👤 {getNomeAluno(aid)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
