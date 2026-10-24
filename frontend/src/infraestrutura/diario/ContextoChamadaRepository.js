import {CalendarioRepository} from '@/infraestrutura/calendario/CalendarioRepository';
import {HorarioRepository} from '@/infraestrutura/horario/HorarioRepository';
import {db} from '@/lib/firebase';
/** Leitura de fontes reais; falhas são explícitas e não alteram frequência. */
export async function carregarContextoChamada(professorId,turmaId,ano){
 const resultados=await Promise.allSettled([new CalendarioRepository(professorId).carregar(turmaId,ano),new HorarioRepository({firestoreDb:db}).carregarGrade(professorId,{somenteReal:true})]);
 return {calendario:resultados[0].status==='fulfilled'?resultados[0].value:null,horario:resultados[1].status==='fulfilled'?resultados[1].value:null,aviso:resultados.some(r=>r.status==='rejected')?'Não foi possível consultar todas as sugestões. Confira a quantidade de aulas.':''};
}
