import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {DetalhesAulaModal} from '@/components/calendario/DetalhesAulaModal';
import {DecisaoStatusModal} from '@/components/calendario/DecisaoStatusModal';
afterEach(cleanup);
const aula={id:'a1',dataAgendada:'2026-10-23',horarioInicio:'07:00',horarioFim:'07:50',status:'AGENDADA',topicoId:'t1',topicoTitulo:'História da arte'};
it('escolher status só edita local e parcial exige justificativa e restante antes de salvar',async()=>{
 const salvar=vi.fn(async()=>{});const fechar=vi.fn();
 render(<DetalhesAulaModal isOpen aula={aula} onClose={fechar} onUpdateStatus={salvar}/>);
 fireEvent.click(screen.getByRole('button',{name:/^Parcial/}));
 expect(salvar).not.toHaveBeenCalled();expect(fechar).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Salvar registro da aula'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('justificativa');
 fireEvent.change(screen.getByLabelText('Justificativa'),{target:{value:'Discussão levou mais tempo'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar registro da aula'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('restante');
 fireEvent.change(screen.getByLabelText('Conteúdo restante'),{target:{value:'Analisar imagens'}});
 fireEvent.click(screen.getByLabelText('Devolver aos pendentes e manter próximas datas'));
 fireEvent.click(screen.getByRole('button',{name:'Salvar registro da aula'}));
 await waitFor(()=>expect(salvar).toHaveBeenCalledWith('a1','PARCIAL',aula,{decisao:'pular',execucao:{justificativa:'Discussão levou mais tempo',restante:'Analisar imagens'}}));
 await waitFor(()=>expect(fechar).toHaveBeenCalledTimes(1));
});
it('gravação rejeitada mantém registro e feedback de erro visível',async()=>{
 const fechar=vi.fn();const salvar=vi.fn(async()=>{throw new Error('Falha ao salvar aula');});
 render(<DetalhesAulaModal isOpen aula={aula} onClose={fechar} onUpdateStatus={salvar}/>);
 expect(screen.getByText('História da arte')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/^Não realizada/}));
 fireEvent.change(screen.getByLabelText('Justificativa'),{target:{value:'Sem transporte'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar registro da aula'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar aula');
 expect(screen.getByLabelText('Justificativa')).toHaveValue('Sem transporte');expect(fechar).not.toHaveBeenCalled();
});
it('associar e remover aguardam callback e não fecham em erro',async()=>{
 const fechar=vi.fn();const adicionar=vi.fn(async()=>{throw new Error('Falha ao associar');});
 const remover=vi.fn(async()=>{throw new Error('Falha ao remover');});
 render(<DetalhesAulaModal isOpen aula={aula} onClose={fechar} onAddTopico={adicionar} onRemoveTopico={remover} topicosDisponiveis={[{id:'t2',titulo:'Modernismo',ordem:2}]}/>);
 fireEvent.click(screen.getByRole('button',{name:'Desassociar História da arte'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao remover');
 fireEvent.change(screen.getByLabelText('Vincular conteúdo disponível'),{target:{value:'t2'}});
 expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao associar');expect(fechar).not.toHaveBeenCalled();
});
it('decisão antiga aguarda persistência e retém modal no erro',async()=>{
 const fechar=vi.fn();let reject;
 const confirmar=vi.fn(()=>new Promise((_,rej)=>{reject=rej;}));
 render(<DecisaoStatusModal isOpen aula={aula} novoStatus="NAO_REALIZADA" onClose={fechar} onConfirmar={confirmar}/>);
 fireEvent.click(screen.getByRole('button',{name:/Reagendar/}));expect(fechar).not.toHaveBeenCalled();
 reject(new Error('Falha de rede'));
 expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede');expect(fechar).not.toHaveBeenCalled();
});
