import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {AtividadesList} from '@/components/atividades/AtividadesList';
import {TodasAtividades} from '@/components/atividades/TodasAtividades';
vi.mock('@/components/atividades/AtividadeForm',()=>({AtividadeForm:()=>null}));
vi.mock('@/components/atividades/AtividadePainel',()=>({AtividadePainel:({currentTurmaId})=><div>Painel turma: {currentTurmaId}</div>}));
vi.mock('@/lib/firebase-atividades',()=>({getAtividade:vi.fn()}));
const atividades=[
 {id:'a1',titulo:'Atividade alvo',bimestre:'1',turmaIds:['t1'],dataEntrega:'2030-01-01'},
 {id:'a2',titulo:'Outra turma',bimestre:1,turmaIds:['t2'],dataEntrega:'2030-01-01'},
 {id:'a3',titulo:'Outro bimestre',bimestre:2,turmaIds:['t1'],dataEntrega:'2030-01-01'}
];
const turmas=[{id:'t1',nome:'101'},{id:'t2',nome:'202'}];
const hook=()=>({atividades,todasAtividades:atividades,loading:false,loadAtividades:vi.fn(),loadAllAtividades:vi.fn(),loadEntregasCounts:vi.fn(),entregasCounts:{},sincronizarTodasAsNotas:vi.fn().mockRejectedValue(new Error('Sem navegação no teste'))});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('visão de turma filtra turma e bimestre e sincroniza somente o recorte',async()=>{
 vi.spyOn(window,'confirm').mockReturnValue(true);vi.spyOn(window,'alert').mockImplementation(()=>{});
 const h=hook();
 render(<AtividadesList turma={turmas[0]} bimestre={1} turmas={turmas} useAtividadesHook={h} />);
 expect(screen.getByText('Atividade alvo')).toBeInTheDocument();
 expect(screen.queryByText('Outra turma')).toBeNull();expect(screen.queryByText('Outro bimestre')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:/Sincronizar/}));
 await waitFor(()=>expect(h.sincronizarTodasAsNotas).toHaveBeenCalledWith({turmaId:'t1',bimestre:1}));
});
it('banco completo conserva botão global e restringe sincronização quando filtros são usados',async()=>{
 vi.spyOn(window,'confirm').mockReturnValue(true);vi.spyOn(window,'alert').mockImplementation(()=>{});
 const h=hook();render(<TodasAtividades turmas={turmas} useAtividadesHook={h} />);
 fireEvent.click(screen.getByRole('button',{name:'Sincronizar todas as notas'}));
 await waitFor(()=>expect(h.sincronizarTodasAsNotas).toHaveBeenCalledWith());
 fireEvent.change(screen.getAllByRole('combobox')[0],{target:{value:'t1'}});
 fireEvent.change(screen.getAllByRole('combobox')[1],{target:{value:'1'}});
 expect(screen.getByText('Atividade alvo')).toBeInTheDocument();
 expect(screen.queryByText('Outra turma')).toBeNull();expect(screen.queryByText('Outro bimestre')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Sincronizar notas filtradas'}));
 await waitFor(()=>expect(h.sincronizarTodasAsNotas).toHaveBeenLastCalledWith({turmaId:'t1',bimestre:'1'}));
 fireEvent.click(screen.getByText('Atividade alvo'));
 expect(screen.getByText('Painel turma: t1')).toBeInTheDocument();
});
it.each([['t2',1,'Outra turma'],['t1',2,'Outro bimestre']])('troca de escopo para %s/%s não mantém painel anterior aberto',(turmaId,bimestre,titulo)=>{
 const h=hook();const props={turma:turmas[0],bimestre:1,turmas,useAtividadesHook:h};
 const {rerender}=render(<AtividadesList {...props} />);
 fireEvent.click(screen.getByText('Atividade alvo'));
 expect(screen.getByText('Painel turma: t1')).toBeInTheDocument();
 rerender(<AtividadesList {...props} turma={turmas.find(t=>t.id===turmaId)} bimestre={bimestre} />);
 expect(screen.getByText(titulo)).toBeInTheDocument();
 expect(screen.queryByText(/Painel turma:/)).toBeNull();
});
