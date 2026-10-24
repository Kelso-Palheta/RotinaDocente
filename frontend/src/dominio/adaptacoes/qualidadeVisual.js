/** RN-72: contrato visual puro; nenhuma aprovação é inferida pela IA. */
const escapar = (valor) =>
  String(valor).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
export const medirDpi = (pixels, centimetros = 10) =>
  Number(pixels) / (Number(centimetros) / 2.54);
export function assinaturaVisual(q) {
  return JSON.stringify(
    [
      q.id || q.numero,
      q.enunciado || "",
      q.alternativas || [],
      q.gabarito || "",
      q.imagemUrl,
      q.apoioVisualDescricao,
      q.planoVisual,
      q.visual?.metadados,
      q.visual?.original?.imagemUrl,
      q.visual?.original?.metadados,
      q.visual?.contexto,
    ],
    (_chave, item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((k) => [k, item[k]]),
          )
        : item,
  );
}
export function imagemAprovada(q) {
  return Boolean(
    q.imagemUrl &&
      q.apoioVisualDescricao?.trim() &&
      q.visual?.aprovacao?.professorId &&
      q.visual.aprovacao.assinatura === assinaturaVisual(q),
  );
}
export function validarQualidadeVisual(q) {
  if (!q.imagemUrl) throw new Error("Inclua a imagem antes de aprovar.");
  if (!q.apoioVisualDescricao?.trim())
    throw new Error("Descreva a imagem final para o estudante.");
  const m = q.visual?.metadados;
  if (
    !m ||
    !Number.isFinite(m.width) ||
    !Number.isFinite(m.height) ||
    m.width < 256 ||
    m.height < 256
  )
    throw new Error("Resolução insuficiente ou imagem ainda não verificada.");
  const cm = Number(q.planoVisual?.larguraCm || 10);
  if (!Number.isFinite(cm) || cm <= 0 || cm > 18)
    throw new Error("Tamanho de impressão inválido (até 18 cm).");
  if (m.mime !== "image/svg+xml" && medirDpi(m.width, cm) < 300)
    throw new Error(
      "Resolução insuficiente para 300 DPI no tamanho de impressão. Reduza a largura ou use uma imagem maior.",
    );
  if (
    m.mime === "image/svg+xml" &&
    q.visual?.planoImagem &&
    gerarDesenhoExato(q.planoVisual).svg !==
      gerarDesenhoExato(q.visual.planoImagem).svg
  )
    throw new Error(
      "O desenho não corresponde ao plano atual. Produza uma nova versão antes de aprovar.",
    );
  if (q.visual?.verificacao?.problemas?.length)
    throw new Error(
      "Revise os problemas identificados antes de aprovar. Gere outra versão ou registre revisão manual.",
    );
  return true;
}
export function aprovarImagem(q, professorId) {
  if (!professorId) throw new Error("Faça login para registrar sua aprovação.");
  validarQualidadeVisual(q);
  return {
    ...q,
    visual: {
      ...q.visual,
      versao: 2,
      aprovacao: {
        professorId,
        em: new Date().toISOString(),
        assinatura: assinaturaVisual(q),
      },
    },
  };
}
export function pendenciasVisuais(questoes = []) {
  return questoes.flatMap((q, i) => {
    const obrigatoria =
      q.visual?.obrigatoria ?? Boolean(q.apoioVisualDescricao || q.imagemUrl);
    return obrigatoria && !imagemAprovada(q)
      ? [
          `Questão ${i + 1}: imagem obrigatória ausente ou sem revisão aprovada.`,
        ]
      : [];
  });
}
export function substituirImagem(q, imagemUrl, metadados, origem = "gerada") {
  const historico = [...(q.visual?.historico || [])];
  if (q.imagemUrl)
    historico.unshift({
      imagemUrl: q.imagemUrl,
      metadados: q.visual?.metadados,
      descricao: q.apoioVisualDescricao,
      planoVisual: q.visual?.planoImagem || q.planoVisual,
      em: new Date().toISOString(),
    });
  return {
    ...q,
    imagemUrl,
    visual: {
      ...q.visual,
      versao: 2,
      obrigatoria: q.visual?.obrigatoria ?? true,
      origem,
      metadados,
      planoImagem: q.planoVisual,
      historico: historico.slice(0, 8),
      aprovacao: null,
      verificacao: null,
    },
  };
}
const inteiro = (n, min, max) =>
  Number.isInteger(Number(n)) && Number(n) >= min && Number(n) <= max;
export function gerarDesenhoExato(plano = {}) {
  const w = 1800,
    h = 1200;
  let elementos = "";
  if (plano.tipo === "contagem") {
    if (!inteiro(plano.quantidade, 1, 30))
      throw new Error("Quantidade deve ser inteira de 1 a 30.");
    const n = Number(plano.quantidade),
      cols = Math.min(n, 6),
      rows = Math.ceil(n / cols);
    elementos = Array.from(
      { length: n },
      (_, i) =>
        `<circle data-objeto="${i + 1}" cx="${cols === 1 ? 900 : 200 + (i % cols) * (1400 / Math.max(cols - 1, 1))}" cy="${rows === 1 ? 600 : 200 + Math.floor(i / cols) * (800 / Math.max(rows - 1, 1))}" r="65" fill="#1565c0" stroke="#111" stroke-width="8"/>`,
    ).join("");
  } else if (plano.tipo === "fracao") {
    if (
      !inteiro(plano.total, 1, 24) ||
      !inteiro(plano.partes, 0, Number(plano.total))
    )
      throw new Error("Fração inválida: confira partes e total.");
    const n = Number(plano.total),
      largura = 1500 / n;
    elementos = Array.from(
      { length: n },
      (_, i) =>
        `<rect data-parte="${i + 1}" data-preenchida="${i < Number(plano.partes)}" x="${150 + i * largura}" y="350" width="${largura}" height="500" fill="${i < Number(plano.partes) ? "#1565c0" : "white"}" stroke="#111" stroke-width="6"/>`,
    ).join("");
  } else if (plano.tipo === "grafico") {
    if (
      !Array.isArray(plano.dados) ||
      !plano.dados.length ||
      plano.dados.length > 12 ||
      plano.dados.some(
        (d) =>
          !Number.isFinite(Number(d.valor)) ||
          Number(d.valor) < 0 ||
          Number(d.valor) > 1000000,
      )
    )
      throw new Error("Dados do gráfico inválidos (até 12 valores positivos).");
    const max = Math.max(...plano.dados.map((d) => Number(d.valor)), 1),
      step = 1400 / plano.dados.length;
    elementos =
      '<path d="M150 100 V1000 H1700" fill="none" stroke="#111" stroke-width="8"/>';
    elementos += plano.dados
      .map((d, i) => {
        const altura = (Number(d.valor) / max) * 750,
          rotulo = String(d.rotulo || ""),
          porLinha = Math.max(4, Math.floor((step * 0.8) / 18));
        if (rotulo.length > 100)
          throw new Error(
            "Rótulo muito longo. Reduza o nome da categoria sem perder seu significado.",
          );
        const linhas = rotulo.match(new RegExp(`.{1,${porLinha}}`, "gu")) || [
          "",
        ];
        if (linhas.length > 4)
          throw new Error(
            "Rótulo não cabe no gráfico. Reduza categorias ou encurte o nome antes de produzir.",
          );
        return `<rect data-valor="${Number(d.valor)}" x="${200 + i * step}" y="${1000 - altura}" width="${step * 0.65}" height="${altura}" fill="#1565c0" stroke="#111" stroke-width="5"/><text x="${200 + i * step}" y="${960 - altura}" font-size="42">${Number(d.valor)}</text><text aria-label="${escapar(rotulo)}" x="${200 + i * step}" y="1050" font-size="30">${linhas.map((linha, j) => `<tspan x="${200 + i * step}" dy="${j ? 36 : 0}">${escapar(linha)}</tspan>`).join("")}</text>`;
      })
      .join("");
  } else if (plano.tipo === "geometria") {
    const largura = Number(plano.largura),
      altura = Number(plano.altura);
    if (
      !["retangulo", "triangulo", "circulo"].includes(plano.forma) ||
      !(largura > 0 && largura <= 1000) ||
      !(altura > 0 && altura <= 1000)
    )
      throw new Error("Informe forma e medidas positivas (até 1000).");
    if (plano.forma === "circulo" && largura !== altura)
      throw new Error(
        "Para um círculo, informe medidas iguais para o diâmetro.",
      );
    const escala = Math.min(1400 / largura, 800 / altura),
      l = largura * escala,
      a = altura * escala,
      x = (w - l) / 2,
      y = (h - a) / 2;
    elementos =
      plano.forma === "circulo"
        ? `<circle cx="900" cy="600" r="${Math.min(l, a) / 2}" fill="white" stroke="#111" stroke-width="8"/>`
        : plano.forma === "triangulo"
          ? `<polygon points="${x},${y + a} ${x + l},${y + a} ${x},${y}" fill="white" stroke="#111" stroke-width="8"/>`
          : `<rect data-largura="${largura}" data-altura="${altura}" x="${x}" y="${y}" width="${l}" height="${a}" fill="white" stroke="#111" stroke-width="8"/>`;
  } else throw new Error("Escolha contagem, fração, gráfico ou geometria.");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="100%" height="100%" fill="white"/>${elementos}</svg>`;
  return {
    svg,
    imagemUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    metadados: {
      width: w,
      height: h,
      mime: "image/svg+xml",
      bytes: svg.length,
    },
    origem: "desenho_exato",
  };
}
