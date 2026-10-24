/** Auditoria: testes confirmam defeitos atuais, não critérios de aceite da correção. */
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { VisualizadorAtividadeAdaptada } from '@/components/adaptacoes/VisualizadorAtividadeAdaptada';
import { PainelMontadorProvas } from '@/components/adaptacoes/PainelMontadorProvas';
import { ImagemPedagogicaBuilder as Builder } from '@/dominio/adaptacoes/ImagemPedagogicaBuilder';
import { POST } from '@/app/api/adaptacoes/imagem/route';
vi.mock('@/lib/auth-context', () => ({ useOptionalAuth: () => ({ user: { uid: 'professor_sintetico' } }) }));
vi.mock('@/hooks/useAIConfig', () => ({ useAIConfig: () => ({ temChave: true, getAIHeaders: () => ({}) }) }));
vi.mock('@/lib/firebase-atividades', () => ({ createAtividade: vi.fn(), createTokensForAtividade: vi.fn() }));
const NOVA = 'data:image/png;base64,bm92YQ==';
const ANTIGA = 'data:image/png;base64,YW50aWdh';
function resultado(imagemUrl) {
 return { titulo: 'Contagem sintética', aluno: { nome: 'Aluno sintético', necessidades: ['tdah'] }, atividadeAdaptada: { questoes: [{ numero: 1, enunciado: 'Conte as três maçãs.', apoioVisualDescricao: 'Três maçãs', ...(imagemUrl ? { imagemUrl } : {}) }] } };
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it('imagem gerada aparece, mas callback de salvar recebe questão sem imagem', async () => {
 vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ imagemUrl: NOVA }) })));
 const salvar = vi.fn();
 render(<VisualizadorAtividadeAdaptada resultado={resultado()} onSalvarNoBanco={salvar} />);
 fireEvent.click(screen.getByRole('button', { name: /Gerar Imagem com IA/ }));
 expect((await screen.findByRole('img')).getAttribute('src')).toBe(NOVA);
 fireEvent.click(screen.getByRole('button', { name: 'Salvar Prova/Atividade' }));
 await waitFor(() => expect(salvar).toHaveBeenCalled());
 expect(salvar.mock.calls[0][0].atividadeAdaptada.questoes[0].imagemUrl).toBeUndefined();
});
it('regerar questão salva mantém imagem antiga visível apesar do retorno novo', async () => {
 const requisicao = vi.fn(async () => ({ ok: true, json: async () => ({ imagemUrl: NOVA }) }));
 vi.stubGlobal('fetch', requisicao);
 render(<VisualizadorAtividadeAdaptada resultado={resultado(ANTIGA)} />);
 fireEvent.click(screen.getByRole('button', { name: 'Regerar' }));
 await waitFor(() => expect(screen.getByRole('button', { name: 'Regerar' })).not.toBeDisabled());
 expect(requisicao).toHaveBeenCalledTimes(1);
 expect(screen.getByRole('img').getAttribute('src')).toBe(ANTIGA);
});
it('montador mostra descrição, mas não renderiza imagem na prévia de impressão', () => {
 const prova = { titulo: 'Prova sintética', questoes: [{ id: 'q', enunciado: 'Conte as maçãs', imagemUrl: NOVA, apoioVisualDescricao: 'Três maçãs', alternativas: [] }] };
 render(<PainelMontadorProvas prova={prova} />);
 fireEvent.click(screen.getByRole('button', { name: 'Visualizar & Imprimir' }));
 expect(screen.getByText('Três maçãs')).toBeInTheDocument();
 expect(screen.queryByRole('img')).toBeNull();
});
it('rota principal aceita bytes que não são imagem e sem enviar original para edição', async () => {
 const requisicao = vi.fn(async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'bmFvLWUtaW1hZ2Vt' } }] } }] }) }));
 vi.stubGlobal('fetch', requisicao);
 const resposta = await POST(new Request('http://localhost/api/adaptacoes/imagem', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-ai-provider': 'gemini', 'x-user-ai-key': 'fake-audit-key' }, body: JSON.stringify({ descricaoApoio: 'Três maçãs', imagemOriginal: ANTIGA }) }));
 expect(resposta.status).toBe(200);
 expect((await resposta.json()).sucesso).toBe(true);
 const enviado = JSON.parse(requisicao.mock.calls[0][1].body);
 expect(enviado.contents[0].parts).toHaveLength(1);
 expect(enviado.contents[0].parts[0].inlineData).toBeUndefined();
});
it('fallback descarta descrição corretiva e restrições de acessibilidade', () => {
 const prompt = Builder.montarPromptFallback({ apoioVisualPromptIngles: 'five apples', apoioVisualDescricao: 'EXATAMENTE três maçãs', necessidades: ['baixa_visao'] });
 expect(prompt).toContain('five apples');
 expect(prompt).not.toContain('três');
 expect(prompt).not.toContain('contornos');
});
it('validação de carregamento aceita imagem 1x1 sem verificar resolução', async () => {
 const imagem = { naturalWidth: 1, naturalHeight: 1, set src(valor) { queueMicrotask(() => this.onload()); } };
 await expect(Builder.carregarImagemComTimeout(NOVA, { criarImagem: () => imagem })).resolves.toBe(NOVA);
});
