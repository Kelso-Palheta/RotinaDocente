import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import AdaptacoesPage from '@/app/adaptacoes/page';
import { extractTextFromDocument } from '@/utils/atividades/documentExtractor';
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { uid: 'teste' } }) }));
vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/hooks/useAIConfig', () => ({ useAIConfig: () => ({ temChave: true, provider: 'gemini', getAIHeaders: () => ({}) }) }));
vi.mock('@/utils/atividades/documentExtractor', () => ({ extractTextFromDocument: vi.fn(async () => ({ texto: 'Texto da página fotografada.', nomeArquivo: 'livro.png', tamanhoBytes: 6, tipo: 'imagem', totalCaracteres: 27 })) }));
afterEach(cleanup);
it('gerador adaptado aceita fotografia e preenche conteúdo revisável', async () => {
 const { container } = render(<AdaptacoesPage />);
 const input = container.querySelector('#upload-documento-atividade');
 expect(input.accept).toContain('.png');
 const file = new File(['imagem'], 'livro.png', { type: 'image/png' });
 fireEvent.change(input, { target: { files: [file] } });
 const editor = await screen.findByDisplayValue('Texto da página fotografada.');
 expect(extractTextFromDocument).toHaveBeenCalledWith(file, { allowImages: true });
 fireEvent.change(editor, { target: { value: 'Conteúdo revisado.' } });
 expect(editor).toHaveValue('Conteúdo revisado.');
});
