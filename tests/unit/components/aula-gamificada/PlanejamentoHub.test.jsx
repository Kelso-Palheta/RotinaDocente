import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({user:{uid:'prof1'},auth:{currentUser:{uid:'prof1',getIdToken:async()=> 'token'}},catalogo:vi.fn(),listar:vi.fn(),obter:vi.fn(),criar:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:mocks.user,loading:false})}));
vi.mock('@/lib/firebase',()=>({auth:mocks.auth}));
vi.mock('@/hooks/useAIConfig',()=>({useAIConfig:()=>({temChave:false})}));
vi.mock('@/components/ai/ModalConectarIA',()=>({ModalConectarIA:()=>null}));
vi.mock('@/components/aula-gamificada/api',async original=>({...await original(),buscarCatalogo:(...a)=>mocks.catalogo(...a),obterContextoAvaliacao:async()=>({turmas:[],anos:[]}),listarPlanos:(...a)=>mocks.listar(...a),obterPlano:(...a)=>mocks.obter(...a),criarSala:(...a)=>mocks.criar(...a)}));
import {HubDocente} from '@/components/aula-gamificada/HubDocente';
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('navega plano → geração → plano → partida sem perder vínculo ou criar automaticamente',async()=>{
 const plano={id:'p1',revision:1,titulo:'Aula água',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água',objetivo:'Investigar evidências',duracaoMinutos:50,modalidade:'quiz',experiencia:'resgate',turmaIds:['t1'],questaoIds:['q1','q2','q3'],etapas:[{id:'a',tipo:'introducao',titulo:'Abertura',minutos:5,orientacao:''},{id:'m',tipo:'jogo',titulo:'Missão',minutos:35,orientacao:''},{id:'f',tipo:'fechamento',titulo:'Síntese',minutos:10,orientacao:''}]};
 mocks.catalogo.mockResolvedValue({modalidades:[],turmas:[{id:'t1',nome:'Turma 1',alunos:[{id:'a1',nome:'Aluno sintético'}]}],questoes:plano.questaoIds.map(id=>({id,tipo:'multipla_escolha',status:'revisada',disciplina:'Ciências',conteudo:'Água',enunciado:'Questão '+id})),salas:[]});mocks.listar.mockResolvedValue({planos:[plano]});mocks.obter.mockResolvedValue({plano});
 render(<HubDocente/>);fireEvent.click(await screen.findByRole('button',{name:'Planejar aula'}));fireEvent.click(await screen.findByRole('button',{name:'Abrir Aula água'}));await waitFor(()=>expect(screen.getByRole('textbox',{name:'Título do plano'}).value).toBe('Aula água'));
 fireEvent.click(screen.getByRole('button',{name:'Gerar questões deste plano'}));expect(screen.getByRole('combobox',{name:'Disciplina'}).value).toBe('Ciências');
 fireEvent.click(screen.getByRole('button',{name:'Voltar ao planejamento'}));expect(screen.getByRole('textbox',{name:'Título do plano'}).value).toBe('Aula água');
 fireEvent.click(screen.getByRole('button',{name:'Preparar partida deste plano'}));expect(screen.getByRole('textbox',{name:'Título da sala'}).value).toBe('Aula água');expect(mocks.criar).not.toHaveBeenCalled();
});
