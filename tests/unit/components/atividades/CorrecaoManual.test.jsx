import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {CorrecaoManualForm} from '@/components/atividades/CorrecaoManualForm';
import {EntregaDrawer} from '@/components/atividades/EntregaDrawer';
import {FeedbackView} from '@/app/aluno/atividade/[id]/FeedbackView';
const atividade={id:'at',notaMaxima:2,questoes:[{id:'q1',tipo:'objetiva',enunciado:'Marque.',notaMaxima:1},{id:'q2',tipo:'discursiva',enunciado:'Explique.',notaMaxima:1}]};
afterEach(cleanup);
it('oferece duas modalidades explícitas de correção',()=>{
 render(<EntregaDrawer entrega={{status:'entregue'}} atividade={atividade} alunoNome="Ana" onCorrigir={()=>{}} onManual={()=>{}} onClose={()=>{}} />);
 expect(screen.getByRole('button',{name:'Corrigir com IA'})).toBeVisible();
 expect(screen.getByRole('button',{name:'Corrigir manualmente'})).toBeVisible();
});
it('editor salva nota e feedback por questão sem exigir IA',async()=>{
 const onSave=vi.fn(async()=>{});
 render(<CorrecaoManualForm atividade={atividade} entrega={{respostas:{q1:{resposta:'A'},q2:{resposta:'Resposta original'}}}} onSave={onSave} onCancel={()=>{}} />);
 fireEvent.change(screen.getByLabelText('Nota da questão 1'),{target:{value:'0'}});
 fireEvent.change(screen.getByLabelText('Feedback da questão 1'),{target:{value:'Alternativa incorreta.'}});
 fireEvent.change(screen.getByLabelText('Nota da questão 2'),{target:{value:'0,5'}});
 fireEvent.change(screen.getByLabelText('Feedback da questão 2'),{target:{value:'Faltou exemplo.'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar correção manual'}));
 await waitFor(()=>expect(onSave).toHaveBeenCalled());
 expect(onSave.mock.calls[0][0].resultados.q2).toMatchObject({nota:'0,5',feedback:'Faltou exemplo.'});
});
it('erro de gravação mantém formulário e feedback digitado',async()=>{
 render(<CorrecaoManualForm atividade={{notaMaxima:2}} entrega={{}} onSave={async()=>{throw new Error('Falha ao salvar');}} onCancel={()=>{}} />);
 fireEvent.change(screen.getByLabelText('Nota da atividade'),{target:{value:'0'}});
 fireEvent.change(screen.getByLabelText('Feedback geral da atividade'),{target:{value:'Reveja o tema.'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar correção manual'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar');
 expect(screen.getByLabelText('Feedback geral da atividade')).toHaveValue('Reveja o tema.');
});
it('aluno lê feedback manual geral e de questão objetiva e discursiva',()=>{
 render(<FeedbackView atividade={atividade} entrega={{status:'revisado',tipoCorrecao:'manual',notaRevisada:0.5,feedbackGeral:'Continue praticando.',resultados:{q1:{notaObtida:0,notaMaxima:1,correto:false,feedback:'Justificativa do professor.'},q2:{notaObtida:0.5,notaMaxima:1,feedback:'Aprofunde o exemplo.'}}}} />);
 expect(screen.getByText('Continue praticando.')).toBeInTheDocument();
 expect(screen.getByText('Justificativa do professor.')).toBeInTheDocument();
 expect(screen.getByText('Aprofunde o exemplo.')).toBeInTheDocument();
 expect(screen.getByText('Corrigido manualmente pelo professor')).toBeInTheDocument();
});
