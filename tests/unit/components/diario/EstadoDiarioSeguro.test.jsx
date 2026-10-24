import { act, renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useTurmas } from '@/hooks/diario/useTurmas';
import { usePersistenciaDiario } from '@/hooks/diario/usePersistenciaDiario';
const turma={id:'t',nome:'301',alunos:[],bimestres:{}};
it('callback de frequência aguarda confirmação real e propaga falha sem perder rascunho',async()=>{
 let rejeitar;
 const persistir=vi.fn(()=>new Promise((_,reject)=>{rejeitar=reject;}));
 const {result}=renderHook(()=>useTurmas([turma],persistir));
 let promise;
 act(()=>{promise=result.current.salvarFrequenciasTurma('t',{'2026-10-23':{quantidadeAulas:4}});});
 expect(promise).toBeInstanceOf(Promise);
 expect(result.current.turmas[0].frequencias['2026-10-23'].quantidadeAulas).toBe(4);
 rejeitar(new Error('Falha na nuvem'));
 await expect(promise).rejects.toThrow('Falha na nuvem');
});
it('edições rápidas usam estado atual sem perder o primeiro aluno',()=>{
 const {result}=renderHook(()=>useTurmas([turma],vi.fn()));
 act(()=>{result.current.addAlunoManual('t',{nome:'Ana'});result.current.addAlunoManual('t',{nome:'Bruna'});});
 expect(result.current.turmas[0].alunos).toHaveLength(2);
});
it('troca de conta carrega somente a conta correta e não limpa vínculos',async()=>{
 const criarRepository=vi.fn(uid=>({carregar:async()=>({turmas:[{...turma,id:uid}],revision:0,_existe:false}),salvar:vi.fn()}));
 const {result,rerender}=renderHook(({uid})=>usePersistenciaDiario(uid,{criarRepository}),{initialProps:{uid:'a'}});
 await waitFor(()=>expect(result.current.turmas[0]?.id).toBe('a'));
 rerender({uid:'b'});
 await waitFor(()=>expect(result.current.turmas[0]?.id).toBe('b'));
 expect(criarRepository.mock.calls.map(([id])=>id)).toEqual(['a','b']);
});
