import { act, renderHook } from '@testing-library/react';
import { useNotas } from '@/hooks/diario/useNotas';
it('importação de simulado aplica lote único sem usar o lançamento unitário',()=>{
 let state=[{id:'t',alunos:[{id:'a',nome:'ANA'}],bimestres:{'3':{config:{simuladoMaxLanca:10},notas:{a:{atv:2}}}}}];
 const setTurmas=vi.fn(update=>{state=update(state);});
 const {result}=renderHook(()=>useNotas(setTurmas));
 act(()=>result.current.importarSimulado('t',3,[{nome:'ANA',nota:8}]));
 expect(setTurmas).toHaveBeenCalledTimes(1);
 expect(state[0].bimestres['3'].notas.a).toEqual({atv:2,simulado:8});
});
