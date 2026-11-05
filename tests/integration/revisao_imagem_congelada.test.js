import {describe,it,expect} from 'vitest';
import {cenario,salaPronta,acao,questaoSintetica} from '../helpers/revisaoCenario';
describe('imagem vinculada à versão congelada da sala',()=>{
 it('autoriza somente imagem da rodada exibida e recusa fonte alterada',async()=>{
  const c=await cenario();
  const original=c.opcoes.acervo.lerQuestaoAcervo;
  c.opcoes.acervo.lerQuestaoAcervo=async id=>{const r=await original(id);r.questao.imagens=[{id:'figura',alt:'Figura sintética',arquivo:'imagens/sintetica.png'}];return r;};
  const codigo=await salaPronta(c);const qid=questaoSintetica(1).id;
  await expect(c.service.validarImagemSala(c.docente,codigo,qid,'figura')).rejects.toMatchObject({status:404});
  await acao(c,codigo,'mostrar_conteudo');await acao(c,codigo,'abrir_pergunta');
  await expect(c.service.validarImagemSala(c.docente,codigo,qid,'figura')).resolves.toBeUndefined();
  await expect(c.service.validarImagemSala(c.docente,codigo,questaoSintetica(2).id,'figura')).rejects.toMatchObject({status:404});
  c.opcoes.acervo.hashRevisaoAcervo=async()=> 'b'.repeat(64);
  await expect(c.service.validarImagemSala(c.docente,codigo,qid,'figura')).rejects.toMatchObject({status:409});
 });
});
