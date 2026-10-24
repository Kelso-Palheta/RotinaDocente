import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { PublicarNotasModal } from '@/components/diario/PublicarNotasModal';
import { VisaoGeralTurma } from '@/components/diario/VisaoGeralTurma';
import { ContextoAnoDiario } from '@/components/diario/ContextoAnoDiario';
const turma={id:'t',nome:'301',anoLetivo:2026,alunos:[{id:'a',nome:'Ana',dataNascimento:'1503'},{id:'b',nome:'Bruna'}],bimestres:{1:{atividades:[],notas:{a:{simulado:0}}}}};
it('prévia identifica período/aptos e repetição envia somente falhas',async()=>{
 const publicar=vi.fn().mockResolvedValueOnce({resultados:[{turmaId:'t',alunoId:'a',nome:'Ana',status:'error',error:'Rede'},{turmaId:'t',alunoId:'b',nome:'Bruna',status:'semData'}]}).mockResolvedValue({resultados:[{turmaId:'t',alunoId:'a',nome:'Ana',status:'ok'}]});
 render(<PublicarNotasModal turmas={[turma]} turmaInicialId="t" bimestre={1} onPublicar={publicar} onClose={()=>{}}/>);
 expect(screen.getByText(/1 apto/)).toBeInTheDocument();
 expect(publicar).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Confirmar publicação'}));
 await screen.findByText('Rede');
 fireEvent.click(screen.getByRole('button',{name:'Tentar somente as falhas'}));
 await waitFor(()=>expect(publicar).toHaveBeenCalledTimes(2));
 expect(publicar.mock.calls[1][0].alvos).toEqual([{turmaId:'t',alunoId:'a'}]);
 expect(publicar.mock.calls[1][0].periodo).toBe('1');
});
it('visão geral aponta pendências e abre área correspondente',()=>{
 const abrir=vi.fn();render(<VisaoGeralTurma turma={turma} bimestre={1} onAbrir={abrir}/>);
 fireEvent.click(screen.getByRole('button',{name:/Conferir notas/}));expect(abrir).toHaveBeenCalledWith('bimestre');
 expect(screen.getByText(/1 sem nota de simulado/)).toBeInTheDocument();
});
it('ano e arquivo são controles explícitos, cópia mostra destino antes de aplicar',()=>{
 const copiar=vi.fn();render(<ContextoAnoDiario turmas={[turma]} turmaAtual={turma} ano={2026} onAno={()=>{}} arquivadas={false} onArquivadas={()=>{}} onArquivar={()=>{}} onCopiar={copiar} onAtribuirAno={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Copiar alunos para outro ano'}));
 fireEvent.change(screen.getByLabelText('Ano de destino'),{target:{value:'2027'}});
 fireEvent.change(screen.getByLabelText('Nome da nova turma'),{target:{value:'401'}});
 expect(copiar).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Confirmar cópia sem notas'}));
 expect(copiar).toHaveBeenCalledWith({anoLetivo:2027,nome:'401'});
});
it('situação do Portal considera a publicação mais recente do ano ou bimestre',()=>{
 const t={...turma,publicacoes:{1:{periodo:'1',em:'2026-10-01',assinatura:'antiga',estado:'parcial'},ano:{periodo:'ano',em:'2026-10-23',estado:'completa'}}};
 // A assinatura depende apenas de notas/cadastro/recuperação, não do controle de publicação.
 const { alunos,bimestres }=t;t.publicacoes.ano.assinatura=JSON.stringify({alunos:alunos.map(({id,nome,dataNascimento})=>({id,nome,dataNascimento})),bimestres,recuperacao:{}});
 render(<VisaoGeralTurma turma={t} bimestre={1} onAbrir={()=>{}}/>);
 expect(screen.getByText('Portal atualizado nesta publicação.')).toBeInTheDocument();
});
