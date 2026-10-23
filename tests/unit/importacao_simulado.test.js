import { describe, expect, it } from 'vitest';
import { prepararImportacaoSimulado, aplicarImportacaoSimulado } from '@/dominio/diario/importacaoSimulado';
const turma = () => ({ id: 't1', alunos: [{ id:'a',nome:'ANA LÚCIA' },{ id:'b',nome:'BRUNO SOUZA' },{ id:'c',nome:'CARLA LIMA' }], bimestres: {
 '1': {atividades:[],notas:{a:{simulado:2}}},
 '3': {config:{simuladoMaxLanca:10},atividades:[{id:'atv',max:2}],notas:{a:{atv:1},b:{simulado:0,atv:2},c:{simulado:7}}}
} });
describe('RN-63: Importação segura de simulado',()=>{
 it('associa nome completo normalizado e aceita vírgula decimal e zero',()=>{
  const result=prepararImportacaoSimulado([{nome:'  Ana Lucia  ',nota:'7,5'},{nome:'BRUNO SOUZA',nota:4}],turma(),'3');
  expect(result[0]).toMatchObject({alunoId:'a',nota:7.5,situacao:'pronto'});
  expect(result[1].situacao).toBe('nota_existente');
  expect(prepararImportacaoSimulado([{nome:'ANA LUCIA',nota:0}],turma(),3)[0].situacao).toBe('pronto');
 });
 it('não associa nomes aproximados, desconhecidos ou homônimos automaticamente',()=>{
  const t=turma();t.alunos.push({id:'x',nome:'Ana Lucia'});
  const result=prepararImportacaoSimulado([{nome:'ANA LUCIA',nota:5},{nome:'Ana',nota:5},{nome:'Desconhecido',nota:5}],t,3);
  expect(result.map(r=>r.situacao)).toEqual(['ambiguo','nao_encontrado','nao_encontrado']);
 });
 it('bloqueia todas as linhas duplicadas do mesmo aluno, inclusive entre arquivos',()=>{
  const result=prepararImportacaoSimulado([{nome:'ANA LUCIA',nota:5},{nome:'Ana Lúcia',nota:6}],turma(),3);
  expect(result.map(r=>r.situacao)).toEqual(['duplicado','duplicado']);
 });
 it.each([null,undefined,'',true,'-', '7/10', 'NaN', Infinity])('recusa nota inválida %s',nota=>{
  expect(prepararImportacaoSimulado([{nome:'ANA LUCIA',nota}],turma(),3)[0].situacao).toBe('nota_invalida');
 });
 it.each([-1,10.01])('recusa nota fora da escala %s',nota=>{
  expect(prepararImportacaoSimulado([{nome:'ANA LUCIA',nota}],turma(),3)[0].situacao).toBe('fora_da_escala');
 });
 it('usa escala padrão 5 quando não configurada, sem converter ou limitar nota',()=>{
  const t=turma();t.bimestres['3'].config={};
  expect(prepararImportacaoSimulado([{nome:'ANA LUCIA',nota:7}],t,3)[0].situacao).toBe('fora_da_escala');
 });
 it('preenche somente simulado vazio do bimestre e turma escolhidos',()=>{
  const t=turma();const outra={...turma(),id:'t2'};const prev=[t,outra];
  const next=aplicarImportacaoSimulado(prev,'t1',3,[{nome:'ANA LUCIA',nota:8},{nome:'BRUNO SOUZA',nota:9},{nome:'CARLA LIMA',nota:10}]);
  expect(next[0].bimestres['3'].notas).toEqual({a:{atv:1,simulado:8},b:{simulado:0,atv:2},c:{simulado:7}});
  expect(next[0].bimestres['1']).toBe(t.bimestres['1']);
  expect(next[0].bimestres['3'].atividades).toBe(t.bimestres['3'].atividades);
  expect(next[1]).toBe(outra);expect(prev[0].bimestres['3'].notas.a).toEqual({atv:1});
 });
 it('revalida nota lançada após a prévia e preserva estado sem mudanças válidas',()=>{
  const t=turma();const registros=[{nome:'ANA LUCIA',nota:8}];
  expect(prepararImportacaoSimulado(registros,t,3)[0].situacao).toBe('pronto');
  t.bimestres['3'].notas.a.simulado=6;
  const prev=[t];expect(aplicarImportacaoSimulado(prev,'t1',3,registros)).toBe(prev);
  expect(aplicarImportacaoSimulado(prev,'t1',4,registros)).toBe(prev);
 });
});
