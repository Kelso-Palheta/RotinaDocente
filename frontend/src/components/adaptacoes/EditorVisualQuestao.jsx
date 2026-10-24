"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  aprovarImagem,
  gerarDesenhoExato,
  imagemAprovada,
  medirDpi,
  substituirImagem,
  assinaturaVisual,
} from "@/dominio/adaptacoes/qualidadeVisual";
import { obterPixelsReferencia } from "@/aplicacao/adaptacoes/arquivoVisual";
import { ReferenciaVisual } from "./ReferenciaVisual";
import { restaurarVersaoVisual } from "@/dominio/adaptacoes/documentoVisual";
export function EditorVisualQuestao({
  questao: q,
  onChange,
  professorId,
  temChave,
  getAIHeaders,
  disciplina,
  anoEscolar,
  necessidades = [],
  registroLote,
  bloqueado = false,
}) {
  const [modo, setModo] = useState("criar"),
    [ocupado, setOcupado] = useState(false),
    [erro, setErro] = useState(""),
    [conferido, setConferido] = useState(false),
    [dados, setDados] = useState(""),
    [falhou, setFalhou] = useState(false);
  const questaoAtual = useRef(q);
  useEffect(() => {
    questaoAtual.current = q;
  }, [q]);
  const controle = useRef(null),
    vivo = useRef(true);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
      controle.current?.abort();
    };
  }, []);
  const plano = {
    tipo: "ilustracao",
    descricao: q.apoioVisualDescricao || q.enunciado,
    larguraCm: 10,
    quantidade: 3,
    total: 4,
    partes: 3,
    forma: "retangulo",
    largura: 4,
    altura: 2,
    ...q.planoVisual,
  };
  const exato = ["contagem", "fracao", "grafico", "geometria"].includes(
    plano.tipo,
  );
  const atualizar = (novo) => {
    setConferido(false);
    setFalhou(false);
    onChange(novo);
  };
  const mudarPlano = (campo, valor) =>
    atualizar({ ...q, planoVisual: { ...plano, [campo]: valor } });
  async function produzir() {
    if (ocupado) return false;
    const assinaturaInicio = assinaturaVisual(q);
    setErro("");
    setOcupado(true);
    setConferido(false);
    controle.current = new AbortController();
    try {
      let imagemUrl, metadados, origem, modelo;
      let planoFinal = plano;
      if (modo === "manter") {
        if (!q.visual?.original)
          throw new Error("Envie a imagem original primeiro.");
        ({ imagemUrl, metadados } = q.visual.original);
        origem = "original";
      } else if (exato) {
        planoFinal = {
          ...plano,
          ...(plano.tipo === "grafico"
            ? {
                dados: dados
                  ? dados
                      .split("\n")
                      .filter((l) => l.trim())
                      .map((l) => {
                        const [rotulo, valor] = l.split(";");
                        if (valor === undefined || !valor.trim())
                          throw new Error("Informe nome;valor em cada linha.");
                        return { rotulo, valor: Number(valor) };
                      })
                  : plano.dados || [],
              }
            : {}),
        };
        const desenho = gerarDesenhoExato(planoFinal);
        ({ imagemUrl, metadados, origem } = desenho);
      } else {
        if (!temChave)
          throw new Error("Conecte sua chave de IA para produzir a imagem.");
        const referenciaOriginal =
          modo === "adaptar"
            ? await obterPixelsReferencia(
                q.visual?.original?.imagemUrl,
                controle.current.signal,
              )
            : undefined;
        if (modo === "adaptar" && !referenciaOriginal)
          throw new Error("Envie o original para adaptar.");
        const res = await fetch("/api/adaptacoes/imagem", {
          method: "POST",
          signal: controle.current.signal,
          headers: { "Content-Type": "application/json", ...getAIHeaders() },
          body: JSON.stringify({
            versaoVisual: 2,
            modoVisual: modo,
            referenciaOriginal,
            planoVisual: plano,
            enunciado: q.enunciado,
            descricaoApoio: q.apoioVisualDescricao,
            disciplina,
            anoEscolar,
            necessidades,
          }),
        });
        const r = await res.json();
        if (!res.ok)
          throw new Error(r.error || "Não foi possível gerar a imagem.");
        ({ imagemUrl, metadados, modelo } = r);
        origem = modo === "adaptar" ? "adaptada" : "gerada";
      }
      if (!vivo.current || controle.current.signal.aborted) return false;
      if (assinaturaVisual(questaoAtual.current) !== assinaturaInicio) {
        setErro(
          "A questão mudou durante a geração. A resposta antiga foi descartada; produza outra imagem.",
        );
        return false;
      }
      atualizar({
        ...substituirImagem(q, imagemUrl, metadados, origem),
        planoVisual: planoFinal,
        visual: {
          ...substituirImagem(q, imagemUrl, metadados, origem).visual,
          modelo,
          planoImagem: planoFinal,
        },
      });
      return true;
    } catch (e) {
      if (vivo.current)
        setErro(
          e.name === "AbortError"
            ? "Operação cancelada. A versão anterior foi preservada."
            : e.message,
        );
      return false;
    } finally {
      if (vivo.current) setOcupado(false);
    }
  }
  const produzirRef = useRef(produzir);
  useEffect(() => {
    produzirRef.current = produzir;
  });
  useEffect(
    () => registroLote?.(q.id, () => produzirRef.current()),
    [registroLote, q.id],
  );
  async function verificar() {
    const assinaturaInicio = assinaturaVisual(q);
    setErro("");
    setOcupado(true);
    controle.current = new AbortController();
    try {
      const imagemUrl = await obterPixelsReferencia(
        q.imagemUrl,
        controle.current.signal,
      );
      const res = await fetch("/api/adaptacoes/verificar-imagem", {
        method: "POST",
        signal: controle.current.signal,
        headers: { "Content-Type": "application/json", ...getAIHeaders() },
        body: JSON.stringify({
          imagemUrl,
          enunciado: q.enunciado,
          planoVisual: plano,
          descricaoApoio: q.apoioVisualDescricao,
          referenciaOriginal: q.visual?.original
            ? await obterPixelsReferencia(
                q.visual.original.imagemUrl,
                controle.current.signal,
              )
            : undefined,
        }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error || "Falha ao conferir imagem.");
      if (vivo.current && !controle.current.signal.aborted) {
        if (assinaturaVisual(questaoAtual.current) !== assinaturaInicio)
          throw new Error(
            "A questão mudou durante a conferência. Confira a versão atual novamente.",
          );
        atualizar({ ...q, visual: { ...q.visual, verificacao: r } });
      }
    } catch (e) {
      if (vivo.current) setErro(e.message);
    } finally {
      if (vivo.current) setOcupado(false);
    }
  }
  function aprovar() {
    try {
      if (!conferido)
        throw new Error("Confira figura, dados e descrição antes de aprovar.");
      onChange(aprovarImagem(q, professorId));
      setErro("");
    } catch (e) {
      setErro(e.message);
    }
  }
  return (
    <section
      aria-label={`Imagem da questão ${q.numero || q.id}`}
      className="my-4 rounded-2xl border border-indigo-200 bg-slate-50 p-3 sm:p-4 space-y-3 print:border-0 print:bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <strong className="text-sm">Imagem da questão</strong>
        <span
          className={
            imagemAprovada(q)
              ? "text-green-800 font-bold text-xs"
              : "text-amber-800 font-bold text-xs"
          }
        >
          {imagemAprovada(q) ? "Versão aprovada" : "Pendente de revisão"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {q.visual?.original && (
          <figure className="print:hidden">
            <figcaption className="text-xs font-bold mb-1">
              Original — {q.visual.original.nome || "referência"}
            </figcaption>
            <img
              src={q.visual.original.imagemUrl}
              alt="Imagem original para comparação"
              className="max-h-72 object-contain w-full bg-white border rounded-lg"
            />
          </figure>
        )}
        {q.imagemUrl && (
          <figure>
            <figcaption className="text-xs font-bold mb-1 print:hidden">
              Resultado atual
            </figcaption>
            {falhou ? (
              <p role="alert" className="text-red-700">
                Imagem indisponível. Substitua ou restaure outra versão.
              </p>
            ) : (
              <a
                href={q.imagemUrl}
                target="_blank"
                rel="noreferrer"
                title="Abrir imagem para ampliar"
              >
                <img
                  src={q.imagemUrl}
                  alt={q.apoioVisualDescricao || "Figura pendente de descrição"}
                  onLoad={() => setFalhou(false)}
                  onError={() => setFalhou(true)}
                  className="max-h-96 object-contain w-full bg-white border rounded-lg"
                  style={{ maxWidth: `${plano.larguraCm || 10}cm` }}
                />
              </a>
            )}
            {q.apoioVisualDescricao && (
              <figcaption className="text-sm mt-2">
                {q.apoioVisualDescricao}
              </figcaption>
            )}
          </figure>
        )}
      </div>
      <details className="space-y-3 print:hidden" open>
        <summary className="cursor-pointer text-xs font-bold">
          Configurar e revisar imagem
        </summary>
        <fieldset
          disabled={ocupado || bloqueado}
          className="space-y-3 disabled:opacity-60"
        >
          <ReferenciaVisual
            disabled={ocupado}
            onSelecionar={(original) =>
              atualizar({ ...q, visual: { ...q.visual, original, versao: 2 } })
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold">
              Ação
              <select
                value={modo}
                onChange={(e) => setModo(e.target.value)}
                className="block border rounded-lg p-2 w-full"
              >
                <option value="criar">Criar nova imagem</option>
                <option value="adaptar">Adaptar o original</option>
                <option value="manter">Manter original</option>
              </select>
            </label>
            <label className="text-xs font-bold">
              Tipo de figura
              <select
                value={plano.tipo}
                onChange={(e) => mudarPlano("tipo", e.target.value)}
                className="block border rounded-lg p-2 w-full"
              >
                <option value="ilustracao">Ilustração por IA</option>
                <option value="contagem">Contagem exata (círculos)</option>
                <option value="fracao">Fração com partes iguais</option>
                <option value="grafico">Gráfico por dados</option>
                <option value="geometria">Geometria por medidas</option>
              </select>
            </label>
          </div>
          <label className="block text-xs font-bold">
            Plano da imagem: o que deve aparecer
            <textarea
              value={plano.descricao || ""}
              onChange={(e) => mudarPlano("descricao", e.target.value)}
              className="block w-full border rounded-lg p-2 mt-1"
            />
          </label>
          <label className="block text-xs font-bold">
            Elementos e dados que não podem mudar
            <input
              value={plano.elementosObrigatorios || ""}
              onChange={(e) =>
                mudarPlano("elementosObrigatorios", e.target.value)
              }
              className="block w-full border rounded-lg p-2 mt-1"
            />
          </label>
          <label className="block text-xs font-bold">
            Ajustes e restrições visuais
            <input
              value={plano.restricoes || ""}
              onChange={(e) => mudarPlano("restricoes", e.target.value)}
              className="block w-full border rounded-lg p-2 mt-1"
            />
          </label>
          {plano.tipo === "contagem" && (
            <label className="block text-xs">
              Quantidade exata (1–30)
              <input
                type="number"
                min="1"
                max="30"
                value={plano.quantidade || 3}
                onChange={(e) =>
                  mudarPlano("quantidade", Number(e.target.value))
                }
                className="border rounded p-2 ml-2"
              />
            </label>
          )}
          {plano.tipo === "fracao" && (
            <div className="flex gap-2 text-xs">
              <label>
                Partes preenchidas
                <input
                  type="number"
                  min="0"
                  value={plano.partes ?? 3}
                  onChange={(e) => mudarPlano("partes", Number(e.target.value))}
                  className="border rounded p-2 w-20 block"
                />
              </label>
              <label>
                Total de partes
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={plano.total || 4}
                  onChange={(e) => mudarPlano("total", Number(e.target.value))}
                  className="border rounded p-2 w-20 block"
                />
              </label>
            </div>
          )}
          {plano.tipo === "grafico" && (
            <label className="block text-xs">
              Dados do gráfico: uma linha por categoria, no formato nome;valor
              <textarea
                placeholder={"Categoria A;2\nCategoria B;5"}
                value={
                  dados ||
                  (plano.dados || [])
                    .map((d) => `${d.rotulo};${d.valor}`)
                    .join("\n")
                }
                onChange={(e) => {
                  setDados(e.target.value);
                  mudarPlano("dadosTexto", e.target.value);
                }}
                className="block w-full border rounded p-2"
              />
            </label>
          )}
          {plano.tipo === "geometria" && (
            <div className="flex flex-wrap gap-2 text-xs">
              <label>
                Forma
                <select
                  value={plano.forma || "retangulo"}
                  onChange={(e) =>
                    atualizar({
                      ...q,
                      planoVisual: {
                        ...plano,
                        forma: e.target.value,
                        ...(e.target.value === "circulo"
                          ? { altura: plano.largura }
                          : {}),
                      },
                    })
                  }
                  className="block border p-2"
                >
                  <option value="retangulo">Retângulo</option>
                  <option value="triangulo">Triângulo retângulo</option>
                  <option value="circulo">Círculo</option>
                </select>
              </label>
              {(plano.forma === "circulo"
                ? ["largura"]
                : ["largura", "altura"]
              ).map((c) => (
                <label key={c}>
                  {plano.forma === "circulo" ? "Diâmetro" : c}
                  <input
                    type="number"
                    min="0.1"
                    value={plano[c] || 2}
                    onChange={(e) =>
                      plano.forma === "circulo"
                        ? atualizar({
                            ...q,
                            planoVisual: {
                              ...plano,
                              largura: Number(e.target.value),
                              altura: Number(e.target.value),
                            },
                          })
                        : mudarPlano(c, Number(e.target.value))
                    }
                    className="block border rounded p-2 w-24"
                  />
                </label>
              ))}
            </div>
          )}
          <label className="block text-xs font-bold">
            Descrição acessível da imagem final
            <textarea
              value={q.apoioVisualDescricao || ""}
              onChange={(e) =>
                atualizar({ ...q, apoioVisualDescricao: e.target.value })
              }
              className="block w-full border rounded-lg p-2 mt-1"
            />
          </label>
          <p className="text-xs text-slate-600">
            Descreva o que a figura realmente mostra. Confira se a descrição
            permite avaliar a mesma habilidade sem antecipar a resposta.
          </p>
          <label className="block text-xs">
            Largura na impressão (cm)
            <input
              type="number"
              min="1"
              max="18"
              step="0.5"
              value={plano.larguraCm || 10}
              onChange={(e) => mudarPlano("larguraCm", Number(e.target.value))}
              className="border rounded p-2 w-20 ml-2"
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={q.visual?.obrigatoria ?? true}
              onChange={(e) =>
                atualizar({
                  ...q,
                  visual: { ...q.visual, obrigatoria: e.target.checked },
                })
              }
            />
            Figura necessária para responder à questão
          </label>
          <button
            type="button"
            onClick={produzir}
            className="px-3 py-2 rounded-lg bg-indigo-700 text-white text-xs font-bold"
          >
            Produzir imagem
          </button>
        </fieldset>
        {ocupado && (
          <div className="flex gap-3 items-center text-xs" role="status">
            Processando imagem…
            <button
              type="button"
              className="underline"
              onClick={() => controle.current?.abort()}
            >
              Cancelar processamento
            </button>
          </div>
        )}
        {q.visual?.metadados && (
          <p className="text-xs">
            {q.visual.metadados.width} × {q.visual.metadados.height} px ·{" "}
            {q.visual.metadados.mime === "image/svg+xml"
              ? "Desenho vetorial"
              : `${Math.round(medirDpi(q.visual.metadados.width, plano.larguraCm))} DPI no tamanho escolhido`}
          </p>
        )}
        {q.imagemUrl && (
          <div className="space-y-2 border-t pt-3">
            <button
              type="button"
              disabled={ocupado || !temChave || exato}
              onClick={verificar}
              className="text-xs underline font-bold"
            >
              Conferir coerência com IA
            </button>
            {q.visual?.verificacao && (
              <div className="text-xs bg-white border rounded p-2">
                <p>Conferência auxiliar: {q.visual.verificacao.parecer}</p>
                <p>{q.visual.verificacao.descricaoObservada}</p>
                {(q.visual.verificacao.problemas || []).map((p, i) => (
                  <p key={i} className="text-red-700">
                    • {typeof p === "string" ? p : JSON.stringify(p)}
                  </p>
                ))}
                {q.visual.verificacao.problemas?.length > 0 && (
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      const justificativa = window.prompt(
                        "Descreva como conferiu e resolveu os apontamentos.",
                      );
                      if (justificativa?.trim().length >= 15)
                        atualizar({
                          ...q,
                          visual: {
                            ...q.visual,
                            verificacao: {
                              ...q.visual.verificacao,
                              problemas: [],
                              revisaoManual: justificativa.trim(),
                            },
                          },
                        });
                    }}
                  >
                    Registrar revisão manual dos apontamentos
                  </button>
                )}
              </div>
            )}
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={conferido}
                onChange={(e) => setConferido(e.target.checked)}
                disabled={ocupado || falhou}
              />
              Conferi a figura, os dados e a descrição.
            </label>
            <button
              type="button"
              onClick={aprovar}
              disabled={ocupado || falhou || !conferido}
              className="px-3 py-2 rounded-lg bg-green-800 text-white text-xs font-bold"
            >
              Aprovar esta versão
            </button>
          </div>
        )}
        {q.visual?.historico?.length > 0 && (
          <details className="text-xs">
            <summary>Versões anteriores ({q.visual.historico.length})</summary>
            <div className="flex gap-2 flex-wrap p-2">
              {q.visual.historico.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={ocupado}
                  className="border rounded p-2"
                  onClick={() => atualizar(restaurarVersaoVisual(q, item))}
                >
                  Restaurar versão {i + 1}
                </button>
              ))}
            </div>
          </details>
        )}
        {erro && (
          <p role="alert" className="text-xs text-red-700">
            {erro}
          </p>
        )}
      </details>
    </section>
  );
}
