import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ImportarSimuladoModal } from '@/components/diario/ImportarSimuladoModal';
import { extrairNotasSimulado } from '@/utils/diario/importarSimuladoIA';
vi.mock('@/utils/diario/importarSimuladoIA',()=>({extrairNotasSimulado:vi.fn()}));
const turma={id:'t1',nome:'202',alunos:[{id:'a',nome:'ANA LUCIA'},{id:'b',nome:'BRUNO SOUZA'}],bimestres:{'3':{config:{simuladoMaxLanca:10},notas:{b:{simulado:0}}}}};
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('mostra prévia antes de aplicar e envia somente correspondências válidas com simulado vazio',async()=>{
 vi.mocked(extrairNotasSimulado).mockResolvedValue([{nome:'Ana Lucia',nota:'7,5'},{nome:'Bruno Souza',nota:8},{nome:'Desconhecido',nota:9}]);
 const onConfirm=vi.fn();
 render(<ImportarSimuladoModal turma={turma} bimestre={3} onConfirm={onConfirm} onClose={()=>{}} />);
 expect(screen.getByText(/3º bimestre/)).toBeInTheDocument();
 const files=[new File(['imagem'],'notas.png',{type:'image/png'})];
 fireEvent.change(screen.getByLabelText('Arquivos com notas do simulado'),{target:{files}});
 fireEvent.click(screen.getByRole('button',{name:'Ler arquivos'}));
 const apply=await screen.findByRole('button',{name:/Aplicar 1 nota/});
 expect(onConfirm).not.toHaveBeenCalled();
 expect(screen.getByText(/Nota existente/)).toBeInTheDocument();
 expect(screen.getByText('Aluno não encontrado')).toBeInTheDocument();
 fireEvent.click(apply);
 expect(onConfirm).toHaveBeenCalledWith([{nome:'Ana Lucia',nota:'7,5'}]);
});
it('permite revisar nome e nota antes de confirmar',async()=>{
 vi.mocked(extrairNotasSimulado).mockResolvedValue([{nome:'Ana',nota:99}]);
 render(<ImportarSimuladoModal turma={turma} bimestre={3} onConfirm={vi.fn()} onClose={()=>{}} />);
 fireEvent.change(screen.getByLabelText('Arquivos com notas do simulado'),{target:{files:[new File(['x'],'n.pdf',{type:'application/pdf'})]}});
 fireEvent.click(screen.getByRole('button',{name:'Ler arquivos'}));
 const name=await screen.findByLabelText('Nome extraído 1');
 expect(screen.getByRole('button',{name:/Aplicar/})).toBeDisabled();
 fireEvent.change(name,{target:{value:'ANA LUCIA'}});
 fireEvent.change(screen.getByLabelText('Nota extraída 1'),{target:{value:'8,5'}});
 expect(screen.getByRole('button',{name:/Aplicar 1 nota/})).toBeEnabled();
});
it('cancelar não altera notas',()=>{
 const onConfirm=vi.fn(),onClose=vi.fn();
 render(<ImportarSimuladoModal turma={turma} bimestre={3} onConfirm={onConfirm} onClose={onClose} />);
 fireEvent.click(screen.getByRole('button',{name:'Cancelar'}));
 expect(onClose).toHaveBeenCalled();expect(onConfirm).not.toHaveBeenCalled();
});
