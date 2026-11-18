'use client';

import React, { useId, useRef, useState } from 'react';
import {
  ANOS_ESCOLARES_SUGERIDOS,
  DIFICULDADES,
  DISCIPLINAS_SUGERIDAS,
  LETRAS,
  TIPOS_QUESTAO,
  gerarIdOpacoCarta,
  validarUrlImagemSegura,
} from './constantes';

function criarAlternativasIniciais() {
  return [
    { id: 'alt-1', texto: '' },
    { id: 'alt-2', texto: '' },
    { id: 'alt-3', texto: '' },
    { id: 'alt-4', texto: '' },
  ];
}

function criarParVazio() {
  return {
    id: gerarIdOpacoCarta(),
    esquerdaId: gerarIdOpacoCarta(),
    direitaId: gerarIdOpacoCarta(),
    esquerda: '',
    direita: '',
  };
}

function criarParesIniciais() {
  return [criarParVazio(), criarParVazio(), criarParVazio()];
}

function criarItensIniciais() {
  return [
    { id: 'item-1', texto: '' },
    { id: 'item-2', texto: '' },
    { id: 'item-3', texto: '' },
  ];
}

function ordenarItensPeloGabarito(itensOriginais, respostaCorreta) {
  const normalizados = itensOriginais.map((it, i) => ({
    ...it,
    id: it.id || `item-${i + 1}`,
    texto: it.texto || '',
  }));
  if (!Array.isArray(respostaCorreta) || respostaCorreta.length === 0) {
    return normalizados;
  }
  const porId = new Map(normalizados.map((it) => [String(it.id), it]));
  const ordenados = [];
  const usados = new Set();
  for (const idCorreto of respostaCorreta) {
    const chave = String(idCorreto);
    const item = porId.get(chave);
    if (item && !usados.has(chave)) {
      ordenados.push(item);
      usados.add(chave);
    }
  }
  for (const it of normalizados) {
    if (!usados.has(String(it.id))) {
      ordenados.push(it);
    }
  }
  return ordenados;
}

function idCartaPrevisivel(id) {
  return typeof id === 'string' && /^(?:esq|dir)_\d+_par-/i.test(id);
}

function inicializarEstado(questaoInicial, tipoPadrao = 'multipla_escolha') {
  const tipo = questaoInicial?.tipo || tipoPadrao;
  const alternativas =
    Array.isArray(questaoInicial?.alternativas) && questaoInicial.alternativas.length >= 2
      ? questaoInicial.alternativas.map((a, i) => ({ id: a.id || `alt-${i + 1}`, texto: a.texto || '' }))
      : criarAlternativasIniciais();
  const pares =
    Array.isArray(questaoInicial?.pares) && questaoInicial.pares.length >= 2
      ? questaoInicial.pares.map((p) => {
          const esqIdExistente = typeof p.esquerda === 'object' ? p.esquerda?.id : undefined;
          const dirIdExistente = typeof p.direita === 'object' ? p.direita?.id : undefined;
          return {
            id: p.id || gerarIdOpacoCarta(),
            esquerdaId: esqIdExistente && !idCartaPrevisivel(esqIdExistente) ? esqIdExistente : gerarIdOpacoCarta(),
            direitaId: dirIdExistente && !idCartaPrevisivel(dirIdExistente) ? dirIdExistente : gerarIdOpacoCarta(),
            esquerda: typeof p.esquerda === 'object' ? p.esquerda?.texto || '' : p.esquerda || '',
            direita: typeof p.direita === 'object' ? p.direita?.texto || '' : p.direita || '',
          };
        })
      : criarParesIniciais();
  const itens =
    Array.isArray(questaoInicial?.itens) && questaoInicial.itens.length >= 2
      ? ordenarItensPeloGabarito(
          questaoInicial.itens,
          tipo === 'ordenacao' ? questaoInicial?.respostaCorreta : null
        )
      : criarItensIniciais();

  return {
    id: questaoInicial?.id || undefined,
    revision: questaoInicial?.revision,
    status: questaoInicial?.status || 'rascunho',
    origem: questaoInicial?.origem || { tipo: 'manual' },
    disciplina: questaoInicial?.disciplina || '',
    anoEscolar: questaoInicial?.anoEscolar || '',
    conteudo: questaoInicial?.conteudo || '',
    dificuldade: questaoInicial?.dificuldade || 'medio',
    tipo,
    enunciado: questaoInicial?.enunciado || '',
    imagemUrl: questaoInicial?.imagem?.url || '',
    imagemAlt: questaoInicial?.imagem?.alt || '',
    alternativas,
    respostaAlternativa:
      tipo === 'multipla_escolha' && typeof questaoInicial?.respostaCorreta === 'string'
        ? questaoInicial.respostaCorreta
        : alternativas[0]?.id || 'alt-1',
    pares,
    itens,
    explicacao: questaoInicial?.explicacao || '',
    justificativaDificuldade: questaoInicial?.justificativaDificuldade || '',
  };
}

export function FormularioQuestao({
  questaoInicial = null,
  tipoPadrao = 'multipla_escolha',
  salvando = false,
  erroExterno = null,
  onSalvar,
  onCancelar,
}) {
  const [form, setForm] = useState(() => inicializarEstado(questaoInicial, tipoPadrao));
  const [erros, setErros] = useState({});
  const formId = useId();
  const refsCampos = useRef({});

  const ehEdicao = Boolean(form.id);
  const eraRevisada = questaoInicial?.status === 'revisada';

  const atualizar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => {
      if (!prev[campo]) return prev;
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  };

  const moverItemOrdenacao = (indice, direcao) => {
    const destino = indice + direcao;
    if (destino < 0 || destino >= form.itens.length) return;
    setForm((prev) => {
      const lista = [...prev.itens];
      [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
      return { ...prev, itens: lista };
    });
  };

  const validar = () => {
    const novos = {};
    if (!form.disciplina.trim()) novos.disciplina = 'Informe a disciplina.';
    if (!form.anoEscolar.trim()) novos.anoEscolar = 'Informe a série ou ano escolar.';
    if (!form.conteudo.trim()) novos.conteudo = 'Informe o conteúdo pedagógico.';
    if (!form.enunciado.trim()) novos.enunciado = 'Escreva o enunciado da questão.';
    if (!form.explicacao.trim()) novos.explicacao = 'Inclua a explicação pedagógica para o feedback.';
    if (!form.justificativaDificuldade.trim()) {
      novos.justificativaDificuldade = 'Justifique o nível de dificuldade para a série/ano.';
    }

    if (form.imagemUrl.trim()) {
      if (!validarUrlImagemSegura(form.imagemUrl)) {
        novos.imagemUrl = 'Use uma URL http(s) válida ou caminho interno iniciado por /.';
      }
      if (!form.imagemAlt.trim()) {
        novos.imagemAlt = 'Informe a alternativa textual (alt) da imagem para acessibilidade.';
      }
    }

    if (form.tipo === 'multipla_escolha') {
      const preenchidas = form.alternativas.filter((a) => a.texto.trim());
      if (preenchidas.length < 2) {
        novos.alternativas = 'Preencha pelo menos duas alternativas.';
      } else if (!preenchidas.some((a) => a.id === form.respostaAlternativa)) {
        novos.alternativas = 'Selecione uma alternativa preenchida como gabarito.';
      }
    } else if (form.tipo === 'pares') {
      const completos = form.pares.filter((p) => p.esquerda.trim() && p.direita.trim());
      if (completos.length < 2) {
        novos.pares = 'Preencha pelo menos dois pares completos (esquerda e direita).';
      }
    } else if (form.tipo === 'ordenacao') {
      const completos = form.itens.filter((it) => it.texto.trim());
      if (completos.length < 2) {
        novos.itens = 'Preencha pelo menos dois itens para ordenação.';
      }
    }

    return novos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = validar();
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      const primeiroCampo = Object.keys(novosErros)[0];
      refsCampos.current[primeiroCampo]?.focus();
      return;
    }

    const base = {
      ...(form.id ? { id: form.id } : {}),
      disciplina: form.disciplina.trim(),
      anoEscolar: form.anoEscolar.trim(),
      conteudo: form.conteudo.trim(),
      dificuldade: form.dificuldade,
      tipo: form.tipo,
      enunciado: form.enunciado.trim(),
      ...(form.imagemUrl.trim()
        ? { imagem: { url: form.imagemUrl.trim(), alt: form.imagemAlt.trim() } }
        : {}),
      explicacao: form.explicacao.trim(),
      justificativaDificuldade: form.justificativaDificuldade.trim(),
      status: 'rascunho',
      origem: form.origem || { tipo: 'manual' },
    };

    if (form.tipo === 'multipla_escolha') {
      const alternativas = form.alternativas
        .filter((a) => a.texto.trim())
        .map((a) => ({ id: a.id, texto: a.texto.trim() }));
      base.alternativas = alternativas;
      base.respostaCorreta = form.respostaAlternativa;
    } else if (form.tipo === 'pares') {
      const pares = form.pares
        .filter((p) => p.esquerda.trim() && p.direita.trim())
        .map((p) => {
          const parId = p.id || gerarIdOpacoCarta();
          const esqId = p.esquerdaId && !idCartaPrevisivel(p.esquerdaId) ? p.esquerdaId : gerarIdOpacoCarta();
          const dirId = p.direitaId && !idCartaPrevisivel(p.direitaId) ? p.direitaId : gerarIdOpacoCarta();
          return {
            id: parId,
            esquerda: { id: esqId, texto: p.esquerda.trim() },
            direita: { id: dirId, texto: p.direita.trim() },
          };
        });
      base.pares = pares;
      base.respostaCorreta = pares.map((p) => ({
        esquerdaId: p.esquerda.id,
        direitaId: p.direita.id,
      }));
    } else if (form.tipo === 'ordenacao') {
      const itens = form.itens
        .filter((it) => it.texto.trim())
        .map((it) => ({ ...it, id: it.id, texto: it.texto.trim() }));
      base.itens = itens;
      base.respostaCorreta = itens.map((it) => it.id);
    }

    await onSalvar?.(base, form.revision);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={`${formId}-titulo`}
      className="rounded-2xl border-2 border-[#6315D9]/40 bg-[#FFFDF7] p-5 sm:p-6 space-y-5 shadow-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2D9F7] pb-3">
        <div>
          <h3 id={`${formId}-titulo`} className="font-head text-lg font-black text-[#25104A]">
            {ehEdicao ? 'Editar questão' : 'Nova questão manual'}
          </h3>
          {eraRevisada && (
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 mt-1">
              Atenção: ao editar conteúdo ou gabarito, a questão retorna para status de rascunho e precisará de nova revisão docente.
            </p>
          )}
        </div>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="min-h-10 rounded-xl border border-[#E2D9F7] bg-white px-3 py-1.5 text-xs font-bold text-[#5B4B86] hover:bg-[#F3EDFF]"
          >
            Fechar editor
          </button>
        )}
      </div>

      {erroExterno && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-900">
          {erroExterno}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-disciplina`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
            Disciplina <span aria-hidden="true">*</span>
          </label>
          <input
            ref={(el) => { refsCampos.current.disciplina = el; }}
            id={`${formId}-disciplina`}
            name="disciplina"
            type="text"
            list={`${formId}-lista-disciplinas`}
            value={form.disciplina}
            onChange={(e) => atualizar('disciplina', e.target.value)}
            required
            aria-invalid={erros.disciplina ? 'true' : 'false'}
            aria-describedby={erros.disciplina ? `${formId}-err-disciplina` : undefined}
            placeholder="Ex.: Biologia, Arte / ENEM"
            className="min-h-12 rounded-xl border border-[#E2D9F7] bg-white px-3 py-2 text-base text-[#25104A] focus-visible:outline-2 focus-visible:outline-[#6315D9]"
          />
          <datalist id={`${formId}-lista-disciplinas`}>
            {DISCIPLINAS_SUGERIDAS.map((d) => <option key={d} value={d} />)}
          </datalist>
          {erros.disciplina && (
            <span id={`${formId}-err-disciplina`} className="text-xs font-semibold text-red-700">{erros.disciplina}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-ano`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
            Série / Ano escolar <span aria-hidden="true">*</span>
          </label>
          <input
            ref={(el) => { refsCampos.current.anoEscolar = el; }}
            id={`${formId}-ano`}
            name="anoEscolar"
            type="text"
            list={`${formId}-lista-anos`}
            value={form.anoEscolar}
            onChange={(e) => atualizar('anoEscolar', e.target.value)}
            required
            aria-invalid={erros.anoEscolar ? 'true' : 'false'}
            aria-describedby={erros.anoEscolar ? `${formId}-err-ano` : undefined}
            placeholder="Ex.: 1º ano EM"
            className="min-h-12 rounded-xl border border-[#E2D9F7] bg-white px-3 py-2 text-base text-[#25104A] focus-visible:outline-2 focus-visible:outline-[#6315D9]"
          />
          <datalist id={`${formId}-lista-anos`}>
            {ANOS_ESCOLARES_SUGERIDOS.map((a) => <option key={a} value={a} />)}
          </datalist>
          {erros.anoEscolar && (
            <span id={`${formId}-err-ano`} className="text-xs font-semibold text-red-700">{erros.anoEscolar}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-conteudo`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
            Conteúdo <span aria-hidden="true">*</span>
          </label>
          <input
            ref={(el) => { refsCampos.current.conteudo = el; }}
            id={`${formId}-conteudo`}
            name="conteudo"
            type="text"
            value={form.conteudo}
            onChange={(e) => atualizar('conteudo', e.target.value)}
            required
            aria-invalid={erros.conteudo ? 'true' : 'false'}
            aria-describedby={erros.conteudo ? `${formId}-err-conteudo` : undefined}
            placeholder="Ex.: Citologia, Vanguardas"
            className="min-h-12 rounded-xl border border-[#E2D9F7] bg-white px-3 py-2 text-base text-[#25104A] focus-visible:outline-2 focus-visible:outline-[#6315D9]"
          />
          {erros.conteudo && (
            <span id={`${formId}-err-conteudo`} className="text-xs font-semibold text-red-700">{erros.conteudo}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-dificuldade`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
            Dificuldade (para a série)
          </label>
          <select
            id={`${formId}-dificuldade`}
            name="dificuldade"
            value={form.dificuldade}
            onChange={(e) => atualizar('dificuldade', e.target.value)}
            className="min-h-12 rounded-xl border border-[#E2D9F7] bg-white px-3 py-2 text-base text-[#25104A] focus-visible:outline-2 focus-visible:outline-[#6315D9]"
          >
            {DIFICULDADES.map((d) => (
              <option key={d.id} value={d.id}>{d.rotulo}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
          Tipo de questão e jogos compatíveis
        </legend>
        <div className="flex flex-wrap gap-3">
          {Object.values(TIPOS_QUESTAO).map((t) => (
            <label
              key={t.id}
              className={`flex items-center gap-2 rounded-xl border-2 px-3.5 py-2.5 text-xs font-extrabold cursor-pointer transition ${
                form.tipo === t.id
                  ? 'border-[#6315D9] bg-[#F3EDFF] text-[#25104A]'
                  : 'border-[#E2D9F7] bg-white text-[#5B4B86]'
              }`}
            >
              <input
                type="radio"
                name={`${formId}-tipo`}
                value={t.id}
                checked={form.tipo === t.id}
                onChange={() => atualizar('tipo', t.id)}
                className="accent-[#6315D9]"
              />
              <span>{t.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-enunciado`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
          Enunciado <span aria-hidden="true">*</span>
        </label>
        <span id={`${formId}-enunciado-dica`} className="text-xs text-[#5B4B86]">
          Você pode usar fórmulas simples entre cifrões, por exemplo: $H_2O$ ou $x^2 + 2x = 0$.
        </span>
        <textarea
          ref={(el) => { refsCampos.current.enunciado = el; }}
          id={`${formId}-enunciado`}
          name="enunciado"
          rows={3}
          value={form.enunciado}
          onChange={(e) => atualizar('enunciado', e.target.value)}
          required
          aria-invalid={erros.enunciado ? 'true' : 'false'}
          aria-describedby={erros.enunciado ? `${formId}-enunciado-dica ${formId}-err-enunciado` : `${formId}-enunciado-dica`}
          className="rounded-xl border border-[#E2D9F7] bg-white p-3 text-base text-[#25104A] focus-visible:outline-2 focus-visible:outline-[#6315D9]"
        />
        {erros.enunciado && (
          <span id={`${formId}-err-enunciado`} className="text-xs font-semibold text-red-700">{erros.enunciado}</span>
        )}
      </div>

      {/* Imagem opcional com origem válida + alt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-[#F3EDFF]/70 border border-[#E2D9F7] p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-img-url`} className="text-xs font-bold text-[#4A3B7C]">
            URL de imagem (opcional)
          </label>
          <input
            ref={(el) => { refsCampos.current.imagemUrl = el; }}
            id={`${formId}-img-url`}
            name="imagemUrl"
            type="url"
            value={form.imagemUrl}
            onChange={(e) => atualizar('imagemUrl', e.target.value)}
            aria-invalid={erros.imagemUrl ? 'true' : 'false'}
            aria-describedby={erros.imagemUrl ? `${formId}-err-img-url` : undefined}
            placeholder="https://... (opcional; questões textuais são válidas)"
            className="min-h-11 rounded-xl border border-[#E2D9F7] bg-white px-3 py-2 text-sm text-[#25104A]"
          />
          {erros.imagemUrl && (
            <span id={`${formId}-err-img-url`} className="text-xs font-semibold text-red-700">{erros.imagemUrl}</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-img-alt`} className="text-xs font-bold text-[#4A3B7C]">
            Descrição alternativa da imagem (alt)
          </label>
          <input
            ref={(el) => { refsCampos.current.imagemAlt = el; }}
            id={`${formId}-img-alt`}
            name="imagemAlt"
            type="text"
            value={form.imagemAlt}
            onChange={(e) => atualizar('imagemAlt', e.target.value)}
            aria-invalid={erros.imagemAlt ? 'true' : 'false'}
            aria-describedby={erros.imagemAlt ? `${formId}-err-img-alt` : undefined}
            placeholder="Descreva a imagem para leitores de tela"
            className="min-h-11 rounded-xl border border-[#E2D9F7] bg-white px-3 py-2 text-sm text-[#25104A]"
          />
          {erros.imagemAlt && (
            <span id={`${formId}-err-img-alt`} className="text-xs font-semibold text-red-700">{erros.imagemAlt}</span>
          )}
        </div>
      </div>

      {/* Campos específicos por tipo */}
      {form.tipo === 'multipla_escolha' && (
        <fieldset className="space-y-3 rounded-xl border border-[#E2D9F7] bg-white p-4">
          <legend className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C] px-1">
            Alternativas e gabarito (Quiz e Equipes)
          </legend>
          {form.alternativas.map((alt, idx) => (
            <div key={alt.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-extrabold text-[#25104A] min-w-24">
                <input
                  type="radio"
                  name={`${formId}-gabarito`}
                  checked={form.respostaAlternativa === alt.id}
                  onChange={() => atualizar('respostaAlternativa', alt.id)}
                  className="accent-[#6315D9]"
                />
                <span>Correta ({LETRAS[idx] || idx + 1})</span>
              </label>
              <input
                type="text"
                aria-label={`Alternativa ${LETRAS[idx] || idx + 1}`}
                value={alt.texto}
                onChange={(e) => {
                  const texto = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    alternativas: prev.alternativas.map((a) => (a.id === alt.id ? { ...a, texto } : a)),
                  }));
                }}
                placeholder={`Texto da alternativa ${LETRAS[idx] || idx + 1}`}
                className="flex-1 min-h-11 rounded-xl border border-[#E2D9F7] px-3 py-2 text-sm text-[#25104A]"
              />
              {form.alternativas.length > 2 && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      alternativas: prev.alternativas.filter((a) => a.id !== alt.id),
                    }))
                  }
                  className="min-h-11 rounded-xl border border-[#E2D9F7] px-2.5 text-xs font-bold text-[#5B4B86] hover:bg-[#F3EDFF]"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
          {form.alternativas.length < 5 && (
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  alternativas: [...prev.alternativas, { id: `alt-${Date.now()}`, texto: '' }],
                }))
              }
              className="rounded-xl border border-dashed border-[#6315D9] px-3 py-2 text-xs font-bold text-[#6315D9] hover:bg-[#F3EDFF]"
            >
              + Adicionar alternativa
            </button>
          )}
          {erros.alternativas && <p className="text-xs font-semibold text-red-700">{erros.alternativas}</p>}
        </fieldset>
      )}

      {form.tipo === 'pares' && (
        <fieldset className="space-y-3 rounded-xl border border-[#E2D9F7] bg-white p-4">
          <legend className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C] px-1">
            Pares correspondentes (Memória e Associação)
          </legend>
          {form.pares.map((par, idx) => (
            <div key={par.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <input
                type="text"
                aria-label={`Par ${idx + 1} — conceito (esquerda)`}
                value={par.esquerda}
                onChange={(e) => {
                  const esquerda = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    pares: prev.pares.map((p) => (p.id === par.id ? { ...p, esquerda } : p)),
                  }));
                }}
                placeholder={`Conceito ${idx + 1}`}
                className="min-h-11 rounded-xl border border-[#E2D9F7] px-3 py-2 text-sm text-[#25104A]"
              />
              <input
                type="text"
                aria-label={`Par ${idx + 1} — correspondência (direita)`}
                value={par.direita}
                onChange={(e) => {
                  const direita = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    pares: prev.pares.map((p) => (p.id === par.id ? { ...p, direita } : p)),
                  }));
                }}
                placeholder={`Definição ou par ${idx + 1}`}
                className="min-h-11 rounded-xl border border-[#E2D9F7] px-3 py-2 text-sm text-[#25104A]"
              />
              {form.pares.length > 2 && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, pares: prev.pares.filter((p) => p.id !== par.id) }))
                  }
                  className="min-h-11 rounded-xl border border-[#E2D9F7] px-2.5 text-xs font-bold text-[#5B4B86] hover:bg-[#F3EDFF]"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
          {form.pares.length < 8 && (
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  pares: [...prev.pares, criarParVazio()],
                }))
              }
              className="rounded-xl border border-dashed border-[#6315D9] px-3 py-2 text-xs font-bold text-[#6315D9] hover:bg-[#F3EDFF]"
            >
              + Adicionar par
            </button>
          )}
          {erros.pares && <p className="text-xs font-semibold text-red-700">{erros.pares}</p>}
        </fieldset>
      )}

      {form.tipo === 'ordenacao' && (
        <fieldset className="space-y-3 rounded-xl border border-[#E2D9F7] bg-white p-4">
          <legend className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C] px-1">
            Itens na sequência correta (1º até o último)
          </legend>
          {form.itens.map((item, idx) => (
            <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E7DBFD] text-xs font-black text-[#25104A]">
                {idx + 1}º
              </span>
              <input
                type="text"
                aria-label={`Item ${idx + 1} da sequência`}
                value={item.texto}
                onChange={(e) => {
                  const texto = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    itens: prev.itens.map((it) => (it.id === item.id ? { ...it, texto } : it)),
                  }));
                }}
                placeholder={`Etapa ou evento ${idx + 1}`}
                className="flex-1 min-h-11 rounded-xl border border-[#E2D9F7] px-3 py-2 text-sm text-[#25104A]"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moverItemOrdenacao(idx, -1)}
                  aria-label={`Mover item ${idx + 1} para cima`}
                  className="min-h-10 min-w-10 rounded-lg border border-[#E2D9F7] px-2 text-xs font-bold disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === form.itens.length - 1}
                  onClick={() => moverItemOrdenacao(idx, 1)}
                  aria-label={`Mover item ${idx + 1} para baixo`}
                  className="min-h-10 min-w-10 rounded-lg border border-[#E2D9F7] px-2 text-xs font-bold disabled:opacity-40"
                >
                  ↓
                </button>
                {form.itens.length > 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, itens: prev.itens.filter((it) => it.id !== item.id) }))
                    }
                    className="min-h-10 rounded-lg border border-[#E2D9F7] px-2 text-xs font-bold text-[#5B4B86]"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}
          {form.itens.length < 8 && (
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  itens: [...prev.itens, { id: `item-${Date.now()}`, texto: '' }],
                }))
              }
              className="rounded-xl border border-dashed border-[#6315D9] px-3 py-2 text-xs font-bold text-[#6315D9] hover:bg-[#F3EDFF]"
            >
              + Adicionar etapa
            </button>
          )}
          {erros.itens && <p className="text-xs font-semibold text-red-700">{erros.itens}</p>}
        </fieldset>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-explicacao`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
            Explicação pedagógica <span aria-hidden="true">*</span>
          </label>
          <textarea
            ref={(el) => { refsCampos.current.explicacao = el; }}
            id={`${formId}-explicacao`}
            name="explicacao"
            rows={3}
            value={form.explicacao}
            onChange={(e) => atualizar('explicacao', e.target.value)}
            required
            aria-invalid={erros.explicacao ? 'true' : 'false'}
            aria-describedby={erros.explicacao ? `${formId}-err-explicacao` : undefined}
            placeholder="Comentário revelado aos alunos após o encerramento da rodada"
            className="rounded-xl border border-[#E2D9F7] bg-white p-3 text-sm text-[#25104A]"
          />
          {erros.explicacao && (
            <span id={`${formId}-err-explicacao`} className="text-xs font-semibold text-red-700">{erros.explicacao}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-justificativa`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
            Justificativa da dificuldade <span aria-hidden="true">*</span>
          </label>
          <textarea
            ref={(el) => { refsCampos.current.justificativaDificuldade = el; }}
            id={`${formId}-justificativa`}
            name="justificativaDificuldade"
            rows={3}
            value={form.justificativaDificuldade}
            onChange={(e) => atualizar('justificativaDificuldade', e.target.value)}
            required
            aria-invalid={erros.justificativaDificuldade ? 'true' : 'false'}
            aria-describedby={erros.justificativaDificuldade ? `${formId}-err-justificativa` : undefined}
            placeholder="Por que este item é fácil, médio ou difícil para esta série/ano?"
            className="rounded-xl border border-[#E2D9F7] bg-white p-3 text-sm text-[#25104A]"
          />
          {erros.justificativaDificuldade && (
            <span id={`${formId}-err-justificativa`} className="text-xs font-semibold text-red-700">
              {erros.justificativaDificuldade}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-[#E2D9F7]">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="min-h-11 rounded-xl border border-[#E2D9F7] bg-white px-4 py-2 text-sm font-bold text-[#5B4B86] hover:bg-[#F3EDFF]"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={salvando}
          className="min-h-11 rounded-xl bg-[#6315D9] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#5411B8] disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar questão'}
        </button>
      </div>
    </form>
  );
}
