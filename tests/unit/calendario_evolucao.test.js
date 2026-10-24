import {describe,it,expect} from 'vitest';
import {ScheduleGeneratorEngine as E} from '@/lib/engines/ScheduleGeneratorEngine';
import {planejarDistribuicao,remanejarSeguro,planejarFeriados,reconciliarGrade,limparAgendamentos,estadoConteudos,mesclarPlanejamento} from '@/dominio/calendario/evolucao';
const t=(id,d=1)=>({id,ordem:Number(id.slice(1))||1,titulo:id,duracaoEstimadaAulas:d});
const a=(id,data,status='AGENDADA',ts=[],cap=1)=>({id,turmaId:'t',dataAgendada:data,status,horarioInicio:'07:00',horarioFim:'08:00',duracaoAlocadaAulas:cap,topicosAssociados:ts});
describe('RN66 calendário seguro',()=>{
 it('gera todos os blocos do mesmo dia e recusa sobreposição',()=>{
  const grade={turmaId:'t',diasSemana:[{diaSemana:1,horarioInicio:'07:00',horarioFim:'08:00',quantidadeAulas:1},{diaSemana:1,horarioInicio:'10:00',horarioFim:'11:00',quantidadeAulas:1}]};
  expect(E.gerarSlotsCalendario(grade,'2026-11-02','2026-11-02')).toHaveLength(2);
  expect(()=>E.gerarSlotsCalendario({...grade,diasSemana:[...grade.diasSemana,{diaSemana:1,horarioInicio:'07:30',horarioFim:'08:30',quantidadeAulas:1}]},'2026-11-02','2026-11-02')).toThrow(/sobrepos/i);
 });
 it('não repete concluídos nem vínculos antes do recorte e preserva parciais',()=>{
  const aulas=[a('a1','2026-11-01','CONCLUIDA',[t('t1')]),a('a2','2026-11-02','AGENDADA',[t('t2')]),a('a3','2026-11-03','PARCIAL',[t('t3')]),a('a4','2026-11-04')];
  const r=planejarDistribuicao(aulas,[t('t1'),t('t2'),t('t3'),t('t4')],{dataInicio:'2026-11-03',modo:'substituir'});
  expect(r.aulas[3].topicosAssociados[0].topicoId).toBe('t4');expect(r.aulas[2]).toEqual(aulas[2]);expect(aulas[3].topicosAssociados).toEqual([]);
 });
 it('reserva duração por capacidade e informa conteúdos sem espaço',()=>{
  const r=planejarDistribuicao([a('a1','2026-11-02','AGENDADA',[],2),a('a2','2026-11-03')],[t('t1',3),t('t2')],{dataInicio:'2026-11-01'});
  expect(r.aulas[0].topicosAssociados[0].duracaoAlocadaAulas).toBe(2);expect(r.aulas[1].topicosAssociados[0].duracaoAlocadaAulas).toBe(1);expect(r.pendentes.map(x=>x.id)).toEqual(['t2']);
 });
 it('devolve aos pendentes sem apagar histórico ou mudar próximas datas',()=>{
  const aulas=[a('a1','2026-11-02','AGENDADA',[t('t1')]),a('a2','2026-11-03','AGENDADA',[t('t2')])];
  const r=remanejarSeguro(aulas,'a1','NAO_REALIZADA',{decisao:'pular',execucao:{justificativa:'Reunião'}});
  expect(r.aulas[0].topicosAssociados[0].id).toBe('t1');expect(r.aulas[1]).toEqual(aulas[1]);expect(estadoConteudos([t('t1'),t('t2')],r.aulas).find(x=>x.id==='t1').estado).toBe('pendente');
 });
 it('reagenda sem perder sobra, preservando concluídas e incluindo justificativa',()=>{
  const r=remanejarSeguro([a('a1','2026-11-02','AGENDADA',[t('t1')]),a('a2','2026-11-03','AGENDADA',[t('t2')])],'a1','PARCIAL',{execucao:{justificativa:'Faltou tempo',restante:'Exercícios'}});
  expect(r.pendentes.map(x=>x.id||x.topicoId)).toContain('t2');expect(r.aulas[0].execucao.restante).toBe('Exercícios');expect(r.aulas[1].topicosAssociados[0].topicoId).toBe('t1');
 });
 it('bloqueia vários feriados antes de remanejar, grava motivo e reabre sem redistribuir',()=>{
  const aulas=[a('a1','2026-11-02','AGENDADA',[t('t1')]),a('a2','2026-11-03','AGENDADA',[t('t2')]),a('a3','2026-11-04')];
  const r=planejarFeriados(aulas,[{data:'2026-11-02',nome:'Recesso'},{data:'2026-11-03',nome:'Recesso'}]);
  expect(r.aulas.slice(0,2).every(x=>x.status==='NAO_REALIZADA'&&x.bloqueioAutomatico&&x.motivoCancelamento==='Recesso')).toBe(true);
  expect(r.aulas[2].topicosAssociados[0].topicoId).toBe('t1');expect(r.pendentes).toHaveLength(1);
  const removido=planejarFeriados(r.aulas,[]);expect(removido.aulas[0].status).toBe('AGENDADA');expect(removido.aulas[0].topicosAssociados).toEqual([]);expect(removido.aulas[2]).toEqual(r.aulas[2]);
 });
 it('prévia preserva realizados, migra vínculo se destino único e bloqueia remoção sem destino',()=>{
  const antiga=a('old','2026-11-02','AGENDADA',[t('t1')]);const novo={...a('new','2026-11-02'),horarioInicio:'10:00',horarioFim:'11:00'};
  const r=reconciliarGrade([antiga],{turmaId:'t',anoLetivo:2026,aplicarDesde:'2026-11-01'},[novo]);
  expect(r.conflitos).toEqual([]);expect(r.aulas[0].topicosAssociados[0].id).toBe('t1');
  expect(reconciliarGrade([antiga],{turmaId:'t',anoLetivo:2026,aplicarDesde:'2026-11-01'},[]).conflitos.length).toBeGreaterThan(0);
  const hist=a('hist','2026-11-02','CONCLUIDA',[t('t1')]);expect(reconciliarGrade([hist],{turmaId:'t',anoLetivo:2026},[]).aulas).toContainEqual(hist);
 });
 it('limpeza conserva passado, parciais, concluídas e outras turmas',()=>{
  const xs=[a('a1','2026-11-01','CONCLUIDA',[t('t1')]),a('a2','2026-11-03','PARCIAL',[t('t2')]),a('a3','2026-11-04','AGENDADA',[t('t3')])];
  const r=limparAgendamentos(xs,{dataInicio:'2026-11-02',dataFim:'2026-11-30'});expect(r[0]).toEqual(xs[0]);expect(r[1]).toEqual(xs[1]);expect(r[2].topicosAssociados).toEqual([]);
 });
 it('progresso conta tópicos únicos e substituição bloqueia perda de vinculados',()=>{
  const plan=[t('t1'),t('t2'),t('t3')];const aulas=[a('a1','2026-11-02','CONCLUIDA',plan)];
  expect(estadoConteudos(plan,aulas).filter(x=>x.estado==='concluido')).toHaveLength(3);
  expect(()=>mesclarPlanejamento(plan,[t('t4')],'substituir',aulas)).toThrow(/vinculado|histórico/i);
 });
});
it('repetir reagendamento não duplica vínculo já encaminhado',()=>{
 const xs=[a('a1','2026-11-02','AGENDADA',[t('t1')]),a('a2','2026-11-03'),a('a3','2026-11-04')];
 const r=remanejarSeguro(xs,'a1','PARCIAL');const repetido=remanejarSeguro(r.aulas,'a1','PARCIAL');
 expect(repetido.aulas.filter(x=>x.status==='AGENDADA').flatMap(x=>x.topicosAssociados)).toHaveLength(1);
});
it('conteúdo parcialmente alocado continua pendente com duração restante',()=>{
 const r=planejarDistribuicao([a('a1','2026-11-02')],[t('t1',3)],{dataInicio:'2026-11-01'});
 expect(estadoConteudos([t('t1',3)],r.aulas)[0]).toMatchObject({estado:'pendente',duracaoRestante:2});
});
it('reorganização mantém conteúdos vinculados ausentes do plano',()=>{
 const xs=[a('a1','2026-11-02','AGENDADA',[t('legado')]),a('a2','2026-11-03')];
 const r=planejarDistribuicao(xs,[t('t1')],{dataInicio:'2026-11-01',modo:'substituir'});
 expect(r.aulas.flatMap(x=>x.topicosAssociados).some(x=>(x.id||x.topicoId)==='legado')).toBe(true);
});
it('reduzir capacidade de horário com conteúdo excedente gera conflito',()=>{
 const old=a('a1','2026-11-02','AGENDADA',[{...t('t1'),duracaoAlocadaAulas:2}],2);
 const r=reconciliarGrade([old],{turmaId:'t',anoLetivo:2026,aplicarDesde:'2026-11-01'},[{...old,duracaoAlocadaAulas:1,topicosAssociados:[]}]);
 expect(r.conflitos.length).toBeGreaterThan(0);
});
it('retirar feriado não reabre cancelamento manual anterior',()=>{
 const manual={...a('a1','2026-11-02','NAO_REALIZADA',[t('t1')]),motivoCancelamento:'Reunião'};
 const bloqueado=planejarFeriados([manual],[{data:'2026-11-02',nome:'Feriado'}]);
 expect(planejarFeriados(bloqueado.aulas,[]).aulas[0]).toEqual(manual);
});
it('substituição de pendentes preserva os conteúdos vinculados e históricos',()=>{
 const antigos=[t('t1'),t('t2')];const xs=[a('a1','2026-11-02','CONCLUIDA',[t('t1')])];
 expect(mesclarPlanejamento(antigos,[t('t3')],'substituir_pendentes',xs).map(x=>x.id)).toEqual(['t1','t3']);
});
it('reconciliação não modifica a grade proposta e preserva reposições',()=>{
 const old=a('a1','2026-11-02','AGENDADA',[t('t1')]);const novo=a('a1','2026-11-02');
 reconciliarGrade([old],{turmaId:'t',anoLetivo:2026},[novo]);expect(novo.topicosAssociados).toEqual([]);
 const grade={turmaId:'t',anoLetivo:2026,diasSemana:[{diaSemana:1,horarioInicio:'07:00',horarioFim:'08:00',quantidadeAulas:1}],reposicoes:[{...a('extra','2026-11-03'),reposicao:true}]};
 expect(E.gerarSlotsCalendario(grade,'2026-11-02','2026-11-03').map(x=>x.id)).toContain('extra');
});
it('atualizar um período não remove aulas posteriores e não sobrepõe realizadas',()=>{
 const historica={...a('hist','2026-11-02','CONCLUIDA',[t('t1')]),horarioInicio:'07:00',horarioFim:'08:00'};
 const futura=a('dez','2026-12-02');const nova={...a('new','2026-11-02'),horarioInicio:'07:30',horarioFim:'08:30'};
 const r=reconciliarGrade([historica,futura],{turmaId:'t',anoLetivo:2026,dataInicioPeriodo:'2026-11-01',dataFimPeriodo:'2026-11-30'},[nova]);
 expect(r.aulas).toContainEqual(futura);expect(r.aulas.some(x=>x.id==='new')).toBe(false);expect(r.aulas).toContainEqual(historica);
});
