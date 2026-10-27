/**
 * Redução da cópia de imagem enviada à IA (RN-77).
 *
 * Nunca substitui a imagem guardada na atividade: gera um JPEG menor só para a
 * chamada de correção. Sem DOM (SSR/testes) devolve `null` e o chamador decide
 * degradar sem imagem.
 */
const ESCALA_REDUCAO = [
  { maxWidth: 1280, quality: 0.72 },
  { maxWidth: 1024, quality: 0.62 },
  { maxWidth: 800, quality: 0.52 },
  { maxWidth: 640, quality: 0.45 },
];

function carregarImagem(url) {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.crossOrigin = 'anonymous';
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error('Não foi possível ler a imagem para correção.'));
    imagem.src = url;
  });
}

function recodificar(imagem, maxWidth, quality) {
  const larguraOriginal = imagem.naturalWidth || imagem.width;
  const alturaOriginal = imagem.naturalHeight || imagem.height;
  if (!larguraOriginal || !alturaOriginal) throw new Error('Imagem sem dimensões.');

  const escala = Math.min(1, maxWidth / larguraOriginal);
  const largura = Math.max(1, Math.round(larguraOriginal * escala));
  const altura = Math.max(1, Math.round(alturaOriginal * escala));

  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const contexto = canvas.getContext('2d');
  if (!contexto) throw new Error('Canvas indisponível.');
  // JPEG não tem transparência: fundo branco evita áreas pretas em PNG.
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(0, 0, largura, altura);
  contexto.drawImage(imagem, 0, 0, largura, altura);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function reduzirImagemParaCorrecao(url, {
  alvo = 700_000,
  escalas = ESCALA_REDUCAO,
} = {}) {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null;
  if (!url || url.length <= alvo) return url;

  let imagem;
  try {
    imagem = await carregarImagem(url);
  } catch {
    return null;
  }

  for (const { maxWidth, quality } of escalas) {
    try {
      const dataUrl = recodificar(imagem, maxWidth, quality);
      if (dataUrl && dataUrl.length <= alvo) return dataUrl;
    } catch {
      return null;
    }
  }
  return null;
}
