/** Acervo temático privado, sem cache de aprovação ou autoridade no cliente. */
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { falha } from "@/dominio/revisao/sala";
const slug = (id) =>
  typeof id === "string" &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) &&
  id.length <= 140;
const texto = (t) => typeof t === "string" && t.trim().length > 0;
const seguro = (p) => {
  try {
    const u = new URL(p);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
};
const dentro = (r, p) => {
  const rel = path.relative(r, p);
  return (
    rel !== "" &&
    rel !== ".." &&
    !rel.startsWith(".." + path.sep) &&
    !path.isAbsolute(rel)
  );
};
const exigir = (cond) => {
  if (!cond)
    throw falha(
      422,
      "O acervo temático contém referências ou dados inválidos.",
    );
};
async function raiz() {
  for (const p of [
    path.resolve(process.cwd(), "../content/revisao-enem"),
    path.resolve(process.cwd(), "content/revisao-enem"),
  ]) {
    try {
      const real = await fs.realpath(/* turbopackIgnore: true */ p);
      const arq = path.join(real, "aulas/catalogo.json");
      await fs.stat(/* turbopackIgnore: true */ arq);
      return real;
    } catch {
      /* Segundo caminho suporta checkout raiz. */
    }
  }
  throw falha(503, "Acervo de aulas indisponível.");
}
async function bytes(r, rel) {
  const alvo = path.resolve(r, rel);
  exigir(dentro(r, alvo));
  const real = await fs.realpath(/* turbopackIgnore: true */ alvo);
  const escopo = path.join(
    r,
    rel.startsWith("aulas/imagens/")
      ? "aulas/imagens"
      : rel.startsWith("aulas/conteudos/")
        ? "aulas/conteudos"
        : rel.startsWith("questoes/")
          ? "questoes"
          : "aulas",
  );
  exigir(dentro(escopo, real));
  return fs.readFile(/* turbopackIgnore: true */ real);
}
async function json(r, p) {
  const raw = await bytes(r, p);
  exigir(raw.length <= 2000000);
  return { raw, obj: JSON.parse(raw.toString("utf8")) };
}
async function imagem(r, img) {
  exigir(
    img &&
      slug(img.id) &&
      texto(img.alt) &&
      texto(img.legenda) &&
      texto(img.licenca) &&
      seguro(img.fonteUrl),
  );
  exigir(
    /^aulas\/imagens\/[a-z0-9][a-z0-9-]*\.(png|jpg|webp)$/.test(img.arquivo),
  );
  const b = await bytes(r, img.arquivo);
  exigir(b.length <= 7000000);
  const ext = path.extname(img.arquivo);
  const mime =
    ext === ".png" &&
    b.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
      ? "image/png"
      : ext === ".jpg" && b[0] === 255 && b[1] === 216 && b[2] === 255
        ? "image/jpeg"
        : ext === ".webp" &&
            b.toString("ascii", 0, 4) === "RIFF" &&
            b.toString("ascii", 8, 12) === "WEBP"
          ? "image/webp"
          : null;
  exigir(mime);
  return { buffer: b, mime };
}
async function carregar() {
  try {
    const r = await raiz();
    const cat = await json(r, "aulas/catalogo.json"),
      map = await json(r, "aulas/vinculos.json");
    exigir(
      cat.obj.schemaVersion === 1 &&
        map.obj.schemaVersion === 1 &&
        Array.isArray(cat.obj.trilhas) &&
        Array.isArray(cat.obj.conteudos) &&
        Array.isArray(map.obj.questoes),
    );
    const trilhas = new Map(),
      aulas = new Map();
    for (const t of cat.obj.trilhas) {
      exigir(slug(t.id) && texto(t.titulo) && !trilhas.has(t.id));
      trilhas.set(t.id, t);
    }
    for (const meta of cat.obj.conteudos) {
      exigir(
        slug(meta.id) &&
          !aulas.has(meta.id) &&
          trilhas.has(meta.trilhaId) &&
          texto(meta.titulo) &&
          texto(meta.resumo),
      );
      const { obj: a, raw } = await json(r, `aulas/conteudos/${meta.id}.json`);
      exigir(
        a.schemaVersion === 1 &&
          a.id === meta.id &&
          a.titulo === meta.titulo &&
          Array.isArray(a.objetivos) &&
          a.objetivos.length > 0 &&
          Array.isArray(a.blocos) &&
          a.blocos.length >= 1 &&
          a.blocos.length <= 32 &&
          Array.isArray(a.imagens) &&
          Array.isArray(a.fontes) &&
          a.fontes.length > 0 &&
          a.fontes.every((f) => texto(f.titulo) && seguro(f.url)) &&
          a.status === "rascunho",
      );
      const objetivos = new Set();
      for (const o of a.objetivos) {
        exigir(slug(o.id) && texto(o.descricao) && !objetivos.has(o.id));
        objetivos.add(o.id);
      }
      exigir(JSON.stringify(meta.objetivos) === JSON.stringify(a.objetivos));
      const ids = new Set(),
        imgs = new Map();
      for (const i of a.imagens) {
        exigir(!imgs.has(i.id));
        imgs.set(i.id, { ...i, ...(await imagem(r, i)) });
      }
      const ensinados = new Set();
      for (const b of a.blocos) {
        exigir(
          slug(b.id) &&
            !ids.has(b.id) &&
            texto(b.titulo) &&
            texto(b.texto) &&
            b.texto.length <= 16000 &&
            ["texto", "imagem"].includes(b.tipo) &&
            Array.isArray(b.objetivoIds) &&
            b.objetivoIds.length > 0 &&
            b.objetivoIds.every((o) => objetivos.has(o)),
        );
        if (b.tipo === "imagem") exigir(imgs.has(b.imagemId));
        b.objetivoIds.forEach((o) => ensinados.add(o));
        ids.add(b.id);
      }
      exigir([...objetivos].every((o) => ensinados.has(o)));
      exigir(
        Number.isFinite(a.duracaoEstimadaMinutos) &&
          a.duracaoEstimadaMinutos > 0,
      );
      aulas.set(a.id, { meta, conteudo: a, raw, objetivos, imgs });
    }
    const mapa = new Map();
    const questoes = [];
    for (const v of map.obj.questoes) {
      exigir(
        typeof v.questaoId === "string" &&
          /^enem-\d{4}-[a-z0-9-]+$/.test(v.questaoId) &&
          !mapa.has(v.questaoId) &&
          ["vinculada", "pendente", "fora_escopo"].includes(v.situacao) &&
          Array.isArray(v.vinculos),
      );
      const original = await json(r, `questoes/${v.questaoId}.json`);
      exigir(original.obj.id === v.questaoId);
      const destinos = new Set();
      for (const x of v.vinculos) {
        const a = aulas.get(x.conteudoId);
        exigir(
          a &&
            !destinos.has(x.conteudoId) &&
            texto(x.justificativa) &&
            Array.isArray(x.objetivoIds) &&
            x.objetivoIds.length > 0 &&
            x.objetivoIds.every((o) => a.objetivos.has(o)),
        );
        destinos.add(x.conteudoId);
      }
      exigir(
        v.situacao === "vinculada"
          ? destinos.size > 0
          : v.vinculos.length === 0 && texto(v.observacao),
      );
      mapa.set(v.questaoId, { v, raw: original.raw });
      if (v.situacao === "vinculada")
        questoes.push({ questaoId: v.questaoId, conteudoIds: [...destinos] });
    }
    // O inventário deve representar também as questões excluídas, sem vínculos inventados.
    const qdir = path.join(r, "questoes");
    const nomes = await fs.readdir(/* turbopackIgnore: true */ qdir);
    const ids = nomes
      .filter((n) => /^enem-.*\.json$/.test(n))
      .map((n) => n.slice(0, -5));
    exigir(ids.length === mapa.size && ids.every((id) => mapa.has(id)));
    for (const a of aulas.values()) {
      const hash = createHash("sha256");
      const add = (b) => {
        hash.update(String(b.length)).update(":").update(b);
      };
      add(a.raw);
      add(Buffer.from(JSON.stringify([a.meta, trilhas.get(a.meta.trilhaId)])));
      for (const { v, raw } of [...mapa.values()]
        .filter((x) => x.v.vinculos.some((y) => y.conteudoId === a.meta.id))
        .sort((x, y) => x.v.questaoId.localeCompare(y.v.questaoId))) {
        add(Buffer.from(JSON.stringify(v)));
        add(raw);
      }
      for (const [id, img] of [...a.imgs].sort(([x], [y]) =>
        x.localeCompare(y),
      )) {
        add(Buffer.from(id));
        add(img.buffer);
      }
      a.hashFonte = hash.digest("hex");
    }
    return { r, trilhas: [...trilhas.values()], aulas, questoes };
  } catch (e) {
    if (e.publica) throw e;
    throw falha(422, "Não foi possível validar o acervo temático.");
  }
}
export async function listarCatalogoTematico() {
  const c = await carregar();
  return {
    trilhas: c.trilhas,
    conteudos: [...c.aulas.values()].map((a) => ({
      ...a.meta,
      duracaoEstimadaMinutos: a.conteudo.duracaoEstimadaMinutos,
      hashFonte: a.hashFonte,
    })),
    questoes: c.questoes,
  };
}
export async function lerConteudoTematico(id) {
  if (!slug(id)) throw falha(400, "Conteúdo inválido.");
  const c = await carregar(),
    a = c.aulas.get(id);
  if (!a) throw falha(404, "Conteúdo não encontrado.");
  return { conteudo: a.conteudo, hashFonte: a.hashFonte };
}
export async function lerImagemConteudo(id, imagemId) {
  if (!slug(id) || !slug(imagemId)) throw falha(400, "Imagem inválida.");
  const c = await carregar(),
    a = c.aulas.get(id);
  const img = a?.imgs.get(imagemId);
  if (!img) throw falha(404, "Imagem não encontrada.");
  return { buffer: img.buffer, mime: img.mime };
}
