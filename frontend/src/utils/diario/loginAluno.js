const PREPOSICOES = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'd']);

/**
 * Normaliza o nome em partes reais: minúsculas, sem acentos,
 * sem preposições (de, da, do, dos, das, e, d).
 */
const partesNome = (nomeCompleto = '') =>
  String(nomeCompleto)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter((p) => p.length > 0 && !PREPOSICOES.has(p));

const sufixoDN = (dataNascimento = '') => String(dataNascimento || '').replace(/\D/g, '');

/**
 * Login CANÔNICO do aluno: 1º nome real + DDMM de nascimento.
 *
 * Exemplos (RN-45):
 * - "Pedro Henrique Ribeiro Nascimento", "1111" -> "pedro1111"
 * - "Maria Eduarda da Silva", "1503" -> "maria1503"
 * - "João Lúcio Álvares", "0505" -> "joao0505"
 * - "Kelso", "0407" -> "kelso0407"
 */
export const gerarLoginAluno = (nomeCompleto = '', dataNascimento = '') => {
  if (!nomeCompleto) return '';
  const prefixo = partesNome(nomeCompleto).slice(0, 1).join('');
  return `${prefixo}${sufixoDN(dataNascimento)}`;
};

/**
 * Login de EXCEÇÃO para homônimos: 1º + 2º nome real + DDMM (RN-45).
 *
 * Exemplos:
 * - "Pedro Henrique Ribeiro Nascimento", "1111" -> "pedrohenrique1111"
 * - "Pedro Vitor Dos Santos Lima", "1111" -> "pedrovitor1111"
 * - "Maria da Silva Santos", "1503" -> "mariasilva1503"
 */
export const gerarLoginDoisNomes = (nomeCompleto = '', dataNascimento = '') => {
  if (!nomeCompleto) return '';
  const prefixo = partesNome(nomeCompleto).slice(0, 2).join('');
  return `${prefixo}${sufixoDN(dataNascimento)}`;
};

/**
 * Resolve os logins de uma turma aplicando a EXCEÇÃO de homônimos (RN-45):
 * quando 2+ alunos resultariam no mesmo login canônico (mesmo 1º nome + mesmo DDMM),
 * todos os membros do grupo usam o formato de 2 nomes.
 * Função pura e determinística (sem I/O) — mesma entrada, mesma saída.
 *
 * @param {Array<{id?: string, nome: string, dataNascimento?: string}>} alunos
 * @returns {Array<{aluno: object, login: string, homonimo: boolean}>} na ordem de entrada
 */
export const resolverLoginsAlunos = (alunos = []) => {
  const contagem = new Map();
  for (const aluno of alunos) {
    const dn = sufixoDN(aluno.dataNascimento);
    if (!aluno.nome || !dn) continue;
    const chave = `${partesNome(aluno.nome)[0] || ''}${dn}`;
    contagem.set(chave, (contagem.get(chave) || 0) + 1);
  }

  return alunos.map((aluno) => {
    const dn = sufixoDN(aluno.dataNascimento);
    if (!aluno.nome || !dn) return { aluno, login: '', homonimo: false };
    const chave = `${partesNome(aluno.nome)[0]}${dn}`;
    const homonimo = (contagem.get(chave) || 0) > 1;
    const login = homonimo
      ? gerarLoginDoisNomes(aluno.nome, aluno.dataNascimento)
      : gerarLoginAluno(aluno.nome, aluno.dataNascimento);
    return { aluno, login, homonimo };
  });
};

const normalizarNome = (nome = '') =>
  String(nome || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

/**
 * Garante a unicidade GLOBAL do login antes de gravar (RN-45).
 *
 * Consulta o documento candidato via `buscarDoc(login)` (I/O injetado):
 * - inexistente ou com `nome` equivalente -> mantém o candidato;
 * - existente com `nome` divergente (outro estudante) -> escala para 2 nomes;
 * - colisão também na chave de 2 nomes -> `conflito: true` (nunca sobrescrever identidade).
 *
 * @param {string} nome
 * @param {string} dataNascimento
 * @param {(login: string) => Promise<{nome: string}|null>} buscarDoc
 * @param {{homonimo?: boolean}} opcoes - quando `true`, parte direto da chave de 2 nomes
 *   (grupo de homônimos já resolvido na turma).
 * @returns {Promise<{login: string|null, homonimo: boolean, conflito: boolean}>}
 */
export const resolverLoginUnico = async (nome, dataNascimento, buscarDoc, { homonimo = false } = {}) => {
  const login1 = gerarLoginAluno(nome, dataNascimento);
  const login2 = gerarLoginDoisNomes(nome, dataNascimento);
  const candidato = homonimo ? login2 : login1;

  const doc = await buscarDoc(candidato);
  if (!doc || normalizarNome(doc.nome) === normalizarNome(nome)) {
    return { login: candidato, homonimo, conflito: false };
  }
  if (homonimo || login2 === login1) {
    // Chave de 2 nomes já pertence a outro estudante, ou nome único sem como escalar.
    return { login: null, homonimo: true, conflito: true };
  }
  const doc2 = await buscarDoc(login2);
  if (!doc2 || normalizarNome(doc2.nome) === normalizarNome(nome)) {
    return { login: login2, homonimo: true, conflito: false };
  }
  return { login: null, homonimo: true, conflito: true };
};

/**
 * Seleciona o login a exibir na tabela do Diário a partir dos documentos
 * armazenados encontrados por `nome` (RN-45 — exibidor canônico):
 * 1) candidato igual ao login canônico;
 * 2) candidato com sufixo igual ao DDMM do aluno;
 * 3) candidato terminado em 4 dígitos;
 * 4) primeiro candidato.
 * Retorna `''` quando não há candidatos (aluno ainda não publicado).
 */
export const selecionarLoginExibido = (candidatos = [], aluno = {}) => {
  const lista = (candidatos || []).filter(Boolean);
  if (lista.length === 0) return '';

  const canonico = gerarLoginAluno(aluno.nome, aluno.dataNascimento);
  if (canonico && lista.includes(canonico)) return canonico;

  const dn = sufixoDN(aluno.dataNascimento);
  if (dn.length === 4) {
    const porDDMM = lista.find((login) => login.endsWith(dn));
    if (porDDMM) return porDDMM;
  }

  const comDigitos = lista.find((login) => /\d{4}$/.test(login));
  return comDigitos || lista[0];
};

/**
 * Gera a chave SHA-256 do login para identificação no Firestore.
 */
export const gerarLoginKey = async (login) => {
  if (!login) return '';
  const clean = String(login).trim().toLowerCase();
  const encoded = new TextEncoder().encode(clean);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};
