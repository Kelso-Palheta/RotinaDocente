import React from 'react';
import {renderToString} from 'react-dom/server';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
vi.mock('../../../../frontend/node_modules/next/navigation.js',()=>({useRouter:()=>({push:vi.fn()})}));
vi.mock('@/lib/firebase-aluno',()=>({validarLoginAluno:vi.fn()}));
import AlunoLoginPage from '@/app/aluno/page';
import {BotaoLeitorVoz} from '@/components/acessibilidade/BotaoLeitorVoz';
const guardar=()=>{sessionStorage.setItem('aluno_base',JSON.stringify({nome:'Aluno teste',login:'aluno'}));sessionStorage.setItem('aluno_vinculos',JSON.stringify([{professorUid:'p',nomeProfessor:'Professora teste',turmaNome:'Turma A',alunoId:'a'}]));};
afterEach(()=>{cleanup();sessionStorage.clear();vi.unstubAllGlobals();});
it('restaura vínculos no navegador sem incluí-los no HTML do servidor',()=>{
 guardar();expect(renderToString(<AlunoLoginPage/>)).not.toContain('Professora teste');render(<AlunoLoginPage/>);expect(screen.getByText(/Professora teste/)).toBeInTheDocument();
});
it('não quebra nem restaura vínculos com JSON inválido',()=>{
 sessionStorage.setItem('aluno_base','{');sessionStorage.setItem('aluno_vinculos','inválido');render(<AlunoLoginPage/>);expect(sessionStorage.getItem('aluno_base')).toBeNull();expect(screen.queryByText(/Professora teste/)).not.toBeInTheDocument();
});
it('remove vínculos da tela quando a sessão externa é removida',()=>{
 guardar();render(<AlunoLoginPage/>);expect(screen.getByText(/Professora teste/)).toBeInTheDocument();
 act(()=>{sessionStorage.clear();window.dispatchEvent(new Event('storage'));});expect(screen.queryByText(/Professora teste/)).not.toBeInTheDocument();
});
it('ignora estruturas inválidas de vínculo sem quebrar a tela',()=>{
 sessionStorage.setItem('aluno_base','{}');sessionStorage.setItem('aluno_vinculos','[null]');expect(()=>render(<AlunoLoginPage/>)).not.toThrow();
});
it('detecta suporte de voz após hidratação e cancela a fala ao desmontar',()=>{
 const voz={cancel:vi.fn(),speak:vi.fn(u=>u.onstart())};vi.stubGlobal('speechSynthesis',voz);vi.stubGlobal('SpeechSynthesisUtterance',class{constructor(text){this.text=text;}});
 expect(renderToString(<BotaoLeitorVoz texto="Texto para ler"/>)).toBe('');const {unmount}=render(<BotaoLeitorVoz texto="Texto para ler"/>);
 fireEvent.click(screen.getByRole('button',{name:'Ouvir texto em voz alta'}));expect(voz.speak).toHaveBeenCalledTimes(1);expect(screen.getByRole('button',{name:'Parar leitura por voz'})).toBeInTheDocument();unmount();expect(voz.cancel).toHaveBeenCalled();
});
