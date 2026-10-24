'use client';
import { dataLocalISO } from '@/utils/diario/datas';
import { conferirFechamento, assinaturaPublicacao, resumirAssinatura } from '@/dominio/diario/evolucao';

export function VisaoGeralTurma({ turma, bimestre, onAbrir }) {
  const resumo = conferirFechamento(turma, bimestre);
  const publicacao = [turma.publicacoes?.[bimestre], turma.publicacoes?.ano].filter(Boolean).sort((a, b) => String(b.em).localeCompare(String(a.em)))[0];
  const assinatura = publicacao ? assinaturaPublicacao(turma, publicacao.periodo) : '';
  const atualizada = publicacao && [assinatura, resumirAssinatura(assinatura)].includes(publicacao.assinatura) && publicacao.estado === 'completa';
  const hoje = dataLocalISO();
  return <section aria-label="Visão geral e conferência da turma" className="bg-slate-50 border rounded-2xl p-4 mb-4 text-[#101942]">
    <div className="flex justify-between gap-2 flex-wrap"><h2 className="font-bold text-sm">Conferência · {bimestre}º bimestre</h2><span className="text-xs text-slate-600">{publicacao ? `Última publicação: ${new Date(publicacao.em).toLocaleString('pt-BR')}` : 'Notas ainda não publicadas'}</span></div>
    <div className="grid sm:grid-cols-3 gap-3 mt-3 text-xs">
      <div><p>{resumo.semSimulado} sem nota de simulado · {resumo.semAtividades} com atividades incompletas</p>{resumo.acimaTeto && <p className="text-amber-800">Atividades excedem o teto configurado.</p>}{resumo.faltasEscala > 0 && <p className="text-red-700">{resumo.faltasEscala} notas fora da escala.</p>}{resumo.criteriosDivergentes && <p>Critérios variam entre bimestres: confira antes de fechar.</p>}<button type="button" onClick={() => onAbrir('bimestre')} className="font-bold underline mt-1">Conferir notas e critérios</button></div>
      <div><p>{turma.frequencias?.[hoje] ? 'Chamada de hoje registrada.' : 'Chamada de hoje ainda não registrada. Confira se há aula prevista.'}</p><button type="button" onClick={() => onAbrir('frequencia')} className="font-bold underline mt-1">Conferir frequência</button></div>
      <div><p>{resumo.semAcesso} alunos sem dados completos de acesso.</p><p className={atualizada ? 'text-green-700' : 'text-blue-700'}>{atualizada ? 'Portal atualizado nesta publicação.' : 'Confira e publique para atualizar o Portal.'}</p><button type="button" onClick={() => onAbrir('publicar')} className="font-bold underline mt-1">Conferir publicação</button></div>
    </div>
  </section>;
}
