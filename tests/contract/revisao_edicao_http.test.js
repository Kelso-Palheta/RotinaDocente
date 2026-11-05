import { describe, expect, it, vi } from 'vitest';
import { criarHandlerRevisao } from '../../frontend/src/infraestrutura/revisao/httpServidor.js';

const professor = { tipo: 'professor', uid: 'docente', authTime: 1700000000 };
const aluno = { tipo: 'aluno', loginKey: 'a'.repeat(64) };
const origin = 'https://rotina.example';

function montarHttp(ator = professor) {
  const service = {
    obterEdicao: vi.fn().mockResolvedValue({
      codigo: 'ARTE42',
      revisao: 1,
      podeEditarTurmas: true,
      selecao: { titulo: 'Arte Aulão', turmaIds: ['t1'], questaoIds: ['q1'], duracaoSegundos: 30 },
    }),
    editar: vi.fn().mockResolvedValue({
      sala: { id: 'ARTE42', codigo: 'ARTE42', revisao: 2 },
    }),
  };
  const autenticar = vi.fn().mockResolvedValue(ator);
  const autorizarMidia = vi.fn().mockResolvedValue(ator);
  const emitirCookieMidia = vi.fn().mockReturnValue('revisao_midia=assinado');
  const handler = criarHandlerRevisao({
    service,
    autenticar,
    autorizarMidia,
    emitirCookieMidia,
  });
  return { handler, service, autenticar };
}

function req(caminho, { method = 'GET', body, headers = {} } = {}) {
  return new Request(origin + '/api/revisao/' + caminho, {
    method,
    headers: { origin, ...headers },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
}

const call = (handler, caminho, opcoes) =>
  handler(req(caminho, opcoes), { params: Promise.resolve({ partes: caminho.split('/') }) });

describe('Contrato HTTP — /api/revisao/salas/{codigo}/edicao', () => {
  it('GET /api/revisao/salas/{codigo}/edicao despacha para service.obterEdicao para professor', async () => {
    const { handler, service } = montarHttp(professor);
    const res = await call(handler, 'salas/ARTE42/edicao', { method: 'GET' });
    expect(res.status).toBe(200);
    expect(service.obterEdicao).toHaveBeenCalledWith(professor, 'ARTE42');
    const dados = await res.json();
    expect(dados.codigo).toBe('ARTE42');
    expect(dados.podeEditarTurmas).toBe(true);
  });

  it('GET /api/revisao/salas/{codigo}/edicao nega acesso a alunos com 403', async () => {
    const { handler, service } = montarHttp(aluno);
    const res = await call(handler, 'salas/ARTE42/edicao', { method: 'GET' });
    expect(res.status).toBe(403);
    expect(service.obterEdicao).not.toHaveBeenCalled();
  });

  it('POST /api/revisao/salas/{codigo}/edicao despacha para service.editar para professor', async () => {
    const { handler, service } = montarHttp(professor);
    const body = {
      selecao: { titulo: 'Atualizado', turmaIds: ['t1'], questaoIds: ['q1'], duracaoSegundos: 45 },
      revisaoEsperada: 1,
    };
    const res = await call(handler, 'salas/ARTE42/edicao', {
      method: 'POST',
      body,
    });
    expect(res.status).toBe(200);
    expect(service.editar).toHaveBeenCalledWith(professor, 'ARTE42', body);
    const dados = await res.json();
    expect(dados.sala.revisao).toBe(2);
  });

  it('POST /api/revisao/salas/{codigo}/edicao nega acesso a alunos com 403', async () => {
    const { handler, service } = montarHttp(aluno);
    const res = await call(handler, 'salas/ARTE42/edicao', {
      method: 'POST',
      body: { selecao: {}, revisaoEsperada: 1 },
    });
    expect(res.status).toBe(403);
    expect(service.editar).not.toHaveBeenCalled();
  });
});
