'use client';
import { useState } from 'react';
import { fmt } from '@/utils/diario/calculos';

export function AlunosRiscoTable({
  alunos = [],
  totalAvaliados = 0,
  totalParciais = 0,
  onSelectAluno,
  titulo = 'Atenção pedagógica',
}) {
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(0);
  const filtrados = alunos.filter((a) =>
    `${a.nome} ${a.turmaNome}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')),
  );
  const paginas = Math.max(1, Math.ceil(filtrados.length / 15));
  const atual = Math.min(pagina, paginas - 1);
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <h2 className="font-bold text-lg">
        {titulo} · {alunos.length}
      </h2>
      <p className="text-sm text-slate-600">
        Sugestões para revisão do professor. Nenhuma avaliação ou penalidade é criada automaticamente.
      </p>
      {!totalAvaliados ? (
        <p>Nenhum aluno avaliado neste período. Não é possível concluir ausência de risco.</p>
      ) : !alunos.length ? (
        <p>
          Nenhum alerta entre os {totalAvaliados} avaliados.
          {totalParciais > 0 ? ' Há notas parciais; confira as pendências.' : ''}
        </p>
      ) : (
        <>
          <label className="block text-sm">
            Buscar aluno ou turma
            <input
              className="block border rounded-lg p-2 w-full"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(0);
              }}
            />
          </label>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <caption className="sr-only">Estudantes que precisam de conferência</caption>
              <thead>
                <tr>
                  {['Estudante', 'Turma', 'Nota / mínimo', 'Motivo', 'Ação'].map((h) => (
                    <th key={h} scope="col" className="p-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.slice(atual * 15, atual * 15 + 15).map((a) => (
                  <tr key={`${a.turmaId}:${a.alunoId}`} className="border-t">
                    <td className="p-2">{a.nome}</td>
                    <td className="p-2">{a.turmaNome}</td>
                    <td
                      className="p-2 font-bold"
                      style={{ color: a.cor || (a.nota === null ? '#94a3b8' : '#dc2626') }}
                    >
                      {fmt(a.nota)} / {fmt(a.minimo)}{' '}
                    </td>
                    <td className="p-2">
                      {a.situacao || 'Abaixo do mínimo'}
                      {a.parcial ? ' · parcial' : ''}
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="underline"
                        aria-label={`Abrir Diário de ${a.nome}`}
                        onClick={() => onSelectAluno?.(a)}
                      >
                        Abrir Diário
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtrados.length && <p>Nenhum resultado para esta busca.</p>}
          <div className="flex gap-3 items-center">
            <button disabled={atual === 0} onClick={() => setPagina(atual - 1)}>
              Anterior
            </button>
            <span>
              Página {atual + 1} de {paginas}
            </span>
            <button disabled={atual + 1 >= paginas} onClick={() => setPagina(atual + 1)}>
              Próxima
            </button>
          </div>
        </>
      )}
    </section>
  );
}
