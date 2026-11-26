import React from 'react';
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{uid:'p1'},loading:false})}));
vi.mock('@/lib/firebase',()=>({auth:{currentUser:{uid:'p1',getIdToken:async()=> 'token'}}}));
vi.mock('@/hooks/useAIConfig',()=>({useAIConfig:()=>({temChave:false})}));
vi.mock('@/components/aula-gamificada/api',async original=>({...await original(),buscarCatalogo:async()=>({turmas:[],questoes:[],modalidades:[],salas:[]}),obterContextoAvaliacao:async()=>({turmas:[],anos:[]}),obterPlano:async()=>({plano:{id:'p1',tipo:'gamificado',abrangencia:'planejamento',titulo:'Plano anual privado'}})}));
import {HubDocente} from '@/components/aula-gamificada/HubDocente';
afterEach(()=>{cleanup();history.replaceState({},'', '/');});
it.each(['gerar','salas'])('planejamento da disciplina não entra diretamente em %s',async destino=>{
 history.replaceState({},'',`/aula-gamificada/salas?plano=p1&destino=${destino}`);
 render(<HubDocente/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('Derive um plano de conteúdo');
 expect(screen.queryByRole('textbox',{name:'Conteúdo / Tema'})).toBeNull();
});
