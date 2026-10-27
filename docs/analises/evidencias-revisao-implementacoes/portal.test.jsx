import { render, screen, within, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ router: { push: vi.fn(), replace: vi.fn() } }));
vi.mock('../../../frontend/node_modules/next/navigation.js', () => ({ useRouter: () => mocks.router }));
vi.mock('@/lib/firebase-aluno', () => ({}));
vi.mock('@/lib/aluno/boletim-pdf', () => ({ generateBoletimPDF: vi.fn() }));

import AlunoNotasPage from '@/app/aluno/notas/page';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

test('reprodução: falha parcial em nova tentativa apaga notas já carregadas',async()=>{
  sessionStorage.setItem('aluno_login',JSON.stringify({nome:'Ana Fictícia',alunoId:'a',turmaId:'t',professorUid:'p'}));
  const notas={bimestres:{1:{config:{simuladoMaxLanca:10,simuladoMaxFinal:10,atividadesMaxFinal:0},atividades:[],notas:{a:{simulado:6}}}}};
  const fetchMock=vi.fn()
   .mockResolvedValueOnce({ok:true,json:async()=>({notas,atividades:[],entregas:[],tokens:{},falhas:{entregas:true}})})
   .mockResolvedValueOnce({ok:true,json:async()=>({notas:{},atividades:[],entregas:[],tokens:{},falhas:{notas:true}})});
  vi.stubGlobal('fetch',fetchMock);
  render(<AlunoNotasPage/>);
  await screen.findByText('Ana Fictícia');
  expect(screen.getAllByText('6,00').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button',{name:'Tentar novamente'}));
  await screen.findByText(/Não foi possível carregar suas notas/);
  expect(screen.queryAllByText('6,00')).toHaveLength(0);
});
