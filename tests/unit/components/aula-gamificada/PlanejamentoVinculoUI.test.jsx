import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {PrepararSala} from '@/components/aula-gamificada/PrepararSala';
import {GeradorIAQuestoes} from '@/components/aula-gamificada/GeradorIAQuestoes';
import {RoteiroDoPlano} from '@/components/aula-gamificada/RoteiroDoPlano';
import * as api from '@/components/aula-gamificada/api';
vi.mock('@/hooks/useAIConfig',()=>({useAIConfig:()=>({temChave:false})}));
vi.mock('@/components/ai/ModalConectarIA',()=>({ModalConectarIA:()=>null}));
vi.mock('@/components/aula-gamificada/api',async importOriginal=>({...await importOriginal(),criarSala:vi.fn()}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
const plano={id:'p1',revision:2,titulo:'Investigar água',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água',objetivo:'Comparar dados',modalidade:'quiz',experiencia:'resgate',turmaIds:['t1'],questaoIds:['q1','q2','q3'],etapas:[{id:'m1',titulo:'Missão 1',minutos:10,tipo:'jogo',orientacao:'Compare dados',questaoIds:['q1']}]};
const questoes=plano.questaoIds.map(id=>({id,enunciado:`Pergunta ${id}`,status:'revisada',tipo:'multipla_escolha',disciplina:'Ciências',conteudo:'Água'}));
it('preenche geração por contexto do plano, sem exigir IA para visualizar',()=>{
 render(<GeradorIAQuestoes planejamentoInicial={plano}/>);
 expect(screen.getByLabelText('Disciplina').value).toBe('Ciências');
 expect(screen.getByLabelText('Série / Ano escolar').value).toBe('8º ano');
 expect(screen.getByLabelText('Conteúdo / Tema').value).toBe('Água');
});
it('preenche preparação e envia somente referência de plano com revisão',async()=>{
 api.criarSala.mockResolvedValue({sala:{codigo:'RIO123',titulo:plano.titulo,modalidade:'quiz',fase:'espera'}});
 render(<PrepararSala planoInicial={plano} questaoIdsIniciais={plano.questaoIds} turmas={[{id:'t1',nome:'Turma 1',alunos:[{id:'a1',nome:'Aluno sintético'}]}]} questoes={questoes}/>);
 expect(screen.getByLabelText('Título da sala').value).toBe(plano.titulo);
 expect(screen.getByLabelText(/Resgate do Rio · investigação/).checked).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:/Criar sala ao vivo/i}));
 await waitFor(()=>expect(api.criarSala).toHaveBeenCalled());
 expect(api.criarSala).toHaveBeenCalledWith(expect.objectContaining({configuracao:expect.objectContaining({planoId:'p1',planoRevision:2,questaoIds:plano.questaoIds,experiencia:'resgate',turmaIds:['t1']})}));
});
it('mostra roteiro congelado e etapa associada à questão',()=>{
 render(<RoteiroDoPlano plano={plano} questaoId="q1" fase="pergunta"/>);
 expect(screen.getByText(/Objetivo: Comparar dados/)).toBeTruthy();
 expect(screen.getByRole('listitem').getAttribute('aria-current')).toBe('step');
});
