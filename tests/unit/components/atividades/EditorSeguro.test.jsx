import {render,fireEvent,screen,cleanup,waitFor} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
vi.mock('@/components/ui/RichTextEditor',()=>({RichTextEditor:()=>null}));
import AtividadeForm from '@/components/atividades/AtividadeForm';
afterEach(()=>cleanup());
const base={id:'at',titulo:'Atividade sintética',bimestre:3,turmaIds:['t'],dataEntrega:new Date('2030-11-01T15:00:00.000Z'),questoes:[{id:'q',tipo:'discursiva',enunciado:'Explique o tema.',notaMaxima:2,rubrica:'Critério',alternativas:[],imagens:[]}],materiais:[],textosBase:[]};
const turmas=[{id:'t',nome:'301',alunos:[]}];
it('aguarda confirmação de gravação antes de fechar',async()=>{
 let resolver;const salvar=vi.fn(()=>new Promise(r=>{resolver=r;})),fechar=vi.fn();
 render(<AtividadeForm turmas={turmas} initialData={base} onUpdate={salvar} onClose={fechar}/>);
 fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));expect(salvar).toHaveBeenCalledTimes(1);expect(fechar).not.toHaveBeenCalled();
 resolver();await waitFor(()=>expect(fechar).toHaveBeenCalledTimes(1));
});
it('falha mantém editor e conteúdo para tentar novamente',async()=>{
 const fechar=vi.fn(),salvar=vi.fn(async()=>{throw new Error('Sem conexão');});
 render(<AtividadeForm turmas={turmas} initialData={base} onUpdate={salvar} onClose={fechar}/>);
 fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));await screen.findByText(/Sem conexão/);expect(fechar).not.toHaveBeenCalled();expect(screen.getByDisplayValue(base.titulo)).toBeInTheDocument();
});
it('editar sem alterar prazo preserva instante no fuso local',()=>{
 const tz=process.env.TZ;process.env.TZ='America/Belem';
 try {const salvar=vi.fn();render(<AtividadeForm turmas={turmas} initialData={base} onUpdate={salvar}/>);fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));expect(salvar.mock.calls[0][1].dataEntrega.getTime()).toBe(base.dataEntrega.getTime());}
 finally {if(tz===undefined)delete process.env.TZ;else process.env.TZ=tz;}
});
it('recusa gabarito de alternativa vazia',()=>{
 const salvar=vi.fn();render(<AtividadeForm turmas={turmas} initialData={{...base,questoes:[{...base.questoes[0],tipo:'objetiva',gabarito:'A',alternativas:[{id:'A',texto:''},{id:'B',texto:'Um'},{id:'C',texto:'Dois'}]}]}} onUpdate={salvar}/>);
 fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));expect(salvar).not.toHaveBeenCalled();expect(screen.getByText(/gabarito.*alternativa preenchida/i)).toBeInTheDocument();
});
it('recusa escala negativa e prazo inválido',()=>{
 const salvar=vi.fn();render(<AtividadeForm turmas={turmas} initialData={{...base,questoes:[{...base.questoes[0],notaMaxima:-1}]}} onUpdate={salvar}/>);
 fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));expect(salvar).not.toHaveBeenCalled();
});
it('não publica material ainda em extração',()=>{
 const salvar=vi.fn();render(<AtividadeForm turmas={turmas} initialData={{...base,materiais:[{id:'m',nome:'Livro.pdf',tipo:'arquivo',_extracting:true}]}} onUpdate={salvar}/>);
 fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));expect(salvar).not.toHaveBeenCalled();
});
it('herda turma e bimestre do contexto ao criar',()=>{
 render(<AtividadeForm turmas={turmas} contextoInicial={{turmaId:'t',bimestre:3}} onCreate={vi.fn()}/>);
 expect(screen.getByRole('checkbox',{name:/301/})).toBeChecked();expect(screen.getByLabelText(/Bimestre/i)).toHaveValue('3');
});
it('preserva segundos e milissegundos ao editar outros campos sem alterar prazo',()=>{
 const data=new Date('2030-11-01T15:00:32.456Z'),salvar=vi.fn();render(<AtividadeForm turmas={turmas} initialData={{...base,dataEntrega:data}} onUpdate={salvar}/>);
 fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));expect(salvar.mock.calls[0][1].dataEntrega.getTime()).toBe(data.getTime());
});
it('recusa dia inexistente em vez de deslocar prazo para outro mês',()=>{
 const salvar=vi.fn();render(<AtividadeForm turmas={turmas} initialData={base} onUpdate={salvar}/>);fireEvent.change(screen.getByLabelText(/Data de entrega/),{target:{value:'2030-02-30T12:00'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar Alterações'}));expect(salvar).not.toHaveBeenCalled();
});
