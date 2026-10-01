import { describe, it, expect } from 'vitest';
import { ImagemPedagogicaBuilder } from '../../frontend/src/dominio/adaptacoes/ImagemPedagogicaBuilder';

const builder = ImagemPedagogicaBuilder;

describe('UT-42 (RN-39): Fidelidade e robustez das ilustrações de apoio', () => {
  describe('construirPrompt com disciplina e necessidades', () => {
    it('mantém as diretrizes base DUA mesmo sem disciplina/necessidades', () => {
      const prompt = builder.construirPrompt({ descricaoApoio: 'Fases da lua' });

      expect(prompt).toContain('Fases da lua');
      expect(prompt).toContain('traços limpos');
      expect(prompt).toContain('fundo claro');
      expect(prompt).toContain('alto contraste');
      expect(prompt).toContain('sem texto');
      expect(prompt).not.toContain('Disciplina:');
      expect(prompt).not.toContain('Diretrizes por necessidade');
    });

    it('incorpora a disciplina quando informada', () => {
      const prompt = builder.construirPrompt({
        descricaoApoio: 'Ciclo da água',
        disciplina: 'Ciências',
      });

      expect(prompt).toContain('Disciplina: Ciências');
      expect(prompt).toContain('Ciclo da água');
    });

    it('gera diretrizes específicas por categoria de necessidade', () => {
      const prompt = builder.construirPrompt({
        descricaoApoio: 'Esquema de uma célula',
        disciplina: 'Biologia',
        necessidades: ['baixa_visao', 'tea', 'tdah', 'di'],
      });

      expect(prompt).toContain('Diretrizes por necessidade');
      expect(prompt).toContain('alto contraste extremo');
      expect(prompt).toContain('contornos espessos');
      expect(prompt).toContain('estampas');
      expect(prompt).toContain('objeto central');
      expect(prompt).toContain('distratores');
      expect(prompt).toContain('concreta');
      expect(prompt).toContain('poucos elementos');
    });

    it('ignora necessidades desconhecidas sem quebrar e deduplica repetidas', () => {
      const prompt = builder.construirPrompt({
        descricaoApoio: 'Mapa do Brasil',
        necessidades: ['inexistente', 'tdah', 'tdah'],
      });

      expect(prompt).toContain('Mapa do Brasil');
      expect(prompt).toContain('objeto central');
      const ocorrencias = prompt.split('objeto central em destaque').length - 1;
      expect(ocorrencias).toBe(1);
      expect(prompt).not.toContain('inexistente');
    });

    it('aceita necessidades null/não-array sem lançar erro', () => {
      expect(() =>
        builder.construirPrompt({ descricaoApoio: 'Texto', necessidades: null })
      ).not.toThrow();
      expect(() =>
        builder.construirPrompt({ descricaoApoio: 'Texto', disciplina: null })
      ).not.toThrow();
    });
  });

  describe('montarPromptFallback (Pollinations)', () => {
    it('prioriza apoioVisualPromptIngles sobre descricao e enunciado', () => {
      const prompt = builder.montarPromptFallback({
        apoioVisualPromptIngles: 'solar system with labeled planets, flat design',
        apoioVisualDescricao: 'Sistema solar com planetas',
        enunciado: 'Qual é o maior planeta?',
      });

      expect(prompt).toContain('solar system with labeled planets, flat design');
      expect(prompt).not.toContain('Qual é o maior planeta');
      expect(prompt).toContain('educational illustration');
      expect(prompt).toContain('children style');
      expect(prompt).toContain('safe for school');
    });

    it('cai para apoioVisualDescricao quando não há prompt em inglês', () => {
      const prompt = builder.montarPromptFallback({
        apoioVisualDescricao: 'Duas turmas montando projeto juntas',
        enunciado: 'Explique a diferença.',
      });

      expect(prompt).toContain('Duas turmas montando projeto juntas');
      expect(prompt).not.toContain('Explique a diferença');
    });

    it('usa o enunciado como último recurso e valor padrão sem nada', () => {
      expect(builder.montarPromptFallback({ enunciado: 'Quanto é 2+2?' })).toContain(
        'Quanto é 2+2?'
      );
      expect(builder.montarPromptFallback({})).toContain('educational illustration');
      expect(builder.montarPromptFallback(null)).toContain('educational illustration');
    });
  });

  describe('montarUrlPollinations', () => {
    it('codifica o prompt na URL com dimensões padrão', () => {
      const url = builder.montarUrlPollinations('educational illustration, fotos do espaço');

      expect(url).toContain('https://image.pollinations.ai/prompt/');
      expect(url).toContain(encodeURIComponent('educational illustration, fotos do espaço'));
      expect(url).toContain('width=800');
      expect(url).toContain('height=400');
      expect(url).toContain('nologo=true');
    });

    it('aceita dimensões personalizadas', () => {
      const url = builder.montarUrlPollinations('árvore', { width: 640, height: 480 });

      expect(url).toContain('width=640');
      expect(url).toContain('height=480');
    });
  });

  describe('UT-43 (RN-39): montarUrlPollinationsFlux (serviço novo com chave)', () => {
    it('monta a URL gen.pollinations.ai com model=flux, dimensões e a chave', () => {
      const url = builder.montarUrlPollinationsFlux('educational illustration of a tree', {
        apiKey: 'sk-abc123',
      });

      expect(url).toContain('https://gen.pollinations.ai/image/');
      expect(url).toContain(encodeURIComponent('educational illustration of a tree'));
      expect(url).toContain('model=flux');
      expect(url).toContain('key=sk-abc123');
      expect(url).toContain('width=800');
      expect(url).toContain('height=400');
      expect(url).toContain('nologo=true');
    });

    it('codifica a chave na URL', () => {
      const url = builder.montarUrlPollinationsFlux('x', { apiKey: 'sk a+b' });

      expect(url).toContain(`key=${encodeURIComponent('sk a+b')}`);
      expect(url).not.toContain('sk a+b');
    });

    it('retorna null sem chave ou com chave vazia (chamador usa o legado)', () => {
      expect(builder.montarUrlPollinationsFlux('x', {})).toBeNull();
      expect(builder.montarUrlPollinationsFlux('x', { apiKey: '   ' })).toBeNull();
      expect(builder.montarUrlPollinationsFlux('x')).toBeNull();
    });
  });

  describe('carregarImagemComTimeout', () => {
    it('resolve quando a imagem carrega com sucesso', async () => {
      const fakeImagem = {};
      const criarImagem = () => fakeImagem;

      const promessa = builder.carregarImagemComTimeout('https://x/img.png', {
        criarImagem,
        timeoutMs: 1000,
      });

      fakeImagem.onload();
      await expect(promessa).resolves.toBe('https://x/img.png');
    });

    it('rejeita quando o navegador sinaliza erro no carregamento', async () => {
      const fakeImagem = {};
      const promessa = builder.carregarImagemComTimeout('https://x/quebrada.png', {
        criarImagem: () => fakeImagem,
        timeoutMs: 1000,
      });

      fakeImagem.onerror();
      await expect(promessa).rejects.toThrow(/falha ao carregar/i);
    });

    it('rejeita por timeout quando a imagem nunca carrega', async () => {
      const fakeImagem = {};

      const promessa = builder.carregarImagemComTimeout('https://x/lenta.png', {
        criarImagem: () => fakeImagem,
        timeoutMs: 5,
      });

      await expect(promessa).rejects.toThrow(/timeout/i);
      expect(fakeImagem.src).toBe('https://x/lenta.png');
    });
  });
});
