// Motor de áudio unificado da Aula Gamificada para os 7 jogos.
// Suporta MP3 locais + síntese musical Web Audio multi-voz, ducking, persistência de preferências,
// detecção honesta de bloqueio de autoplay, suspensão em aba oculta e cleanup determinístico.

const STORAGE_KEY = 'ag_audio_prefs_v1';

export const PERFIS_SONOROS_JOGO = {
  herois: {
    mp3: '/aula-gamificada/herois/trilha-herois.mp3',
    tempoMs: 420,
    onda: 'triangle',
    notasEspera: [261.63, 329.63, 392.0, 523.25],
    notasDesafio: [293.66, 349.23, 440.0, 587.33, 440.0],
    notasFinal: [392.0, 493.88, 587.33, 783.99],
  },
  tabuleiro: {
    mp3: '/aula-gamificada/tabuleiro/trilha-tabuleiro.mp3',
    tempoMs: 480,
    onda: 'sine',
    notasEspera: [261.63, 293.66, 329.63, 392.0],
    notasDesafio: [329.63, 392.0, 440.0, 523.25],
    notasFinal: [392.0, 523.25, 659.25, 783.99],
  },
  quiz: {
    mp3: null,
    tempoMs: 360,
    onda: 'triangle',
    notasEspera: [220.0, 277.18, 329.63, 440.0],
    notasDesafio: [329.63, 392.0, 493.88, 659.25],
    notasFinal: [440.0, 554.37, 659.25, 880.0],
  },
  memoria: {
    mp3: null,
    tempoMs: 520,
    onda: 'sine',
    notasEspera: [293.66, 349.23, 440.0, 523.25],
    notasDesafio: [349.23, 440.0, 523.25, 659.25],
    notasFinal: [523.25, 659.25, 783.99, 1046.5],
  },
  associacao: {
    mp3: null,
    tempoMs: 450,
    onda: 'triangle',
    notasEspera: [246.94, 329.63, 392.0, 493.88],
    notasDesafio: [293.66, 392.0, 493.88, 587.33],
    notasFinal: [392.0, 493.88, 659.25, 783.99],
  },
  ordenacao: {
    mp3: null,
    tempoMs: 390,
    onda: 'sine',
    notasEspera: [261.63, 329.63, 392.0, 440.0],
    notasDesafio: [261.63, 329.63, 392.0, 523.25, 659.25],
    notasFinal: [523.25, 587.33, 659.25, 783.99],
  },
  equipes: {
    mp3: null,
    tempoMs: 380,
    onda: 'triangle',
    notasEspera: [220.0, 261.63, 329.63, 392.0],
    notasDesafio: [293.66, 392.0, 440.0, 587.33],
    notasFinal: [392.0, 523.25, 659.25, 783.99],
  },
};

const EFEITOS_SEQUENCIAS = {
  abertura: { notas: [392, 523.25, 659.25], duracao: 0.11, tipo: 'triangle' },
  resposta_recebida: { notas: [523.25, 659.25], duracao: 0.08, tipo: 'sine' },
  ultimos_segundos: { notas: [698.46, 587.33], duracao: 0.09, tipo: 'triangle' },
  acerto: { notas: [523.25, 659.25, 783.99, 1046.5], duracao: 0.12, tipo: 'triangle' },
  erro: { notas: [329.63, 277.18], duracao: 0.16, tipo: 'sine' },
  parcial: { notas: [440.0, 523.25], duracao: 0.12, tipo: 'triangle' },
  sem_resposta: { notas: [392.0], duracao: 0.08, tipo: 'sine' },
  revelacao_neutra: { notas: [392.0, 493.88, 587.33], duracao: 0.12, tipo: 'triangle' },
  nova_tentativa: { notas: [349.23, 440.0, 523.25], duracao: 0.11, tipo: 'triangle' },
  ranking: { notas: [440, 554.37, 659.25, 880], duracao: 0.13, tipo: 'triangle' },
  vitoria: { notas: [523.25, 659.25, 783.99, 1046.5, 1318.5], duracao: 0.15, tipo: 'triangle' },
};

export function lerPreferenciasAudio(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  try {
    const bruto = storage?.getItem?.(STORAGE_KEY);
    if (!bruto) return null;
    const p = JSON.parse(bruto);
    return {
      somAtivo: typeof p.somAtivo === 'boolean' ? p.somAtivo : true,
      musicaAtiva: typeof p.musicaAtiva === 'boolean' ? p.musicaAtiva : true,
      efeitosAtivos: typeof p.efeitosAtivos === 'boolean' ? p.efeitosAtivos : true,
      volume: Number.isFinite(Number(p.volume)) ? Math.max(0, Math.min(1, Number(p.volume))) : 0.45,
    };
  } catch {
    return null;
  }
}

export class MotorAudioJogo {
  constructor({ storage, criarAudio, criarAudioContext } = {}) {
    this.storage = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    this.criarAudio =
      criarAudio ??
      ((src) => {
        if (typeof Audio === 'undefined') return null;
        const a = new Audio(src);
        a.loop = true;
        a.preload = 'none';
        return a;
      });
    this.criarAudioContext =
      criarAudioContext ??
      (() => {
        if (typeof window === 'undefined') return null;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        return Ctx ? new Ctx() : null;
      });

    const salvo = lerPreferenciasAudio(this.storage);
    this.estado = {
      somAtivo: salvo ? salvo.somAtivo : true,
      musicaAtiva: salvo ? salvo.musicaAtiva : true,
      efeitosAtivos: salvo ? salvo.efeitosAtivos : true,
      volume: salvo ? salvo.volume : 0.45,
      bloqueadoAutoplay: false,
      oculto: false,
    };

    this.audioEl = null;
    this.mp3Atual = null;
    this.ctx = null;
    this.loopTimer = null;
    this.duckTimer = null;
    this.passoLoop = 0;
    this.modalidadeAtual = 'quiz';
    this.faseAtual = 'espera';
    this.ultimoAlarmeMs = 0;
    this.ouvintes = new Set();
    this.destruido = false;
  }

  assinar(fn) {
    this.ouvintes.add(fn);
    return () => this.ouvintes.delete(fn);
  }

  notificar() {
    const copia = { ...this.estado };
    for (const fn of this.ouvintes) fn(copia);
  }

  obterEstado() {
    return { ...this.estado };
  }

  salvarPreferencias() {
    try {
      this.storage?.setItem?.(
        STORAGE_KEY,
        JSON.stringify({
          somAtivo: this.estado.somAtivo,
          musicaAtiva: this.estado.musicaAtiva,
          efeitosAtivos: this.estado.efeitosAtivos,
          volume: this.estado.volume,
        }),
      );
    } catch {
      // Storage indisponível
    }
  }

  definirSomAtivo(ativo) {
    this.estado.somAtivo = Boolean(ativo);
    this.salvarPreferencias();
    if (!this.estado.somAtivo) {
      this.pararMusica();
    } else {
      this.sincronizarTrilha({ modalidade: this.modalidadeAtual, fase: this.faseAtual });
    }
    this.notificar();
  }

  definirMusicaAtiva(ativa) {
    this.estado.musicaAtiva = Boolean(ativa);
    this.salvarPreferencias();
    if (!this.estado.musicaAtiva) this.pararMusica();
    else this.sincronizarTrilha({ modalidade: this.modalidadeAtual, fase: this.faseAtual });
    this.notificar();
  }

  definirEfeitosAtivos(ativos) {
    this.estado.efeitosAtivos = Boolean(ativos);
    this.salvarPreferencias();
    this.notificar();
  }

  definirVolume(vol) {
    const v = Math.max(0, Math.min(1, Number(vol) || 0));
    this.estado.volume = v;
    if (this.audioEl) this.audioEl.volume = v;
    this.salvarPreferencias();
    this.notificar();
  }

  definirOculto(oculto) {
    this.estado.oculto = Boolean(oculto);
    if (this.estado.oculto) {
      this.pararMusica();
    } else if (this.estado.somAtivo && this.estado.musicaAtiva && !this.estado.bloqueadoAutoplay) {
      this.sincronizarTrilha({ modalidade: this.modalidadeAtual, fase: this.faseAtual });
    }
    this.notificar();
  }

  pararMusica() {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    try {
      this.audioEl?.pause?.();
    } catch {}
  }

  garantirContexto() {
    if (!this.ctx) {
      try {
        this.ctx = this.criarAudioContext();
      } catch {
        this.ctx = null;
      }
    }
    return this.ctx;
  }

  async sincronizarTrilha({ modalidade = 'quiz', fase = 'espera' } = {}) {
    if (this.destruido) return;
    const trocouModo = this.modalidadeAtual !== modalidade || this.faseAtual !== fase;
    this.modalidadeAtual = modalidade;
    this.faseAtual = fase;

    if (!this.estado.somAtivo || !this.estado.musicaAtiva || this.estado.oculto) {
      this.pararMusica();
      return;
    }

    const perfil = PERFIS_SONOROS_JOGO[modalidade] || PERFIS_SONOROS_JOGO.quiz;
    if (perfil.mp3) {
      if (!this.audioEl || this.mp3Atual !== perfil.mp3) {
        this.pararMusica();
        this.audioEl = this.criarAudio(perfil.mp3);
        this.mp3Atual = perfil.mp3;
      }
      if (this.audioEl) {
        this.audioEl.loop = true;
        this.audioEl.volume = this.estado.volume;
        try {
          const prom = this.audioEl.play?.();
          if (prom && typeof prom.then === 'function') {
            await prom;
          }
          if (this.estado.bloqueadoAutoplay) {
            this.estado.bloqueadoAutoplay = false;
            this.notificar();
          }
          return;
        } catch (err) {
          if (err?.name === 'NotAllowedError' || /autoplay|allowed|interact/i.test(String(err?.message))) {
            this.estado.bloqueadoAutoplay = true;
            this.notificar();
            return;
          }
        }
      }
    } else if (this.audioEl) {
      this.audioEl.pause?.();
    }

    // Trilha Web Audio estruturada por fase para os modos sem MP3 (ou fallback de mídia)
    if (!this.loopTimer || trocouModo) {
      this.iniciarLoopSintetico(perfil, fase);
    }
  }

  iniciarLoopSintetico(perfil, fase) {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    const ctx = this.garantirContexto();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      this.estado.bloqueadoAutoplay = true;
      this.notificar();
      if (typeof ctx.resume === 'function') {
        ctx
          .resume()
          .then(() => {
            if (ctx.state !== 'suspended' && this.estado.bloqueadoAutoplay) {
              this.estado.bloqueadoAutoplay = false;
              this.notificar();
            }
          })
          .catch(() => {
            this.estado.bloqueadoAutoplay = true;
            this.notificar();
          });
      }
    }
    const notas =
      fase === 'espera'
        ? perfil.notasEspera
        : fase === 'encerrada' || fase === 'ranking'
          ? perfil.notasFinal
          : perfil.notasDesafio;

    this.fatorDuckSintetico = 1;
    this.loopTimer = setInterval(() => {
      if (!this.estado.somAtivo || !this.estado.musicaAtiva || this.estado.oculto || this.destruido) return;
      if (ctx.state === 'suspended' || this.estado.volume <= 0) return;
      const idx = this.passoLoop % notas.length;
      const freq = notas[idx];
      this.passoLoop += 1;
      const dur = (perfil.tempoMs / 1000) * 0.72;
      const ganhoMelodia = this.estado.volume * 0.14 * (this.fatorDuckSintetico ?? 1);
      this.tocarNota(ctx, freq, dur, perfil.onda, ganhoMelodia);
      // Segunda voz harmônica/baixo nos tempos fortes para textura multi-voz por modalidade
      if (idx % 2 === 0) {
        const baixoFreq = freq * 0.5;
        this.tocarNota(ctx, baixoFreq, dur * 1.4, 'sine', ganhoMelodia * 0.65);
      }
    }, perfil.tempoMs);
  }

  tocarNota(ctx, freq, duracao, tipo = 'triangle', ganho = 0.15, atraso = 0) {
    if (this.estado.volume <= 0 || ganho <= 0) return;
    try {
      if (!ctx || typeof ctx.createOscillator !== 'function') return;
      const agora = ctx.currentTime + atraso;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tipo;
      osc.frequency.setValueAtTime(freq, agora);
      gain.gain.setValueAtTime(0.0001, agora);
      gain.gain.exponentialRampToValueAtTime(ganho, agora + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, agora + duracao);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(agora);
      osc.stop(agora + duracao + 0.03);
    } catch {}
  }

  tocarEfeito(situacao) {
    if (
      !this.estado.somAtivo ||
      !this.estado.efeitosAtivos ||
      this.estado.oculto ||
      this.estado.volume <= 0 ||
      this.destruido
    )
      return;
    if (situacao === 'ultimos_segundos') {
      const agora = Date.now();
      if (agora - this.ultimoAlarmeMs < 3000) return;
      this.ultimoAlarmeMs = agora;
    }
    const seq = EFEITOS_SEQUENCIAS[situacao];
    if (!seq) return;
    const ctx = this.garantirContexto();
    if (!ctx) return;

    // Ducking suave na trilha MP3 e no sintetizador durante o efeito (respeitando volume zero)
    this.fatorDuckSintetico = 0.35;
    if (this.audioEl && this.estado.musicaAtiva && this.estado.volume > 0) {
      const volBase = this.estado.volume;
      this.audioEl.volume = Math.min(volBase, Math.max(0, volBase * 0.35));
    }
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => {
      this.fatorDuckSintetico = 1;
      if (this.audioEl) this.audioEl.volume = this.estado.volume;
    }, 650);

    seq.notas.forEach((freq, i) => {
      this.tocarNota(ctx, freq, seq.duracao, seq.tipo, Math.min(0.4, this.estado.volume * 0.55), i * 0.085);
    });
  }

  async desbloquearPorGesto(contexto) {
    if (this.destruido) return;
    const ctx = this.garantirContexto();
    if (ctx?.state === 'suspended' && typeof ctx.resume === 'function') {
      try {
        await ctx.resume();
      } catch {}
    }
    this.estado.bloqueadoAutoplay = false;
    this.notificar();
    await this.sincronizarTrilha(contexto || { modalidade: this.modalidadeAtual, fase: this.faseAtual });
  }

  destroy() {
    this.destruido = true;
    this.pararMusica();
    if (this.duckTimer) {
      clearTimeout(this.duckTimer);
      this.duckTimer = null;
    }
    try {
      this.audioEl?.removeAttribute?.('src');
      this.audioEl?.load?.();
    } catch {}
    this.audioEl = null;
    try {
      this.ctx?.close?.();
    } catch {}
    this.ctx = null;
    this.ouvintes.clear();
  }
}
