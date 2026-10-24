/** Leitura local isolada do extrator textual compartilhado. */
export const LIMITE_IMAGEM = 7 * 1024 * 1024;
export async function inspecionarImagemLocal(imagemUrl) {
  const imagem = new Image();
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Tempo excedido ao verificar imagem.")),
      15000,
    );
    imagem.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    imagem.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Arquivo de imagem inválido."));
    };
    imagem.src = imagemUrl;
  });
  if (
    imagem.naturalWidth < 256 ||
    imagem.naturalHeight < 256 ||
    imagem.naturalWidth * imagem.naturalHeight > 25000000
  )
    throw new Error(
      "Use imagem de pelo menos 256 × 256 pixels e até 25 megapixels.",
    );
  return {
    width: imagem.naturalWidth,
    height: imagem.naturalHeight,
    mime: imagemUrl.match(/^data:([^;,]+)/)?.[1] || "image/png",
  };
}
export function lerDataUrl(file) {
  if (
    file.size > LIMITE_IMAGEM ||
    !["image/png", "image/jpeg", "image/webp"].includes(file.type)
  )
    throw new Error("Use PNG, JPG ou WebP de até 7 MB.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Falha ao ler imagem."));
    reader.readAsDataURL(file);
  });
}
export async function obterPixelsReferencia(url, signal) {
  if (url?.startsWith("data:")) return url;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Não foi possível carregar a referência salva.");
  const blob = await res.blob();
  return lerDataUrl(blob);
}
export async function aguardarImagens(elemento) {
  for (const img of elemento?.querySelectorAll("img") || []) {
    if (!img.complete || !img.naturalWidth) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          limpar();
          reject(new Error("Imagem não carregou. Confira antes de imprimir."));
        }, 15000);
        const limpar = () => {
          clearTimeout(timer);
          img.removeEventListener("load", ok);
          img.removeEventListener("error", erro);
        };
        const ok = () => {
          limpar();
          resolve();
        };
        const erro = () => {
          limpar();
          reject(new Error("Imagem indisponível para impressão."));
        };
        img.addEventListener("load", ok, { once: true });
        img.addEventListener("error", erro, { once: true });
      });
    }
    if (img.decode) await img.decode();
  }
}
