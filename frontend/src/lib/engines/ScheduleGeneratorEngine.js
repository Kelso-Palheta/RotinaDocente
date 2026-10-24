import { planejarDistribuicao, remanejarSeguro, planejarFeriados } from '@/dominio/calendario/evolucao';
import { validarGradeCalendario } from '@/dominio/horario/conversorGradeCalendario';
import { 
  eachDayOfInterval, 
  getDay, 
  parseISO, 
  format,
} from 'date-fns';

/**
 * Motor para geração de slots de aulas recorrentes a partir de uma grade horária.
 */
export class ScheduleGeneratorEngine {
  /**
   * Gera todos os slots de aula agendada para uma turma em um período.
   * 
   * @param {Object} grade - Configuração da grade (id, turmaId, diasSemana, etc)
   * @param {String} dataInicio - "YYYY-MM-DD"
   * @param {String} dataFim - "YYYY-MM-DD"
   * @returns {Array} Lista de AulaAgendada (sem os tópicos do plano, apenas os slots)
   */
  static gerarSlotsCalendario(grade, dataInicio, dataFim) {
    if (!grade || !grade.diasSemana || grade.diasSemana.length === 0) {
      return [];
    }

    const start = parseISO(dataInicio);
    const end = parseISO(dataFim);

    validarGradeCalendario({ ...grade, anoLetivo:grade.anoLetivo||Number(dataInicio.slice(0,4)), aplicarDesde:grade.aplicarDesde||dataInicio, dataInicioPeriodo: dataInicio, dataFimPeriodo: dataFim });
    const aulasGeradas=[];
    let ordemSequencial=1;
    for (const dia of eachDayOfInterval({start,end})) {
      const configs=grade.diasSemana.filter(d=>Number(d.diaSemana)===getDay(dia)).sort((a,b)=>a.horarioInicio.localeCompare(b.horarioInicio));
      for(const config of configs){
        const data=format(dia,'yyyy-MM-dd');
        aulasGeradas.push({id:`slot_${grade.turmaId}_${data}_${config.horarioInicio.replace(':','')}`,turmaId:grade.turmaId,anoLetivo:Number(data.slice(0,4)),dataAgendada:data,diaSemana:getDay(dia),horarioInicio:config.horarioInicio,horarioFim:config.horarioFim,duracaoAlocadaAulas:Number(config.quantidadeAulas)||1,status:'AGENDADA',ordemSequencialIndex:ordemSequencial++,topicosAssociados:[],topicoId:null,topicoOrdem:null,topicoTitulo:null,planejamentoId:null});
      }
    }

    for(const extra of grade.reposicoes||[]){
      if(extra.dataAgendada<dataInicio||extra.dataAgendada>dataFim)continue;
      if(aulasGeradas.some(a=>a.dataAgendada===extra.dataAgendada&&a.horarioInicio<extra.horarioFim&&a.horarioFim>extra.horarioInicio))throw new Error('Uma reposição sobrepõe o novo horário. Revise os horários extras.');
      aulasGeradas.push({...extra,turmaId:grade.turmaId,anoLetivo:Number(extra.dataAgendada.slice(0,4))});
    }
    return aulasGeradas.sort((a,b)=>`${a.dataAgendada} ${a.horarioInicio}`.localeCompare(`${b.dataAgendada} ${b.horarioInicio}`));
  }

  /**
   * Executa o remanejamento em cascata (Smart Shift) quando uma aula precisa ser reagendada (PARCIAL ou NAO_REALIZADA).
   * Empurra os tópicos para as próximas aulas ativas mantendo o status e os tópicos visíveis no card de origem.
   * 
   * @param {Array} aulas - Lista de todas as aulas agendadas da turma
   * @param {String} aulaIdOrigem - ID da aula que teve status alterado
   * @param {String} novoStatus - 'PARCIAL' | 'NAO_REALIZADA'
   * @returns {Array} Nova lista de aulas com os tópicos remanejados em cascata
   */
  static remanejarAulasEmCascata(aulas, aulaIdOrigem, novoStatus = 'NAO_REALIZADA') {
    if (!aulas?.some(a=>a.id===aulaIdOrigem)) return aulas || [];
    return remanejarSeguro(aulas,aulaIdOrigem,novoStatus).aulas;
  }

  /**
   * Retorna os principais feriados nacionais brasileiros fixos e móveis para um determinado ano.
   * 
   * @param {Number} ano 
   * @returns {Array} Lista de feriados { data: "YYYY-MM-DD", nome: string }
   */
  static obterFeriadosNacionais(ano = new Date().getFullYear()) {
    return [
      { data: `${ano}-01-01`, nome: 'Confraternização Universal' },
      { data: `${ano}-04-21`, nome: 'Tiradentes' },
      { data: `${ano}-05-01`, nome: 'Dia do Trabalho' },
      { data: `${ano}-09-07`, nome: 'Independência do Brasil' },
      { data: `${ano}-10-12`, nome: 'Nossa Senhora Aparecida' },
      { data: `${ano}-11-02`, nome: 'Finados' },
      { data: `${ano}-11-15`, nome: 'Proclamação da República' },
      { data: `${ano}-11-20`, nome: 'Dia da Consciência Negra' },
      { data: `${ano}-12-25`, nome: 'Natal' }
    ];
  }

  /**
   * Aplica um feriado ou recesso escolar a uma data no calendário.
   * Cancela as aulas do dia atribuindo o motivo e remaneja os tópicos em cascata (RN-12).
   * 
   * @param {Array} aulas 
   * @param {String} dataFeriado - "YYYY-MM-DD"
   * @param {String} motivo - Nome do feriado/recesso
   * @returns {Array} Aulas atualizadas com o feriado aplicado e tópicos remanejados
   */
  static aplicarFeriadoNoCalendario(aulas, dataFeriado, motivo = 'Feriado / Recesso Escolar') {
    return planejarFeriados(aulas,[{data:dataFeriado,nome:motivo}]).aulas;
  }

  /**
   * Distribui automaticamente uma lista de tópicos nos slots de aula do calendário (RN-19).
   * 
   * @param {Array} aulas - Lista de todas as aulas da turma
   * @param {Array} topicos - Lista de tópicos do planejamento
   * @param {Object} options - { dataInicio: string, modo: 'substituir' | 'apenas_vagas', feriados: Array }
   * @returns {Array} Aulas com os tópicos distribuídos
   */
  static autoDistribuirTopicos(aulas = [], topicos = [], options = {}) {
    return planejarDistribuicao(aulas,topicos,{dataInicio:format(new Date(),'yyyy-MM-dd'),...options}).aulas;
  }

  /**
   * Atualiza o status de uma aula permitindo decidir entre Smart Shift ou Pular Conteúdo (RN-20).
   * Preserva os tópicos associados e o status correto da aula em qualquer decisão.
   * 
   * @param {Array} aulas 
   * @param {String} aulaId 
   * @param {String} novoStatus - 'AGENDADA' | 'CONCLUIDA' | 'PARCIAL' | 'NAO_REALIZADA'
   * @param {String} decisao - 'smart_shift' | 'pular'
   * @returns {Array} Aulas atualizadas
   */
  static atualizarStatusComDecisao(aulas = [], aulaId, novoStatus, decisao = 'pular') {
    if (!aulas?.some(a=>a.id===aulaId)) return aulas || [];
    if(!['PARCIAL','NAO_REALIZADA'].includes(novoStatus))return aulas.map(a=>a.id===aulaId?{...a,status:novoStatus}:a);
    return remanejarSeguro(aulas,aulaId,novoStatus,{decisao}).aulas;
  }
}



