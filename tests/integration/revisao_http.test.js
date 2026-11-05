import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarHandlerRevisao } from '../../frontend/src/infraestrutura/revisao/httpServidor.js';
import { criarAcessoRevisao } from '../../frontend/src/infraestrutura/revisao/acessoServidor.js';

const professor = { tipo: 'professor', uid: 'docente', authTime: 1700000000 };
const aluno = { tipo: 'aluno', loginKey: 'a'.repeat(64) };
const origin = 'https://rotina.example';
const erro = status => Object.assign(new Error('segredo /caminho/privado token'), { status });
function montar(ator = professor) {
  const service = Object.fromEntries(['catalogo', 'questao', 'aprovar', 'criar', 'entrar', 'estado', 'comandar', 'responder', 'autorizarSala'].map(m => [m, vi.fn().mockResolvedValue({ sucesso: true })]));
  service.assinar = vi.fn().mockResolvedValue({ fechar: vi.fn(), emitir: vi.fn() });
  const autenticar = vi.fn().mockResolvedValue(ator);
  const autorizarMidia = vi.fn().mockResolvedValue(professor);
  const lerImagemAcervo = vi.fn().mockResolvedValue({ buffer: Buffer.from([1, 2, 3]), mime: 'image/png' });
  const emitirCookieMidia = vi.fn().mockReturnValue('revisao_midia=assinado; HttpOnly; Path=/api/revisao/');
  const handler = criarHandlerRevisao({ service, autenticar, autorizarMidia, lerImagemAcervo, emitirCookieMidia });
  return { handler, service, autenticar, autorizarMidia, lerImagemAcervo, emitirCookieMidia };
}
function req(caminho, { method = 'GET', body, headers = {}, signal } = {}) {
  return new Request(origin + '/api/revisao/' + caminho, { method, signal, headers, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) });
}
const call = (handler, caminho, opcoes) => handler(req(caminho, opcoes), { params: Promise.resolve({ partes: caminho.split('/') }) });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('RV-INT-02 — autenticação docente e cookie dedicado de mídia', () => {
  function acesso(opcoes = {}) {
    const auth = { verifyIdToken: vi.fn().mockResolvedValue({ uid: 'docente', auth_time: 1700000000 }), getUser: vi.fn().mockResolvedValue({ disabled: false, tokensValidAfterTime: new Date(1699999999000).toISOString() }) };
    const lerSessao = vi.fn().mockReturnValue({ loginKey: aluno.loginKey });
    const verificarToken = vi.fn().mockReturnValue({ finalidade: 'revisao_midia', professorUid: 'docente', authTime: 1700000000, emitidoEm: 1800000000000, validadeMs: 1800000 });
    const assinarToken = vi.fn().mockReturnValue('assinado');
    return { auth, lerSessao, verificarToken, assinarToken, ...criarAcessoRevisao({ obterAuth: () => auth, lerSessao, verificarToken, assinarToken, agora: () => 1800000000000, producao: true, ...opcoes }) };
  }
  it('valida Bearer com revogação e não aceita identidade declarada pelo cliente', async () => {
    const a = acesso();
    expect(await a.autenticar(req('catalogo', { headers: { Authorization: 'Bearer id-token' } }))).toEqual(professor);
    expect(a.auth.verifyIdToken).toHaveBeenCalledWith('id-token', true);
    expect(a.lerSessao).not.toHaveBeenCalled();
  });
  it('Authorization inválida não cai para cookie discente válido', async () => {
    const a = acesso(); a.auth.verifyIdToken.mockRejectedValue(new Error('token inválido'));
    await expect(a.autenticar(req('catalogo', { headers: { Authorization: 'Bearer errado' } }))).rejects.toMatchObject({ status: 401 });
    expect(a.lerSessao).not.toHaveBeenCalled();
    await expect(a.autenticar(req('catalogo', { headers: { Authorization: 'Basic senha' } }))).rejects.toMatchObject({ status: 401 });
  });
  it('usa somente loginKey assinado do Portal e rejeita chave com caminho', async () => {
    const a = acesso(); expect(await a.autenticar(req('salas/ARTE42'))).toEqual(aluno);
    a.lerSessao.mockReturnValue({ loginKey: '../outra' });
    await expect(a.autenticar(req('salas/ARTE42'))).rejects.toMatchObject({ status: 401 });
  });
  it('emite mídia com finalidade, validade 30min e atributos restritos', async () => {
    const a = acesso(); const cookie = await a.emitirCookieMidia(professor);
    expect(a.assinarToken).toHaveBeenCalledWith(expect.objectContaining({ finalidade: 'revisao_midia', professorUid: 'docente', authTime: 1700000000, validadeMs: 1800000, emitidoEm: 1800000000000 }));
    for (const parte of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/api/revisao/', 'Max-Age=1800']) expect(cookie).toContain(parte);
    expect(await a.emitirCookieMidia(aluno)).toBeNull();
  });
  it('cookie de mídia só autoriza imagens, verifica usuário e revogação', async () => {
    const a = acesso(); const request = req('questoes/q/imagens/i', { headers: { cookie: 'revisao_midia=assinado' } });
    expect(await a.autorizarMidia(request)).toEqual(professor);
    expect(a.auth.getUser).toHaveBeenCalledWith('docente');
    a.lerSessao.mockReturnValue(null);
    await expect(a.autenticar(request)).rejects.toMatchObject({ status: 401 });
    a.auth.getUser.mockResolvedValue({ disabled: true });
    await expect(a.autorizarMidia(request)).rejects.toMatchObject({ status: 401 });
  });
  it.each([
    { finalidade: 'aluno' }, { emitidoEm: 1799998000000 }, { emitidoEm: 1800000000001 }, { validadeMs: 604800000 }, { authTime: null },
  ])('recusa cookie mídia inválido: %j', async alteracao => {
    const a = acesso(); const base = a.verificarToken(); a.verificarToken.mockReturnValue({ ...base, ...alteracao });
    await expect(a.autorizarMidia(req('questoes/q/imagens/i', { headers: { cookie: 'revisao_midia=assinado' } }))).rejects.toMatchObject({ status: 401 });
  });
  it('revoga cookie de mídia se tokensValidAfterTime avançou', async () => {
    const a = acesso(); a.auth.getUser.mockResolvedValue({ tokensValidAfterTime: new Date(1700000001000).toISOString() });
    await expect(a.autorizarMidia(req('questoes/q/imagens/i', { headers: { cookie: 'revisao_midia=assinado' } }))).rejects.toMatchObject({ status: 401 });
  });
});

describe('RV-INT — transporte privado HTTP', () => {
  it('lista catálogo e renova cookie docente sem cache', async () => {
    const m = montar(); m.service.catalogo.mockResolvedValue([{ id: 'q' }]);
    const r = await call(m.handler, 'catalogo');
    expect(await r.json()).toEqual([{ id: 'q' }]); expect(m.service.catalogo).toHaveBeenCalledWith(professor);
    expect(r.headers.get('cache-control')).toBe('private, no-store');
    expect(r.headers.get('set-cookie')).toContain('revisao_midia=');
  });
  it.each(['catalogo', 'questoes/enem-2024-teste'])('nega endpoint docente a aluno: %s', async caminho => {
    const m = montar(aluno); expect((await call(m.handler, caminho)).status).toBe(403);
  });
  it('passa somente seleção e identidade autenticada ao criar sala', async () => {
    const m = montar(); const selecao = { titulo: 'Arte', turmaIds: ['t1'], questaoIds: ['q1'] };
    const r = await call(m.handler, 'salas', { method: 'POST', headers: { Authorization: 'Bearer token' }, body: { selecao, uid: 'invasor' } });
    expect(r.status).toBe(200); expect(m.service.criar).toHaveBeenCalledWith(professor, selecao);
  });
  it('despacha detalhe, aprovação, estado, entrada, comando e resposta', async () => {
    const m = montar(); const headers = { Origin: origin, Authorization: 'Bearer token' };
    await call(m.handler, 'questoes/enem-2024-teste'); expect(m.service.questao).toHaveBeenCalledWith(professor, 'enem-2024-teste');
    const aprovacao = { hashFonte: 'abc', confirmacoes: {}, ajustes: {} };
    await call(m.handler, 'questoes/enem-2024-teste/aprovar', { method: 'POST', headers, body: aprovacao });
    expect(m.service.aprovar).toHaveBeenCalledWith(professor, 'enem-2024-teste', aprovacao);
    await call(m.handler, 'salas/ARTE42'); expect(m.service.estado).toHaveBeenCalledWith(professor, 'ARTE42');
    await call(m.handler, 'salas/ARTE42/entrar', { method: 'POST', headers, body: {} }); expect(m.service.entrar).toHaveBeenCalledWith(professor, 'ARTE42');
    const comando = { acao: 'mostrar_conteudo', revisao: 1, rodadaId: 'r1' };
    await call(m.handler, 'salas/ARTE42/comandos', { method: 'POST', headers, body: comando }); expect(m.service.comandar).toHaveBeenCalledWith(professor, 'ARTE42', comando);
    const resposta = { rodadaId: 'r1', alternativa: 'A' };
    await call(m.handler, 'salas/ARTE42/respostas', { method: 'POST', headers, body: resposta }); expect(m.service.responder).toHaveBeenCalledWith(professor, 'ARTE42', resposta);
  });
  it.each([undefined, 'https://evil.example', 'null'])('exige Origin correto nas mutações discente: %s', async Origin => {
    const m = montar(aluno); const r = await call(m.handler, 'salas/ARTE42/respostas', { method: 'POST', body: { alternativa: 'A' }, headers: Origin ? { Origin } : {} });
    expect(r.status).toBe(403); expect(m.service.responder).not.toHaveBeenCalled();
  });
  it('aceita cookie discente com Origin correto; Bearer não aceita Origin externo', async () => {
    const m = montar(aluno); expect((await call(m.handler, 'salas/ARTE42/respostas', { method: 'POST', body: { alternativa: 'A' }, headers: { Origin: origin } })).status).toBe(200);
    const p = montar(); expect((await call(p.handler, 'salas', { method: 'POST', body: {}, headers: { Authorization: 'Bearer token', Origin: 'https://evil.example' } })).status).toBe(403);
  });
  it('rejeita JSON inválido, corpo maior que 64KB e métodos/rotas desconhecidos', async () => {
    const m = montar(); const headers = { Authorization: 'Bearer token' };
    expect((await call(m.handler, 'salas', { method: 'POST', headers, body: '{' })).status).toBe(400);
    expect((await call(m.handler, 'salas', { method: 'POST', headers, body: 'x'.repeat(65537) })).status).toBe(413);
    expect((await call(m.handler, 'desconhecida')).status).toBe(404);
    expect((await call(m.handler, 'catalogo', { method: 'DELETE' })).status).toBe(405);
  });
  it('falha segura não revela mensagem interna e mantém no-store', async () => {
    const m = montar(); m.service.catalogo.mockRejectedValue(erro(503)); const r = await call(m.handler, 'catalogo');
    expect(r.status).toBe(503); expect(JSON.stringify(await r.json())).not.toContain('segredo'); expect(r.headers.get('cache-control')).toBe('private, no-store');
  });
  it('mede bytes do corpo sem confiar em Content-Length declarado', async () => {
    const m = montar();
    const request = new Request(origin + '/api/revisao/salas', {
      method: 'POST', headers: { Authorization: 'Bearer token', 'Content-Length': '1' }, duplex: 'half',
      body: new ReadableStream({ start(controller) {
        controller.enqueue(new TextEncoder().encode('{"selecao":"' + 'á'.repeat(33000) + '"}')); controller.close();
      } }),
    });
    const r = await m.handler(request, { params: { partes: ['salas'] } });
    expect(r.status).toBe(413); expect(m.service.criar).not.toHaveBeenCalled();
  });
  it('nega imagens a identidade ausente e a cookie discente no endpoint docente', async () => {
    const m = montar(); m.autorizarMidia.mockRejectedValue(erro(401));
    expect((await call(m.handler, 'questoes/enem-2024-teste/imagens/figura-1')).status).toBe(401);
    m.autorizarMidia.mockResolvedValue(aluno);
    expect((await call(m.handler, 'questoes/enem-2024-teste/imagens/figura-1')).status).toBe(403);
    expect(m.lerImagemAcervo).not.toHaveBeenCalled();
  });
  it('serve imagem docente com cookie dedicado e bytes/MIME originais', async () => {
    const m = montar(); const r = await call(m.handler, 'questoes/enem-2024-teste/imagens/figura-1');
    expect(m.autorizarMidia).toHaveBeenCalledOnce(); expect(m.autenticar).not.toHaveBeenCalled();
    expect(m.lerImagemAcervo).toHaveBeenCalledWith('enem-2024-teste', 'figura-1');
    expect(r.headers.get('content-type')).toBe('image/png'); expect(r.headers.get('x-content-type-options')).toBe('nosniff');
    expect(Buffer.from(await r.arrayBuffer())).toEqual(Buffer.from([1, 2, 3]));
  });
  it('imagem de sala exige questão/figura projetada, restringindo conteúdo aos blocos autorizados', async () => {
    const m = montar(aluno); m.autorizarMidia.mockResolvedValue(aluno);
    const estado = { fase: 'pergunta', rodada: { questao: { id: 'enem-2024-teste', imagens: [{ id: 'figura-1' }, { id: 'figura-2' }] }, conteudo: [{ tipo: 'imagem', imagemId: 'figura-1' }] } };
    m.service.estado.mockResolvedValue({ estado });
    expect((await call(m.handler, 'salas/ARTE42/imagens/enem-2024-teste/figura-2')).status).toBe(200);
    expect((await call(m.handler, 'salas/ARTE42/imagens/enem-2024-futura/figura-1')).status).toBe(404);
    estado.fase = 'conteudo';
    expect((await call(m.handler, 'salas/ARTE42/imagens/enem-2024-teste/figura-2')).status).toBe(404);
    expect((await call(m.handler, 'salas/ARTE42/imagens/enem-2024-teste/figura-1')).status).toBe(200);
    estado.fase = 'espera';
    expect((await call(m.handler, 'salas/ARTE42/imagens/enem-2024-teste/figura-1')).status).toBe(404);
  });
});

describe('RV-INT-05 — stream autenticado e limpeza', () => {
  it('emite estado SSE, heartbeat, revalida sessão/vínculo e libera assinatura no abort', async () => {
    vi.useFakeTimers(); const m = montar(); const fechar = vi.fn(), emitir = vi.fn();
    let publicar; m.service.assinar.mockImplementation(async (_ator, _codigo, onEstado) => { publicar = onEstado; return { fechar, emitir }; });
    const abort = new AbortController();
    const r = await call(m.handler, 'salas/ARTE42/eventos', { signal: abort.signal });
    expect(r.headers.get('content-type')).toContain('text/event-stream'); expect(r.headers.get('x-accel-buffering')).toBe('no');
    const reader = r.body.getReader(); await Promise.resolve(); publicar({ estado: { fase: 'espera' }, envio: null });
    expect(new TextDecoder().decode((await reader.read()).value)).toContain('event: estado\ndata: {"estado":{"fase":"espera"},"envio":null}');
    await vi.advanceTimersByTimeAsync(30000); expect(emitir).toHaveBeenCalledTimes(2); expect(m.autenticar).toHaveBeenCalledTimes(2); expect(m.service.autorizarSala).toHaveBeenCalledTimes(2);
    abort.abort(); expect(fechar).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
    await reader.cancel();
  });
  it('cancela durante setup assíncrono e fecha assinatura assim que ela chega', async () => {
    vi.useFakeTimers(); const m = montar(); let concluir; const fechar = vi.fn();
    m.service.assinar.mockImplementation(() => new Promise(resolve => { concluir = resolve; }));
    const r = await call(m.handler, 'salas/ARTE42/eventos');
    await r.body.cancel(); concluir({ fechar, emitir: vi.fn() }); await Promise.resolve(); await Promise.resolve();
    expect(fechar).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  });
  it('abort antes do setup não abre assinatura nem mantém timers', async () => {
    vi.useFakeTimers(); const m = montar(); const abort = new AbortController(); abort.abort();
    const r = await call(m.handler, 'salas/ARTE42/eventos', { signal: abort.signal });
    await Promise.resolve(); expect(m.service.assinar).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
    expect((await r.body.getReader().read()).done).toBe(true);
  });
  it('fecha stream em 240s e em revogação, sem conteúdo de erro privado', async () => {
    vi.useFakeTimers(); const m = montar(); const fechar = vi.fn(); m.service.assinar.mockResolvedValue({ fechar, emitir: vi.fn() });
    const r = await call(m.handler, 'salas/ARTE42/eventos'); await Promise.resolve();
    await vi.advanceTimersByTimeAsync(240000); expect(fechar).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0); await r.body.cancel();
    const n = montar(); n.service.assinar.mockResolvedValue({ fechar: vi.fn(), emitir: vi.fn() });
    const s = await call(n.handler, 'salas/ARTE42/eventos'); const reader = s.body.getReader(); n.autenticar.mockRejectedValue(erro(401));
    await vi.advanceTimersByTimeAsync(30000);
    const texto = new TextDecoder().decode((await reader.read()).value); expect(texto).toContain('event: erro'); expect(texto).toContain('"status":401'); expect(texto).not.toContain('segredo'); expect(vi.getTimerCount()).toBe(0); await reader.cancel();
  });
});
