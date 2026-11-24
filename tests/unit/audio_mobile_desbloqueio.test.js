import { afterEach, describe, expect, it, vi } from 'vitest';
import { MotorAudioJogo } from '@/components/aula-gamificada/audiovisual/motorAudioJogo';
const motores = [];
function preparar(state, resume) {
  const ctx = { state, resume: vi.fn(resume), close: vi.fn(), currentTime: 0 };
  const play = vi.fn(() => Promise.resolve());
  const motor = new MotorAudioJogo({ storage: { getItem: () => null }, criarAudioContext: () => ctx,
    criarAudio: () => ({ play, pause() {}, removeAttribute() {}, load() {} }) });
  motores.push(motor);
  return { ctx, play, motor };
}
afterEach(() => { motores.splice(0).forEach(m => m.destroy()); });
describe('áudio móvel: desbloqueio real e interrupção do iPhone', () => {
  it('retoma o estado interrupted no gesto', async () => {
    const { motor, ctx } = preparar('interrupted', async () => { ctx.state = 'running'; });
    await motor.desbloquearPorGesto({ modalidade: 'plataforma', fase: 'desafio' });
    expect(ctx.resume).toHaveBeenCalled();
    expect(motor.obterEstado().bloqueadoAutoplay).toBe(false);
  });
  it('não informa desbloqueio quando resume falha', async () => {
    const { motor } = preparar('suspended', () => Promise.reject(new Error('Bloqueado')));
    await motor.desbloquearPorGesto({ modalidade: 'plataforma', fase: 'desafio' });
    expect(motor.obterEstado().bloqueadoAutoplay).toBe(true);
  });
  it('inicia play dentro do gesto sem aguardar resume', async () => {
    let liberar;
    const { motor, play, ctx } = preparar('suspended', () => new Promise(resolve => { liberar = resolve; }));
    const pedido = motor.desbloquearPorGesto({ modalidade: 'herois', fase: 'desafio' });
    const chamadasNoGesto = play.mock.calls.length;
    ctx.state = 'running'; liberar(); await pedido;
    expect(chamadasNoGesto).toBe(1);
  });
  it('mostra bloqueio quando o iPhone interrompe um contexto ativo', async () => {
    const { motor, ctx } = preparar('running');
    await motor.desbloquearPorGesto({ modalidade: 'plataforma', fase: 'desafio' });
    ctx.state = 'interrupted'; ctx.onstatechange?.();
    expect(motor.obterEstado().bloqueadoAutoplay).toBe(true);
  });
});
