import React from 'react';
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
vi.mock('@/hooks/useAIConfig',()=>({useAIConfig:()=>({temChave:false})}));
vi.mock('@/components/ai/ModalConectarIA',()=>({ModalConectarIA:()=>null}));
import {GeradorIAQuestoes} from '@/components/aula-gamificada/GeradorIAQuestoes';
afterEach(cleanup);
it('preserva texto extenso e pede recorte dentro do contrato da geração',()=>{const conteudo='Conteúdo anual extenso. '.repeat(30);render(<GeradorIAQuestoes planejamentoInicial={{conteudo,disciplina:'Ciências'}}/>);expect(screen.getByLabelText('Conteúdo / Tema').value).toBe('');expect(screen.getByText('Escolha um recorte para gerar as questões')).toBeTruthy();expect(screen.getByText(conteudo.trim())).toBeTruthy();});
it('tema curto continua preenchido como antes',()=>{render(<GeradorIAQuestoes planejamentoInicial={{conteudo:'Água'}}/>);expect(screen.getByLabelText('Conteúdo / Tema').value).toBe('Água');});
