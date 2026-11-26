import React from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {AppRouterContext} from '../../../../frontend/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js';
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{uid:'sintetico',displayName:'Professor sintético'},perfil:{plano:'gratuito'},creditos:{},logout:vi.fn()})}));
vi.mock('@/hooks/useAIConfig',()=>({useAIConfig:()=>({config:null,temChave:false})}));
vi.mock('@/components/diario/ProfileModal',()=>({ProfileModal:()=>null}));
vi.mock('@/components/ai/ModalConectarIA',()=>({ModalConectarIA:()=>null}));
import Dashboard from '@/components/Dashboard';
afterEach(cleanup);
it('planejamento usa card comum, seguido de diário e horário; aula gamificada mantém banner',()=>{
 const push=vi.fn();const {container}=render(<AppRouterContext.Provider value={{push}}><Dashboard/></AppRouterContext.Provider>);
 const cards=[...container.querySelectorAll('button.arte-ferramenta')];expect(cards).toHaveLength(10);
 expect(cards.slice(0,3).map(c=>c.querySelector('h4').textContent)).toEqual(['Planejamento','Diário Pedagógico','Meu Horário Escolar']);
 expect(screen.getAllByRole('heading',{name:'Planejamento'})).toHaveLength(1);expect(container.querySelector('a[href="/aula-gamificada"]')).toBeTruthy();
 fireEvent.click(cards[0]);expect(push).toHaveBeenCalledWith('/planejamento');expect(screen.queryByText(/O módulo "Planejamento" não faz parte/)).toBeNull();
});
