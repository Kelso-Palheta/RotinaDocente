import {expect,it} from 'vitest';
import {AtividadeAdaptadaRepository} from '../../frontend/src/infraestrutura/adaptacoes/AtividadeAdaptadaRepository';
it('reaproveitar troca identidade interna e invalida revisão do perfil anterior',async()=>{
 const repo=new AtividadeAdaptadaRepository();const itens=[];repo._lerLocal=()=>itens;repo._gravarLocal=(_,v)=>{itens.splice(0,itens.length,...v);};
 await repo.salvarAtividade('p',{id:'a',aluno:{id:'aluno-a',nome:'Aluno A',necessidades:['tea']},atividadeAdaptada:{questoes:[{id:'q',enunciado:'Observe',visual:{aprovacao:{professorId:'p',assinatura:'antiga'}}}]}});
 const c=await repo.reaproveitarParaAluno('p','a',{id:'aluno-b',nome:'Aluno B',necessidades:['baixa_visao']});
 expect(c.aluno.nome).toBe('Aluno B');expect(c.aluno.id).toBe('aluno-b');expect(c.aluno.necessidades).toEqual(['baixa_visao']);expect(c.atividadeAdaptada.questoes[0].visual.aprovacao).toBeNull();
});
