/** RN-72: recursos binários fora do Firestore; aprovação vinculada ao conteúdo. */
import {
  assinaturaVisual,
  imagemAprovada,
  gerarDesenhoExato,
} from "@/dominio/adaptacoes/qualidadeVisual";
const LIMITE = 7 * 1024 * 1024;
const MAX_DOCUMENTO = 900 * 1024;
export function possuiVisualV2(valor) {
  if (!valor || typeof valor !== "object") return false;
  return (
    valor.visual?.versao === 2 || Object.values(valor).some(possuiVisualV2)
  );
}
async function enviarFirebase({ usuarioId, caminho, bytes, mime }) {
  const [
    { app },
    { getAuth },
    { getStorage, ref, uploadBytes, getDownloadURL },
  ] = await Promise.all([
    import("@/lib/firebase"),
    import("firebase/auth"),
    import("firebase/storage"),
  ]);
  if (getAuth(app).currentUser?.uid !== usuarioId)
    throw new Error("Faça login na conta do professor para salvar as imagens.");
  const arquivo = ref(getStorage(app), caminho);
  await uploadBytes(arquivo, bytes, {
    contentType: mime,
    cacheControl: "private,max-age=31536000,immutable",
  });
  return getDownloadURL(arquivo);
}
function lerRecurso(url, plano) {
  if (url.length > 10 * 1024 * 1024)
    throw new Error("Cada imagem deve ter até 7 MB.");
  const partes = /^data:([^;,]+)(;charset=utf-8)?(;base64)?,(.*)$/s.exec(url);
  if (!partes) throw new Error("Formato de imagem inválido.");
  const mime = partes[1];
  if (
    !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(mime)
  )
    throw new Error("Use PNG, JPG ou WebP.");
  let bytes;
  try {
    bytes = partes[3]
      ? Uint8Array.from(atob(partes[4]), (c) => c.charCodeAt(0))
      : new TextEncoder().encode(decodeURIComponent(partes[4]));
  } catch {
    throw new Error("Arquivo de imagem inválido.");
  }
  if (!bytes.length || bytes.length > LIMITE)
    throw new Error("Cada imagem deve ter até 7 MB.");
  if (mime === "image/svg+xml") {
    let esperado;
    try {
      esperado = gerarDesenhoExato(plano).svg;
    } catch {
      throw new Error(
        "SVG permitido apenas para desenhos exatos criados pelo sistema.",
      );
    }
    if (new TextDecoder().decode(bytes) !== esperado)
      throw new Error(
        "SVG permitido apenas para desenhos exatos criados pelo sistema.",
      );
  } else {
    const assinatura = [...bytes.slice(0, 12)];
    const png = assinatura.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10";
    const jpg =
      assinatura[0] === 255 && assinatura[1] === 216 && assinatura[2] === 255;
    const webp =
      String.fromCharCode(...assinatura.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...assinatura.slice(8, 12)) === "WEBP";
    if (
      !(
        (mime === "image/png" && png) ||
        (mime === "image/jpeg" && jpg) ||
        (mime === "image/webp" && webp)
      )
    )
      throw new Error("Os bytes não correspondem a uma imagem válida.");
  }
  return { bytes, mime };
}
/** Adaptador injetável para testes; produção usa sessão Firebase autenticada. */
export async function prepararRecursosVisuais(
  usuarioId,
  documento,
  { enviar = enviarFirebase } = {},
) {
  if (!possuiVisualV2(documento)) return documento;
  if (!usuarioId || /[\/\\]/.test(usuarioId))
    throw new Error("Faça login para salvar as imagens.");
  const dedup = new Map();
  async function recurso(url, metadados, plano) {
    if (!url) return { imagemUrl: url, metadados };
    if (url.startsWith("https://")) return { imagemUrl: url, metadados };
    if (!url.startsWith("data:"))
      throw new Error(
        "Endereço de imagem inseguro ou temporário. Envie o arquivo novamente.",
      );
    const { bytes, mime } = lerRecurso(url, plano);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    const sha256 = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (!dedup.has(sha256)) {
      const ext = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "image/svg+xml": "svg",
      }[mime];
      dedup.set(
        sha256,
        Promise.resolve().then(async () => {
          const imagemUrl = await enviar({
            usuarioId,
            caminho: `professores/${usuarioId}/imagens-adaptadas/${sha256}.${ext}`,
            bytes,
            mime,
          });
          if (!imagemUrl?.startsWith("https://"))
            throw new Error(
              "O armazenamento não retornou um endereço estável.",
            );
          return imagemUrl;
        }),
      );
    }
    return {
      imagemUrl: await dedup.get(sha256),
      metadados: { ...metadados, sha256, mime, bytes: bytes.length },
    };
  }
  async function visitar(valor) {
    if (!valor || typeof valor !== "object") return valor;
    if (Array.isArray(valor)) return Promise.all(valor.map(visitar));
    if (valor.visual?.versao === 2) {
      if ((valor.visual.historico || []).length > 8)
        throw new Error("O histórico visual aceita até 8 versões por questão.");
      const aprovada = imagemAprovada(valor);
      const copia = { ...valor, visual: { ...valor.visual } };
      Object.assign(
        copia,
        await recurso(
          valor.imagemUrl,
          valor.visual.metadados,
          valor.visual.planoImagem || valor.planoVisual,
        ),
      );
      // Metadados pertencem ao contrato visual, não ao objeto questão.
      copia.visual.metadados = copia.metadados;
      delete copia.metadados;
      if (valor.visual.original)
        copia.visual.original = {
          ...valor.visual.original,
          ...(await recurso(
            valor.visual.original.imagemUrl,
            valor.visual.original.metadados,
            valor.visual.original.planoVisual || valor.planoVisual,
          )),
        };
      copia.visual.historico = await Promise.all(
        (valor.visual.historico || []).map(async (h) => ({
          ...h,
          ...(await recurso(
            h.imagemUrl,
            h.metadados,
            h.planoVisual || valor.planoVisual,
          )),
        })),
      );
      copia.visual.aprovacao = aprovada
        ? { ...valor.visual.aprovacao, assinatura: assinaturaVisual(copia) }
        : null;
      return copia;
    }
    return Object.fromEntries(
      await Promise.all(
        Object.entries(valor).map(async ([k, v]) => [k, await visitar(v)]),
      ),
    );
  }
  const resultado = await visitar(documento);
  if (
    new TextEncoder().encode(JSON.stringify(resultado)).length > MAX_DOCUMENTO
  )
    throw new Error(
      "Documento muito grande. Divida a atividade antes de salvar.",
    );
  return resultado;
}
/** Pendências locais prevalecem até uma gravação confirmada. */
export function mesclarPendentes(nuvem, local) {
  const pendentes = local.filter(
    (item) => item.sincronizacaoVisual?.status === "pendente",
  );
  const ids = new Set(pendentes.map((item) => item.id));
  return [...pendentes, ...nuvem.filter((item) => !ids.has(item.id))];
}
/** Não confundir cache local com confirmação da nuvem. */
export async function salvarDocumentoVisual(
  repo,
  usuarioId,
  documento,
  salvar,
) {
  if (!possuiVisualV2(documento)) return salvar(documento);
  const rascunho = JSON.parse(
    JSON.stringify({
      ...documento,
      id:
        documento.id ||
        `visual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    }),
  );
  const gravar = (item) => {
    const lista = repo._lerLocal(usuarioId).filter((v) => v.id !== item.id);
    if (typeof localStorage === "undefined")
      throw new Error(
        "Armazenamento local indisponível; mantenha esta tela aberta e tente novamente.",
      );
    try {
      localStorage.setItem(
        repo._getStorageKey(usuarioId),
        JSON.stringify([item, ...lista]),
      );
    } catch {
      throw new Error(
        "Espaço local insuficiente para preservar o rascunho. Mantenha esta tela aberta e tente novamente.",
      );
    }
  };
  // Primeiro preservar pixels originais, mesmo se o upload parar no meio.
  rascunho.sincronizacaoVisual = { status: "pendente" };
  try {
    gravar(rascunho);
  } catch {
    /* Upload pode liberar espaço ao substituir pixels por URL; erro final permanece explícito. */
  }
  let preparado;
  try {
    if (!usuarioId || !repo.firestoreDb)
      throw new Error("Conecte a conta e a nuvem para salvar as imagens.");
    preparado = await prepararRecursosVisuais(
      usuarioId,
      rascunho,
      repo.recursosVisuais,
    );
    preparado.sincronizacaoVisual = { status: "sincronizado" };
    const salvo = await salvar(preparado);
    const lista = repo
      ._lerLocal(usuarioId)
      .filter((item) => item.id !== salvo.id);
    repo._gravarLocal(usuarioId, [salvo, ...lista]);
    return salvo;
  } catch (erro) {
    const pendente = preparado || rascunho;
    pendente.sincronizacaoVisual = {
      status: "pendente",
      erro: String(erro.message || erro),
    };
    gravar(pendente);
    throw new Error(
      `Salvamento na nuvem pendente. Rascunho preservado nesta conta. ${erro.message || erro}`,
      { cause: erro },
    );
  }
}
