import {describe,it,expect} from 'vitest';
import {sugerirChamada,ocorrenciasDoAluno,montarLinhaTempoAluno} from '@/dominio/diario/acompanhamento';
import {consolidarFichaAluno360} from '@/dominio/diario/fichaAluno';
const aluno={id:'a',nome:'Ana'};
const ocorrencias=[{id:'1',alunoIds:['a'],visivelFamilia:true,titulo:'Individual',descricao:'Permitida'},{id:'2',alunoIds:[],visivelFamilia:true,titulo:'Turma',descricao:'Todos'},{id:'3',alunoIds:['b'],visivelFamilia:true,titulo:'Outro aluno'},{id:'4',alunoIds:['a'],visivelFamilia:false,titulo:'Interna'}];
describe('Acompanhamento do Diário',()=>{
 it('preserva registro existente inteiro, sem aceitar sugestão por cima',()=>{
  const registro={quantidadeAulas:4,presencas:{a:'F'}};
  expect(sugerirChamada({turma:{frequencias:{'2026-10-23':registro}},data:'2026-10-23',calendario:{aulas:[{dataAgendada:'2026-10-23',quantidadeAulas:2}]}})).toMatchObject({...registro,origem:'registro'});
 });
 it('filtra turma/data, soma tempos e avisa feriado ou cancelamento',()=>{
  const turma={id:'t',nome:'101'};
  const calendario={feriados:[{data:'2026-10-23',nome:'Feriado'}],aulas:[{turmaId:'t',dataAgendada:'2026-10-23',quantidadeAulas:2,status:'PENDENTE'},{turmaId:'x',dataAgendada:'2026-10-23',quantidadeAulas:9}]};
  expect(sugerirChamada({turma,data:'2026-10-23',calendario})).toMatchObject({quantidadeAulas:2,origem:'calendario',exigeJustificativa:true,presencas:{}});
 });
 it('usa horário real da turma sem amostra e não marca presentes implicitamente',()=>{
  expect(sugerirChamada({turma:{id:'t',nome:'101'},data:'2026-10-23',horario:{schedule:{sex_1:{grade:'101',subject:'Arte'},sex_2:{grade:'101',subject:'Arte'},sex_3:{grade:'102',subject:'Arte'}}}})).toMatchObject({quantidadeAulas:2,origem:'horario',presencas:{}});
 });
 it('família recebe apenas ocorrências autorizadas e pertinentes',()=>{
  expect(ocorrenciasDoAluno(ocorrencias,'a',{familia:true}).map(o=>o.id)).toEqual(['1','2']);
  const ficha=consolidarFichaAluno360({aluno,turma:{ocorrencias}});
  expect(ficha.ocorrencias.map(o=>o.id)).toEqual(['1','2']);
 });
 it('linha do tempo reúne notas, frequência, feedback e ocorrências sem vazamento',()=>{
  const turma={id:'t',bimestres:{1:{notas:{a:{simulado:0}},atividades:[]}},frequencias:{'2026-10-23':{quantidadeAulas:2,presencas:{a:'F'}}},ocorrencias};
  const resultado=montarLinhaTempoAluno({aluno,turma,familia:true,historicoAtividades:[{titulo:'Arte',feedback:'Bom progresso',nota:2,bimestre:1}]});
  expect(new Set(resultado.map(r=>r.tipo))).toEqual(new Set(['nota','frequencia','feedback','ocorrencia']));
  expect(resultado.some(r=>r.titulo==='Interna'||r.titulo==='Outro aluno')).toBe(false);
 });
});
it('aula NAO_REALIZADA exige exceção justificada, inclusive em chamada existente sem justificativa',()=>{
 const turma={id:'t',frequencias:{'2026-10-23':{quantidadeAulas:4,presencas:{a:'F'}}}};
 expect(sugerirChamada({turma,data:'2026-10-23',calendario:{aulas:[{turmaId:'t',dataAgendada:'2026-10-23',status:'NAO_REALIZADA'}]}})).toMatchObject({quantidadeAulas:4,exigeJustificativa:true});
});
it('linha do tempo inclui notas de atividades no formato real sem mapear nota ausente como zero',()=>{
 const eventos=montarLinhaTempoAluno({aluno,turma:{bimestres:{1:{atividades:[{id:'x',nome:'Pesquisa'},{id:'y',nome:'Sem nota'}],notas:{a:{x:0}}}}}});
 expect(eventos).toHaveLength(1);expect(eventos[0]).toMatchObject({titulo:'Pesquisa',descricao:'1º bimestre • Nota: 0'});
});
it('exclui alvo malformado da prévia e da Ficha familiar sem tratar como turma toda',()=>{
 const registros=[{id:'string',alunoIds:'a',visivelFamilia:true,titulo:'Alvo inválido'},{id:'objeto',alunoIds:{a:true},visivelFamilia:true,titulo:'Alvo inválido'},{id:'ausente',visivelFamilia:true,titulo:'Sem alvo explícito'},{id:'turma',alunoIds:[],visivelFamilia:true,titulo:'Turma inteira'}];
 expect(ocorrenciasDoAluno(registros,'a',{familia:true}).map(o=>o.id)).toEqual(['turma']);
 expect(consolidarFichaAluno360({aluno,turma:{ocorrencias:registros}}).ocorrencias.map(o=>o.id)).toEqual(['turma']);
});
