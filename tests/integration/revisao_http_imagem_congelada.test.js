import { describe, expect, it, vi } from 'vitest';
import { criarHandlerRevisao } from '../../frontend/src/infraestrutura/revisao/httpServidor.js';

function preparar(fase = 'pergunta') {
  const ator = { tipo: 'aluno', loginKey: 'a'.repeat(64) };
  const estado = { fase, rodada: { questao: { id: 'enem-2024-teste', imagens: [{ id: 'imagem-original' }] }, conteudo: [] } };
  const service = { estado: vi.fn().mockResolvedValue({ estado }), validarImagemSala: vi.fn().mockResolvedValue(true) };
  const lerImagemAcervo = vi.fn().mockResolvedValue({ buffer: Buffer.from([1, 2, 3]), mime: 'image/png' });
  const handler = criarHandlerRevisao({ service, autorizarMidia: async () => ator, lerImagemAcervo });
  const chamar = () => handler(new Request('https://rotina.example/api/revisao/salas/ARTE2345/imagens/enem-2024-teste/imagem-original'), { params: { partes: ['salas', 'ARTE2345', 'imagens', 'enem-2024-teste', 'imagem-original'] } });
  return { ator, service, lerImagemAcervo, chamar };
}

describe('RV-INT — imagem da fonte congelada por sala', () => {
  it('permite rever imagem na sala finalizada quando a questão permanece no DTO autorizado', async () => {
    const m = preparar('finalizada'); const r = await m.chamar();
    expect(r.status).toBe(200);
    expect(m.service.validarImagemSala).toHaveBeenCalledWith(m.ator, 'ARTE2345', 'enem-2024-teste', 'imagem-original');
    expect(m.lerImagemAcervo).toHaveBeenCalledOnce();
  });
  it('não lê bytes se o serviço detectar divergência entre fonte congelada e atual', async () => {
    const m = preparar(); m.service.validarImagemSala.mockRejectedValue(Object.assign(new Error('A imagem desta fonte mudou.'), { status: 409, publica: true }));
    const r = await m.chamar();
    expect(r.status).toBe(409); expect(m.lerImagemAcervo).not.toHaveBeenCalled();
  });
  it('valida integridade antes da leitura de bytes, sem substituir autorização da questão', async () => {
    const m = preparar(); const ordem = [];
    m.service.validarImagemSala.mockImplementation(async () => { ordem.push('validacao'); });
    m.lerImagemAcervo.mockImplementation(async () => { ordem.push('leitura'); return { buffer: Buffer.from([1]), mime: 'image/png' }; });
    expect((await m.chamar()).status).toBe(200); expect(ordem).toEqual(['validacao', 'leitura']);
  });
});
