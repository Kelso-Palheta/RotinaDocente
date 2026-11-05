import {it,expect} from 'vitest';
import {cenario,questaoSintetica} from '../helpers/revisaoCenario';
import {RevisaoService} from '../../frontend/src/aplicacao/revisao/RevisaoService';
it('conferência mostra apenas questões vinculadas para o professor verificar cobertura',async()=>{
 const c=await cenario(),id=questaoSintetica(1).id;
 const service=new RevisaoService({...c.opcoes,acervoTematico:{lerConteudoTematico:async()=>({conteudo:{id:'a',imagens:[]},hashFonte:'hash'}),listarCatalogoTematico:async()=>({questoes:[{questaoId:id,conteudoIds:['a']}]})}});
 const r=await service.conteudo(c.docente,'a');expect(r.conteudo.questoesVinculadas).toEqual([{id,tema:questaoSintetica(1).tema,ano:2024}]);expect(JSON.stringify(r.conteudo.questoesVinculadas)).not.toContain('gabarito');
});
