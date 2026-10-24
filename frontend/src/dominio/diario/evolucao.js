import { calcTotal, genId, temNota } from '@/utils/diario/calculos';

const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const objeto = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const copia = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

/** Patches por turma/campo: desfazer não descarta edições em outros campos. */
export function registrarAlteracao(antes, depois, { autor = '', origem = 'manual', descricao = 'Edição do Diário' } = {}) {
  const alteracoes = [];
  const comparar = (a, b, caminho, existeAntes = true, existeDepois = true) => {
    if (existeAntes === existeDepois && igual(a, b)) return;
    if (existeAntes && existeDepois && objeto(a) && objeto(b)) {
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        comparar(a[key], b[key], [...caminho, key], Object.hasOwn(a, key), Object.hasOwn(b, key));
      }
    } else alteracoes.push({ caminho, existeAntes, existeDepois, antes: copia(a) ?? null, novo: copia(b) ?? null });
  };
  const mapaAntes = Object.fromEntries(antes.map(t => [t.id, t]));
  const mapaDepois = Object.fromEntries(depois.map(t => [t.id, t]));
  comparar(mapaAntes, mapaDepois, []);
  if (!alteracoes.length && !igual(antes.map(t => t.id), depois.map(t => t.id))) {
    return { id: genId(), autor, origem, descricao: 'Reordenar turmas', criadoEm: new Date().toISOString(), alteracoes: [], ordemAntes: antes.map(t => t.id), ordemDepois: depois.map(t => t.id) };
  }
  return { id: genId(), autor, origem, descricao, criadoEm: new Date().toISOString(), alteracoes };
}

export function desfazerAlteracao(turmas, registro) {
  if (registro.ordemAntes) {
    if (!igual(turmas.map(t => t.id), registro.ordemDepois)) throw new Error('A ordem mudou após essa edição. Revise as alterações posteriores.');
    return registro.ordemAntes.map(id => turmas.find(t => t.id === id));
  }
  const mapa = Object.fromEntries(copia(turmas).map(t => [t.id, t]));
  for (const item of registro.alteracoes) {
    let parent = mapa;
    for (const key of item.caminho.slice(0, -1)) parent = parent?.[key];
    const key = item.caminho.at(-1);
    if (!parent || Object.hasOwn(parent, key) !== item.existeDepois || (item.existeDepois && !igual(parent[key], item.novo))) {
      throw new Error('O campo mudou após essa edição. Não é seguro desfazer alterações posteriores.');
    }
    if (item.existeAntes) parent[key] = copia(item.antes);
    else delete parent[key];
  }
  const ids = [...turmas.map(t => t.id), ...Object.keys(mapa).filter(id => !turmas.some(t => t.id === id))];
  return ids.filter(id => mapa[id]).map(id => mapa[id]);
}

export function anoLetivoTurma(turma) {
  const ano = Number(turma.anoLetivo ?? turma.ano);
  return Number.isInteger(ano) && ano >= 1900 && ano <= 2200 ? ano : null;
}

export function filtrarTurmasAno(turmas, ano, arquivadas = false) {
  return turmas.filter(t => (ano === 'legado' ? !anoLetivoTurma(t) : anoLetivoTurma(t) === Number(ano)) && Boolean(t.arquivada) === arquivadas);
}

export function copiarTurmaParaAno(origem, { anoLetivo, nome }) {
  const ano = Number(anoLetivo);
  if (!Number.isInteger(ano) || ano < 1900 || ano > 2200 || !String(nome || '').trim()) throw new Error('Informe nome e ano letivo válido.');
  return {
    id: `turma_${genId()}`, nome: nome.trim(), anoLetivo: ano,
    alunos: origem.alunos.map(aluno => ({ ...copia(aluno), id: `al_${genId()}` })),
    bimestres: Object.fromEntries([1, 2, 3, 4].map(b => [b, { atividades: [], notas: {}, ...(origem.bimestres[b]?.config ? { config: copia(origem.bimestres[b].config) } : {}) }])),
    frequencias: {}, ocorrencias: [], recuperacao: {}, copiadaDe: origem.id,
  };
}

export function conferirFechamento(turma, bimestre) {
  const dados = turma.bimestres?.[String(bimestre)] || {};
  const atividades = dados.atividades || [];
  const notas = dados.notas || {};
  const presente = n => n !== null && n !== undefined && n !== '';
  const semSimulado = turma.alunos.filter(a => !presente(notas[a.id]?.simulado)).length;
  const semAtividades = turma.alunos.filter(a => atividades.some(atv => !presente(notas[a.id]?.[atv.id]))).length;
  const semNotas = turma.alunos.filter(a => !temNota(notas[a.id], atividades)).length;
  const semAcesso = turma.alunos.filter(a => !/^\d{4}$/.test(String(a.dataNascimento || '')) && !/^\d{4}-\d{2}-\d{2}$/.test(String(a.dataNascimento || ''))).length;
  const acimaTeto = atividades.reduce((sum, atv) => sum + Number(atv.max || 0), 0) > Number(dados.config?.atividadesMaxFinal ?? 5);
  const escala = JSON.stringify(dados.config || {});
  const criteriosDivergentes = Object.values(turma.bimestres || {}).some(b => JSON.stringify(b.config || {}) !== escala);
  const faltasEscala = turma.alunos.filter(a => {
    const nota = notas[a.id] || {};
    return presente(nota.simulado) && (!Number.isFinite(Number(nota.simulado)) || Number(nota.simulado) < 0 || Number(nota.simulado) > Number(dados.config?.simuladoMaxLanca ?? 5));
  }).length;
  return { semSimulado, semAtividades, semNotas, semAcesso, acimaTeto, criteriosDivergentes, faltasEscala };
}

/** Assinatura somente dos dados que o aluno verá; mudanças de interface não invalidam publicação. */
export function assinaturaPublicacao(turma, periodo = 'ano') {
  const bimestres = periodo === 'ano' ? turma.bimestres : { [periodo]: turma.bimestres?.[periodo] || {} };
  return JSON.stringify({ alunos: turma.alunos.map(({ id, nome, dataNascimento }) => ({ id, nome, dataNascimento })), bimestres, recuperacao: turma.recuperacao || {} });
}

/** Digest não criptográfico para indicar publicação desatualizada; nunca decide conflitos de gravação. */
export function resumirAssinatura(texto) {
  let hash = 0xcbf29ce484222325n;
  for (let i = 0; i < texto.length; i++) {
    hash ^= BigInt(texto.charCodeAt(i));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return `v1:${hash.toString(16).padStart(16, '0')}`;
}
