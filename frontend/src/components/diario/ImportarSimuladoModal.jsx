"use client";

import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { extrairNotasSimulado } from '@/utils/diario/importarSimuladoIA';
import { notaMaximaSimulado, prepararImportacaoSimulado } from '@/dominio/diario/importacaoSimulado';
import { fmt } from '@/utils/diario/calculos';

const SITUACOES = {
  pronto: 'Pronto para importar',
  nota_existente: 'Nota existente — preservada',
  nao_encontrado: 'Aluno não encontrado',
  ambiguo: 'Nome repetido na turma — associação ambígua',
  duplicado: 'Aluno repetido no documento',
  nota_invalida: 'Nota ausente ou inválida',
  fora_da_escala: 'Nota fora da escala do simulado',
};

export function ImportarSimuladoModal({ turma, bimestre, onConfirm, onClose }) {
  const [arquivos, setArquivos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [lendo, setLendo] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [erro, setErro] = useState('');
  const operacao = useRef(0);
  const arquivoInput = useRef(null);
  useEffect(() => () => { operacao.current += 1; }, []);

  const linhas = prepararImportacaoSimulado(registros, turma, bimestre);
  const prontas = linhas.filter(linha => linha.situacao === 'pronto');
  const max = notaMaximaSimulado(turma, bimestre);

  const lerArquivos = async () => {
    const atual = ++operacao.current;
    setLendo(true);
    setErro('');
    setRegistros([]);
    try {
      const resultado = await extrairNotasSimulado(arquivos, { bimestre });
      if (operacao.current === atual) setRegistros(resultado);
    } catch (error) {
      if (operacao.current === atual) setErro(error.message || 'Não foi possível ler o documento.');
    } finally {
      if (operacao.current === atual) setLendo(false);
    }
  };

  const revisar = (index, campo, valor) => setRegistros(prev => prev.map((linha, i) => i === index ? { ...linha, [campo]: valor } : linha));

  const aplicar = async () => {
    if (!prontas.length || aplicando) return;
    setAplicando(true);
    setErro('');
    try {
      await onConfirm(registros.filter((_, i) => linhas[i].situacao === 'pronto'));
      onClose();
    } catch (error) {
      setErro(error.message || 'Não foi possível aplicar as notas.');
      setAplicando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <section role="dialog" aria-modal="true" aria-labelledby="importar-simulado-titulo" className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl border border-[#dce0f0] shadow-xl">
        <header className="p-5 border-b border-[#dce0f0]">
          <h2 id="importar-simulado-titulo" className="text-lg font-bold text-[#101942]">Importar notas do Simulado</h2>
          <p className="text-sm text-[#6070a0] mt-1">Turma {turma.nome} · {bimestre}º bimestre · Escala: 0 a {fmt(max)}</p>
          <p className="text-xs text-[#6070a0] mt-2">Somente campos vazios serão preenchidos. Notas existentes, atividades e outros bimestres serão preservados.</p>
        </header>
        <div className="p-5 overflow-auto space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#101942] mb-2">Arquivos com notas do simulado</p>
              <input ref={arquivoInput} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" disabled={lendo || aplicando}
                aria-label="Arquivos com notas do simulado" className="hidden"
                onChange={event => { setArquivos(Array.from(event.target.files || [])); setRegistros([]); setErro(''); }} />
              <button type="button" className="btn-brand-navy inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                disabled={lendo || aplicando} onClick={() => arquivoInput.current?.click()}>
                <Upload size={16} aria-hidden="true" />
                Selecionar arquivo
              </button>
              <div aria-live="polite" className="mt-2 text-xs text-[#6070a0]">
                {arquivos.length ? (
                  <ul aria-label="Arquivos selecionados" className="space-y-1">{arquivos.map((arquivo, i) => <li key={i} className="break-all">{arquivo.name}</li>)}</ul>
                ) : 'Nenhum arquivo selecionado.'}
              </div>
            </div>
            <button type="button" className="btn-brand-primary px-4 py-2 text-sm" disabled={!arquivos.length || lendo || aplicando} onClick={lerArquivos}>
              {lendo ? 'Lendo documentos…' : 'Ler arquivos'}
            </button>
          </div>
          <p className="text-xs text-[#6070a0]">PDF até 15MB; imagem até 7MB. Até 10 páginas escaneadas por PDF. A leitura usa sua chave de IA conectada.</p>
          {erro && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{erro}</p>}
          {!!registros.length && (
            <>
              <p className="text-sm font-semibold text-[#101942]">Confira os nomes e as notas. {prontas.length} de {linhas.length} registro(s) pronto(s) para importar.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead><tr className="text-[#6070a0] border-b border-[#dce0f0]"><th className="p-2">Nome no documento</th><th className="p-2">Aluno na turma</th><th className="p-2">Nota</th><th className="p-2">Situação</th></tr></thead>
                  <tbody>{linhas.map((linha, i) => (
                    <tr key={i} className="border-b border-[#dce0f0]">
                      <td className="p-2"><input aria-label={`Nome extraído ${i + 1}`} value={registros[i].nome} disabled={aplicando} onChange={event => revisar(i, 'nome', event.target.value)} className="w-full min-w-40 p-1 border border-[#dce0f0] rounded text-[#101942]" /></td>
                      <td className="p-2 text-[#101942]">{linha.alunoNome || '—'}</td>
                      <td className="p-2"><input aria-label={`Nota extraída ${i + 1}`} inputMode="decimal" value={['string', 'number'].includes(typeof registros[i].nota) ? registros[i].nota : ''} disabled={aplicando} onChange={event => revisar(i, 'nota', event.target.value)} className="w-20 p-1 border border-[#dce0f0] rounded font-mono text-[#101942]" /></td>
                      <td className={`p-2 text-xs ${linha.situacao === 'pronto' ? 'text-green-700' : 'text-red-700'}`}>{SITUACOES[linha.situacao]}{linha.situacao === 'nota_existente' && ` (${fmt(linha.notaAtual)})`}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <p className="text-xs text-[#6070a0]">Nomes incompletos, repetidos ou não encontrados não serão associados automaticamente. Revise apenas o que puder confirmar no documento.</p>
            </>
          )}
        </div>
        <footer className="p-4 border-t border-[#dce0f0] flex justify-end gap-3">
          <button type="button" className="btn-brand-ghost px-4 py-2 text-sm" disabled={aplicando} onClick={onClose}>Cancelar</button>
          {!!registros.length && <button type="button" className="btn-brand-primary px-4 py-2 text-sm" disabled={!prontas.length || lendo || aplicando} onClick={aplicar}>{aplicando ? 'Aplicando…' : `Aplicar ${prontas.length} nota${prontas.length === 1 ? '' : 's'} ao Simulado`}</button>}
        </footer>
      </section>
    </div>
  );
}
