/** Auditoria histórica: estes testes passam confirmando comportamentos incorretos. */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi,afterEach} from 'vitest';
import {BimestreCard} from '@/components/aluno/BimestreCard';
import {FeedbackView} from '@/app/aluno/atividade/[id]/FeedbackView';
import {ConfirmacaoView} from '@/app/aluno/atividade/[id]/ConfirmacaoView';
const m=vi.hoisted(()=>({session:{loginKey:'login-a',nome:'Aluno A',vinculos:[{professorUid:'prof',turmaId:'turma',alunoId:'a'}]}}));
vi.mock('@/lib/aluno/session',()=>({getSessionFromRequest:()=>m.session}));
vi.mock('@/lib/firebase-admin',()=>({getAdminDb:()=>({doc:path=>({get:async()=>{
 if(path==='professores/prof/correcoes/redacao-b')return{exists:true,id:'redacao-b',data:()=>({alunoId:'b',nome:'Aluno B',texto:'Texto sintético do aluno B',totalScore:800})};
 if(path==='alunoLogin/login-a/vinculos/prof')return{exists:true,data:()=>({professorUid:'prof',turmaId:'turma',alunoId:'a'})};
 if(path.startsWith('notasAluno/'))throw new Error('Falha simulada de leitura');
 return{exists:false};
 }}),collection:()=>({where(){return this;},get:async()=>{throw new Error('Falha simulada de leitura');}})})}));
import {GET as redacao} from '@/app/api/aluno/redacao/[id]/route';
import {GET as boletim} from '@/app/api/aluno/boletim/route';
afterEach(()=>vi.restoreAllMocks());
it('sessão do aluno A recebe redação do aluno B se o professor for o mesmo',async()=>{
 const r=await redacao(new Request('http://localhost/api/aluno/redacao/redacao-b?professorUid=prof'),{params:Promise.resolve({id:'redacao-b'})});
 expect(r.status).toBe(200);expect((await r.json()).correction.alunoId).toBe('b');
});
it('leitura do boletim falha e API ainda devolve sucesso com listas vazias',async()=>{
 vi.spyOn(console,'warn').mockImplementation(()=>{});
 const r=await boletim(new Request('http://localhost/api/aluno/boletim?professorUid=prof&turmaId=turma&alunoId=a'));
 expect(r.status).toBe(200);const d=await r.json();expect(d.success).toBe(true);expect(d.notas).toEqual({});expect(d.atividades).toEqual([]);
});
it('nota ausente de uma atividade aparece como zero quando simulado já foi publicado',()=>{
 const html=renderToStaticMarkup(<BimestreCard numero={1} alunoId="a" turma={{bimestres:{1:{atividades:[{id:'trabalho',nome:'Trabalho sintético',max:5}],notas:{a:{simulado:3}}}}}}/>);
 expect(html).toContain('Trabalho sintético');expect(html).toContain('0,00');
});
it('feedback de multipla_escolha não mostra a resposta marcada nem indicador correta/incorreta',()=>{
 const html=renderToStaticMarkup(<FeedbackView atividade={{notaMaxima:10,questoes:[{id:'q',tipo:'multipla_escolha',enunciado:'Questão sintética'}]}} entrega={{notaFinal:0,status:'corrigido',respostas:{q:{resposta:'B'}},resultados:{q:{notaObtida:0,notaMaxima:10,correto:false,feedback:'Revise o conteúdo.'}}}}/>);
 expect(html).not.toContain('marcou:');expect(html).not.toContain('Incorreta');
});
it('confirmação ignora data serializada da entrega e usa a data atual',()=>{
 const html=renderToStaticMarkup(<ConfirmacaoView submittedAt="2000-01-02T12:00:00Z"/>);
 expect(html).not.toContain('02/01/2000');expect(html).toContain('Sua resposta foi enviada em');
});
