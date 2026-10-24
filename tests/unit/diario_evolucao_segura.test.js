import { describe, expect, it } from 'vitest';
import { registrarAlteracao, desfazerAlteracao, copiarTurmaParaAno, filtrarTurmasAno, conferirFechamento } from '@/dominio/diario/evolucao';
const turma=()=>({id:'t',nome:'301',alunos:[{id:'a',nome:'Ana'}],bimestres:{1:{atividades:[],notas:{a:{simulado:0}}}}});
describe('RN68: histórico e organização',()=>{
 it('histórico registra valores/autor/origem e desfaz sem perder outra edição',()=>{
  const antes=[turma()];const depois=structuredClone(antes);depois[0].bimestres[1].notas.a.simulado=4;
  const registro=registrarAlteracao(antes,depois,{autor:'p',origem:'manual'});
  expect(registro).toMatchObject({autor:'p',origem:'manual'});expect(registro.alteracoes).toHaveLength(1);
  const atual=structuredClone(depois);atual.push({...turma(),id:'outra'});
  expect(desfazerAlteracao(atual,registro)).toEqual([...antes,atual[1]]);
  atual[0].bimestres[1].notas.a.simulado=5;
  expect(()=>desfazerAlteracao(atual,registro)).toThrow(/mudou|posterior/i);
 });
 it('cópia/promocão não leva notas/frequência nem reutiliza IDs',()=>{
  const origem={...turma(),anoLetivo:2026,frequencias:{dia:{}},ocorrencias:[{}],recuperacao:{a:{rec1:5}}};
  const nova=copiarTurmaParaAno(origem,{anoLetivo:2027,nome:'401'});
  expect(nova.id).not.toBe(origem.id);expect(nova.alunos[0].id).not.toBe('a');
  expect(nova.anoLetivo).toBe(2027);expect(nova.bimestres[1].notas).toEqual({});
  expect(nova.frequencias).toEqual({});expect(nova.ocorrencias).toEqual([]);expect(nova.recuperacao).toEqual({});
  expect(origem.bimestres[1].notas.a.simulado).toBe(0);
 });
 it('ano legado é explícito e arquivo não mistura turmas',()=>{
  const turmas=[turma(),{...turma(),id:'nova',anoLetivo:2026},{...turma(),id:'arquivo',anoLetivo:2026,arquivada:true}];
  expect(filtrarTurmasAno(turmas,'legado').map(t=>t.id)).toEqual(['t']);
  expect(filtrarTurmasAno(turmas,2026).map(t=>t.id)).toEqual(['nova']);
  expect(filtrarTurmasAno(turmas,2026,true).map(t=>t.id)).toEqual(['arquivo']);
 });
 it('fechamento aponta ausência, zero válido, teto e acesso sem alterar notas',()=>{
  const t=turma();t.alunos.push({id:'b',nome:'Bruna'});t.bimestres[1].atividades=[{id:'x',nome:'Arte',max:6}];
  const resumo=conferirFechamento(t,1);
  expect(resumo.semSimulado).toBe(1);expect(resumo.semAcesso).toBe(2);expect(resumo.acimaTeto).toBe(true);
 });
});
it('ano numérico legado já informado continua identificado sem mover notas',()=>{
 const antigas=[{...turma(),ano:2025}];
 expect(filtrarTurmasAno(antigas,2025)).toHaveLength(1);
 expect(filtrarTurmasAno(antigas,'legado')).toHaveLength(0);
 expect(antigas[0]).not.toHaveProperty('anoLetivo');
});
it('assinatura persistida da publicação tem tamanho fixo, sem duplicar todas as notas',async()=>{
 const { resumirAssinatura } = await import('@/dominio/diario/evolucao');
 const a=resumirAssinatura('notas'.repeat(10000));
 expect(a.length).toBeLessThan(30);expect(a).toBe(resumirAssinatura('notas'.repeat(10000)));
 expect(a).not.toBe(resumirAssinatura('outras notas'.repeat(10000)));
});
