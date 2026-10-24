import { validarCriterios } from './criterios';

/**
 * Regras de Domínio — Serialização e Validação de Backup de Turmas
 * Referência: specs/RULES.md e specs/TESTS_SPEC.md (IT-02)
 */

/**
 * Serializa a lista de turmas para JSON formatado para exportação em arquivo.
 * @param {Array<object>} turmas
 * @returns {string}
 */
export function serializarBackupTurmas(turmas) {
  if (!Array.isArray(turmas)) {
    throw new Error('A entrada para serialização deve ser uma lista de turmas.');
  }
  return JSON.stringify(turmas, null, 2);
}

/**
 * Deserializa e valida a integridade do backup de turmas importado de arquivo JSON.
 * @param {string|Array<object>} jsonOrArray
 * @returns {Array<object>}
 */
export function deserializarBackupTurmas(jsonOrArray) {
  let parsed;
  if (typeof jsonOrArray === 'string') {
    try {
      parsed = JSON.parse(jsonOrArray);
    } catch (err) {
      throw new Error(`JSON de backup inválido: ${err.message}`);
    }
  } else {
    parsed = jsonOrArray;
  }

  if (objeto(parsed) && ('versao' in parsed || 'turmas' in parsed)) {
    if (parsed.formato !== 'rotina-docente-turmas' || parsed.versao !== 1) {
      throw new Error('Formato ou versão de backup não suportado.');
    }
    parsed = parsed.turmas;
  }
  if (!Array.isArray(parsed)) {
    throw new Error('O arquivo de backup deve ser uma lista de turmas.');
  }
  validarArvore(parsed);
  validarIds(parsed, 'turmas');
  parsed.forEach(validarTurma);
  return parsed;
}

const objeto = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const falhar = caminho => { throw new Error(`Estrutura de backup inválida: ${caminho}.`); };
const texto = value => typeof value === 'string' && value.trim().length > 0;
const idValido = value => texto(value) || (typeof value === 'number' && Number.isFinite(value));
const preenchido = value => value !== null && value !== undefined && value !== '';
const numero = value => (typeof value === 'number' || (typeof value === 'string' && /^\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*$/.test(value))) && Number.isFinite(Number(value));

function validarArvore(value, caminho = 'turmas', vistos = new WeakSet()) {
  if (typeof value === 'number' && !Number.isFinite(value)) falhar(caminho);
  if (!value || typeof value !== 'object') return;
  if (vistos.has(value)) falhar(`${caminho}: referência circular`);
  vistos.add(value);
  Object.entries(value).forEach(([key, item]) => {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) falhar(`${caminho}.${key}`);
    validarArvore(item, `${caminho}.${key}`, vistos);
  });
  vistos.delete(value);
}

function validarIds(lista, caminho) {
  if (!Array.isArray(lista)) falhar(caminho);
  const ids = new Set();
  lista.forEach(item => {
    if (!objeto(item) || !idValido(item.id)) falhar(`${caminho}: ID ausente`);
    const id = String(item.id);
    if (ids.has(id)) throw new Error(`ID duplicado em ${caminho}: ${id}.`);
    ids.add(id);
  });
}

function validarNota(value, caminho) {
  if (preenchido(value) && (!numero(value) || Number(value) < 0)) falhar(caminho);
}

function validarConfig(config, caminho) {
  if (!objeto(config)) falhar(caminho);
  try { validarCriterios(config); }
  catch (error) { falhar(`${caminho}: ${error.message}`); }
}

function validarTurma(turma) {
  const caminho = `turma ${turma.id}`;
  if (!texto(turma.nome) || !Array.isArray(turma.alunos) || !objeto(turma.bimestres)) falhar(caminho);
  validarIds(turma.alunos, `${caminho}.alunos`);
  turma.alunos.forEach(aluno => { if (!texto(aluno.nome)) falhar(`${caminho}.aluno ${aluno.id}.nome`); });
  const bimestres = new Set();
  Object.entries(turma.bimestres).forEach(([key, bimestre]) => {
    if (!/^(?:b)?[1-4]$/.test(key) || !objeto(bimestre)) falhar(`${caminho}.bimestres.${key}`);
    const numeroBimestre = key.replace('b', '');
    if (bimestres.has(numeroBimestre)) falhar(`${caminho}: bimestre duplicado ${key}`);
    bimestres.add(numeroBimestre);
    if (bimestre.atividades !== undefined) {
      validarIds(bimestre.atividades, `${caminho}.bimestre ${key}.atividades`);
      bimestre.atividades.forEach(atividade => {
        if (!numero(atividade.max) || Number(atividade.max) < 0) falhar(`${caminho}.atividade ${atividade.id}.max`);
      });
    }
    if (bimestre.config !== undefined) validarConfig(bimestre.config, `${caminho}.bimestre ${key}.config`);
    if (bimestre.notas !== undefined) {
      if (!objeto(bimestre.notas)) falhar(`${caminho}.bimestre ${key}.notas`);
      Object.entries(bimestre.notas).forEach(([idAluno, notas]) => {
        if (!objeto(notas)) falhar(`${caminho}.notas.${idAluno}`);
        Object.entries(notas).forEach(([campo, nota]) => validarNota(nota, `${caminho}.notas.${idAluno}.${campo}`));
      });
    }
  });
  if (turma.recuperacao !== undefined) {
    if (!objeto(turma.recuperacao)) falhar(`${caminho}.recuperacao`);
    Object.entries(turma.recuperacao).forEach(([idAluno, rec]) => {
      if (objeto(rec)) Object.entries(rec).forEach(([campo, nota]) => validarNota(nota, `${caminho}.recuperacao.${idAluno}.${campo}`));
      else validarNota(rec, `${caminho}.recuperacao.${idAluno}`);
    });
  }
}

/** Envelope novo; serializarBackupTurmas conserva o contrato legado de lista. */
export function criarBackupVersionado(turmas, criadoEm = new Date().toISOString()) {
  deserializarBackupTurmas(turmas);
  return { formato: 'rotina-docente-turmas', versao: 1, criadoEm, turmas };
}

function normalizarTurmas(turmas) {
  return turmas.map(turma => ({
    ...turma,
    bimestres: Object.fromEntries(Object.entries(turma.bimestres).map(([key, bimestre]) => [key.replace('b', ''), { ...bimestre, atividades: bimestre.atividades || [], notas: bimestre.notas || {} }]))
  }));
}

function mesclar(atual, recebido, caminho, conflitos) {
  if (JSON.stringify(atual) === JSON.stringify(recebido)) return atual;
  if (Array.isArray(atual) && Array.isArray(recebido) && atual.concat(recebido).every(item => objeto(item) && idValido(item.id))) {
    const porId = new Map(recebido.map(item => [String(item.id), item]));
    const resultado = atual.map(item => {
      const outro = porId.get(String(item.id));
      porId.delete(String(item.id));
      return outro ? mesclar(item, outro, `${caminho}.${item.id}`, conflitos) : item;
    });
    return resultado.concat([...porId.values()]);
  }
  if (objeto(atual) && objeto(recebido)) {
    const resultado = { ...atual };
    Object.entries(recebido).forEach(([key, value]) => {
      resultado[key] = Object.hasOwn(atual, key) ? mesclar(atual[key], value, `${caminho}.${key}`, conflitos) : value;
    });
    return resultado;
  }
  conflitos.push(caminho);
  return atual;
}

function contar(turmas) {
  let alunos = 0; let notas = 0;
  const contarNota = value => { if (preenchido(value)) notas += 1; };
  turmas.forEach(turma => {
    alunos += turma.alunos.length;
    Object.values(turma.bimestres).forEach(b => Object.values(b.notas || {}).forEach(n => Object.values(n).forEach(contarNota)));
    Object.values(turma.recuperacao || {}).forEach(rec => { if (objeto(rec)) Object.values(rec).forEach(contarNota); else contarNota(rec); });
  });
  return { turmas: turmas.length, alunos, notas };
}

/** Plano puro: nenhuma gravação; mesclagem mantém todo valor atual em colisões. */
export function prepararRestauracaoBackup(turmasAtuais, backup, modo) {
  if (!['mesclar', 'substituir'].includes(modo)) throw new Error('Escolha o modo de restauração.');
  const atuais = normalizarTurmas(deserializarBackupTurmas(turmasAtuais));
  const recebido = normalizarTurmas(deserializarBackupTurmas(backup));
  const conflitos = [];
  const turmas = modo === 'mesclar' ? mesclar(atuais, recebido, 'turmas', conflitos) : recebido;
  return { turmas, conflitos, resumo: { atual: contar(atuais), recebido: contar(recebido), resultado: contar(turmas) } };
}
