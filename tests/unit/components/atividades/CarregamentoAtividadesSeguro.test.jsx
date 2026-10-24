import {renderHook,act,cleanup} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
const m=vi.hoisted(()=>({listar:vi.fn()}));
vi.mock('@/lib/firebase-atividades',()=>({listAtividades:m.listar,listAllAtividades:vi.fn(),createAtividade:vi.fn(),updateAtividade:vi.fn(),deleteAtividade:vi.fn(),syncAlunoLogin:vi.fn(),syncNotasAluno:vi.fn(),syncSingleNotasAluno:vi.fn(),countEntregasPendentes:vi.fn(),countEntregasPorAtividade:vi.fn(),sincronizarTodasAsNotas:vi.fn()}));
import {useAtividades} from '@/hooks/atividades/useAtividades';
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('resposta atrasada não substitui a turma selecionada mais recentemente',async()=>{
 let resolver;m.listar.mockImplementationOnce(()=>new Promise(r=>{resolver=r;})).mockResolvedValueOnce([{id:'at-nova'}]);
 const {result}=renderHook(()=>useAtividades('p'));let antiga;
 await act(async()=>{antiga=result.current.loadAtividades('antiga');await result.current.loadAtividades('nova');});
 await act(async()=>{resolver([{id:'at-antiga'}]);await antiga;});expect(result.current.atividades).toEqual([{id:'at-nova'}]);
});
it('erro de carregamento não mantém lista anterior e fica disponível para interface',async()=>{
 m.listar.mockResolvedValueOnce([{id:'at'}]).mockRejectedValueOnce(new Error('Sem conexão'));
 const {result}=renderHook(()=>useAtividades('p'));await act(async()=>{await result.current.loadAtividades('t');await result.current.loadAtividades('outra');});
 expect(result.current.atividades).toEqual([]);expect(result.current.erro).toMatch(/Sem conexão/);
});
