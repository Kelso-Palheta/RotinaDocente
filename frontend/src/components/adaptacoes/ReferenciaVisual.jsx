"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  lerDataUrl,
  inspecionarImagemLocal,
} from "@/aplicacao/adaptacoes/arquivoVisual";
export function ReferenciaVisual({ onSelecionar, disabled = false }) {
  const [pdf, setPdf] = useState(null),
    [pagina, setPagina] = useState(1),
    [erro, setErro] = useState(""),
    [lendo, setLendo] = useState(false);
  const documento = useRef(null),
    operacao = useRef(0);
  useEffect(
    () => () => {
      operacao.current++;
      documento.current?.destroy();
    },
    [],
  );
  async function ler(file) {
    if (!file) return;
    const token = ++operacao.current;
    setLendo(true);
    setErro("");
    try {
      if (
        file.type === "application/pdf" ||
        file.name?.toLowerCase().endsWith(".pdf")
      ) {
        if (file.size > 15 * 1024 * 1024)
          throw new Error("PDF: limite de 15 MB.");
        const { getPdfjsLib } = await import("@/utils/atividades/pdfExtractor");
        const lib = await getPdfjsLib();
        const novo = await lib.getDocument({ data: await file.arrayBuffer() })
          .promise;
        if (token !== operacao.current) {
          await novo.destroy();
          return;
        }
        await documento.current?.destroy();
        documento.current = novo;
        setPdf({ nome: file.name, paginas: novo.numPages });
        setPagina(1);
      } else {
        const imagemUrl = await lerDataUrl(file),
          metadados = await inspecionarImagemLocal(imagemUrl);
        if (token === operacao.current)
          onSelecionar({ imagemUrl, metadados, nome: file.name });
      }
    } catch (e) {
      if (token === operacao.current) setErro(e.message);
    } finally {
      if (token === operacao.current) setLendo(false);
    }
  }
  async function usarPagina() {
    setLendo(true);
    setErro("");
    const token = ++operacao.current;
    let canvas;
    try {
      const p = await documento.current.getPage(Number(pagina));
      const original = p.getViewport({ scale: 1 });
      const viewport = p.getViewport({
        scale: Math.min(3, 2400 / Math.max(original.width, original.height)),
      });
      canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await p.render({ canvasContext: canvas.getContext("2d"), viewport })
        .promise;
      const imagemUrl = canvas.toDataURL("image/png");
      const metadados = await inspecionarImagemLocal(imagemUrl);
      if (token === operacao.current)
        onSelecionar({
          imagemUrl,
          metadados,
          nome: `${pdf.nome} — página ${pagina}`,
          pagina: Number(pagina),
        });
    } catch (e) {
      setErro(e.message);
    } finally {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      setLendo(false);
    }
  }
  return (
    <div className="space-y-2 text-xs">
      <label className="block font-bold">
        Enviar imagem ou PDF de referência
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          disabled={disabled || lendo}
          onChange={(e) => {
            ler(e.target.files?.[0]);
            e.target.value = "";
          }}
          className="block w-full mt-1 border rounded-lg p-2"
        />
      </label>
      {pdf && (
        <div className="flex flex-wrap gap-2 items-center">
          <label>
            Página (1 a {pdf.paginas}){" "}
            <input
              aria-label="Página de referência"
              type="number"
              min="1"
              max={pdf.paginas}
              value={pagina}
              onChange={(e) =>
                setPagina(
                  Math.max(
                    1,
                    Math.min(pdf.paginas, Number(e.target.value) || 1),
                  ),
                )
              }
              className="border p-1 w-20"
            />
          </label>
          <button
            type="button"
            disabled={lendo || disabled}
            onClick={usarPagina}
            className="border rounded-lg p-2"
          >
            Usar esta página como referência
          </button>
        </div>
      )}
      <p>
        JPG/PNG/WebP até 7 MB; PDF até 15 MB. A página é preservada inteira.
        Confira a figura e sua associação à questão.
      </p>
      {lendo && <p role="status">Preparando referência…</p>}
      {erro && (
        <p role="alert" className="text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}
