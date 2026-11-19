// Catálogo explícito de cenas audiovisuais para todos os 9 jogos da Aula Gamificada.
// Todas as referências apontam para arquivos locais reais em frontend/public/aula-gamificada/.

function cena(id, jogo, situacoes, midiaAnimada, alternativaEstatica, proporcao, origem, descricao) {
  return {
    id,
    jogo,
    situacoes,
    midiaAnimada,
    alternativaEstatica,
    proporcao,
    origem,
    descricao,
  };
}

export const CATALOGO_CENAS = [
  ...[['espera', 'image3.webp'], ['desafio', 'image4.webp'], ['acerto', 'image6.webp'], ['acerto', 'image13.webp'], ['erro', 'image12.webp'], ['erro', 'image14.webp'], ['vitoria', 'image7.webp'], ['vitoria', 'image13.webp']].map(([situacao, arquivo], i) => cena(`natacao-${situacao}-${i}`, 'natacao', [situacao, ...(situacao === 'desafio' ? ['revelacao_neutra', 'resposta_recebida', 'sem_resposta', 'ultimos_segundos'] : []), ...(situacao === 'vitoria' ? ['ranking'] : [])], `/aula-gamificada/natacao/${arquivo}`, `/aula-gamificada/natacao/${arquivo}`, '16:9', 'PPTX Natação fornecido pelo usuário', `Natação: ${situacao}`)),
  ...['espera','desafio','acerto-1','acerto-2','erro-1','erro-2','vitoria-1','vitoria-2'].map((item, i) => {
    const situacao = item.split('-')[0];
    return cena(`acerte-${item}-${i}`, 'acerte_perde', [situacao, ...(situacao === 'desafio' ? ['revelacao_neutra','resposta_recebida','sem_resposta','ultimos_segundos','tempo_esgotado'] : []), ...(situacao === 'vitoria' ? ['ranking'] : [])], `/aula-gamificada/cenas/quiz-${item}.svg`, `/aula-gamificada/cenas/quiz-${item}-estatica.svg`, '16:9', 'Complemento local de feedback pedagógico', `Acerte ou Perde: ${situacao}`);
  }),
  // ======================== HERÓIS (19 GIFs originais + PNGs estáticos) ========================
  cena('herois-espera-1', 'herois', ['espera', 'desafio', 'sem_resposta', 'revelacao_neutra'], '/aula-gamificada/herois/image1.gif', '/aula-gamificada/herois/image1.png', '500x268', 'original-herois', 'Equipe de heróis reunida pronta para a missão'),
  cena('herois-espera-2', 'herois', ['espera', 'desafio', 'sem_resposta'], '/aula-gamificada/herois/image4.gif', '/aula-gamificada/herois/image4.png', '245x180', 'original-herois', 'Homem de Ferro pairando sobre a cidade em alerta'),
  cena('herois-desafio-1', 'herois', ['desafio', 'ultimos_segundos'], '/aula-gamificada/herois/image5.gif', '/aula-gamificada/herois/image5.png', '500x281', 'original-herois', 'Hulk concentrando força antes do impacto'),
  cena('herois-desafio-2', 'herois', ['desafio', 'resposta_recebida', 'revelacao_neutra'], '/aula-gamificada/herois/image11.gif', '/aula-gamificada/herois/image11.png', '245x175', 'original-herois', 'Viúva Negra em salto acrobático de ação'),
  cena('herois-desafio-3', 'herois', ['desafio'], '/aula-gamificada/herois/image12.gif', '/aula-gamificada/herois/image12.png', '500x250', 'original-herois', 'Thor e Hulk avançando juntos para o desafio'),
  cena('herois-acerto-1', 'herois', ['acerto'], '/aula-gamificada/herois/image2.gif', '/aula-gamificada/herois/image2.png', '480x198', 'original-herois', 'Homem-Aranha pousando com o escudo em pose de conquista'),
  cena('herois-acerto-2', 'herois', ['acerto'], '/aula-gamificada/herois/image7.gif', '/aula-gamificada/herois/image7.png', '518x291', 'original-herois', 'Hulk acertando o impacto decisivo no chão'),
  cena('herois-acerto-3', 'herois', ['acerto'], '/aula-gamificada/herois/image8.gif', '/aula-gamificada/herois/image8.png', '245x204', 'original-herois', 'Thor sorrindo confiante após acerto'),
  cena('herois-acerto-4', 'herois', ['acerto'], '/aula-gamificada/herois/image17.gif', '/aula-gamificada/herois/image17.png', '480x200', 'original-herois', 'Pantera Negra saltando com precisão em movimento'),
  cena('herois-erro-1', 'herois', ['erro'], '/aula-gamificada/herois/image10.gif', '/aula-gamificada/herois/image10.png', '500x280', 'original-herois', 'Golpe inesperado entre Hulk e Thor'),
  cena('herois-erro-2', 'herois', ['erro'], '/aula-gamificada/herois/image13.gif', '/aula-gamificada/herois/image13.png', '480x393', 'original-herois', 'Rocket reagindo surpreso e alerta após erro'),
  cena('herois-erro-3', 'herois', ['erro'], '/aula-gamificada/herois/image14.gif', '/aula-gamificada/herois/image14.png', '480x199', 'original-herois', 'Thanos fechando a manopla em desafio superado pelo adversário'),
  cena('herois-retry-1', 'herois', ['nova_tentativa'], '/aula-gamificada/herois/image3.gif', '/aula-gamificada/herois/image3.png', '500x262', 'original-herois', 'Capitão América recebendo a mão estendida para nova tentativa'),
  cena('herois-retry-2', 'herois', ['nova_tentativa', 'ultimos_segundos'], '/aula-gamificada/herois/image16.gif', '/aula-gamificada/herois/image16.png', '480x200', 'original-herois', 'Capitão América resistindo com determinação para tentar novamente'),
  cena('herois-retry-3', 'herois', ['nova_tentativa', 'parcial', 'espera'], '/aula-gamificada/herois/image15.gif', '/aula-gamificada/herois/image15.png', '480x200', 'original-herois', 'Pantera Negra retomando o foco para nova chance'),
  cena('herois-vitoria-1', 'herois', ['vitoria', 'ranking'], '/aula-gamificada/herois/image6.gif', '/aula-gamificada/herois/image6.png', '426x426', 'original-herois', 'Hulk dançando animado na celebração final'),
  cena('herois-vitoria-2', 'herois', ['vitoria', 'ranking'], '/aula-gamificada/herois/image9.gif', '/aula-gamificada/herois/image9.png', '245x163', 'original-herois', 'Baby Groot dançando comemorando a conquista'),
  cena('herois-vitoria-3', 'herois', ['vitoria', 'ranking'], '/aula-gamificada/herois/image18.gif', '/aula-gamificada/herois/image18.png', '480x198', 'original-herois', 'Equipe dos Vingadores em salto triunfal coletivo'),
  cena('herois-vitoria-4', 'herois', ['vitoria', 'ranking'], '/aula-gamificada/herois/image19.gif', '/aula-gamificada/herois/image1.jpeg', '472x368', 'original-herois', 'Heróis dançando juntos na vitória final'),

  // ======================== TABULEIRO (mídias originais + complementos SVG com semântica exata) ========================
  cena('tab-espera-1', 'tabuleiro', ['espera', 'sem_resposta'], '/aula-gamificada/tabuleiro/capa-personagens.png', '/aula-gamificada/tabuleiro/capa-personagens.png', '1082x871', 'original-tabuleiro', 'Personagens do tabuleiro prontos para o início da partida'),
  cena('tab-desafio-1', 'tabuleiro', ['desafio', 'parcial', 'revelacao_neutra'], '/aula-gamificada/cenas/tabuleiro-desafio-dado.svg', '/aula-gamificada/tabuleiro/casa-bloco.png', '480x270', 'complemento-local', 'Dado e trilha de blocos para a rodada do tabuleiro'),
  cena('tab-acerto-1', 'tabuleiro', ['avance_1', 'acerto'], '/aula-gamificada/tabuleiro/carta-avance-1.gif', '/aula-gamificada/tabuleiro/casa-bloco.png', '498x279', 'original-tabuleiro', 'Carta Avance 1 casa no tabuleiro'),
  cena('tab-acerto-2', 'tabuleiro', ['avance_2'], '/aula-gamificada/tabuleiro/carta-avance-2.gif', '/aula-gamificada/tabuleiro/peao-azul.png', '340x191', 'original-tabuleiro', 'Carta Avance 2 casas no tabuleiro'),
  cena('tab-erro-1', 'tabuleiro', ['erro_nao_ande', 'erro'], '/aula-gamificada/tabuleiro/carta-erro.gif', '/aula-gamificada/tabuleiro/casa-bloco.png', '500x266', 'original-tabuleiro', 'Carta de erro mantendo o peão na casa'),
  cena('tab-erro-2', 'tabuleiro', ['passe_a_vez', 'nova_tentativa'], '/aula-gamificada/tabuleiro/carta-passe-vez.gif', '/aula-gamificada/tabuleiro/peao-verde.png', '444x250', 'original-tabuleiro', 'Carta Passe a vez para a próxima equipe'),
  cena('tab-vitoria-1', 'tabuleiro', ['vitoria', 'ranking'], '/aula-gamificada/tabuleiro/vitoria-parabens.gif', '/aula-gamificada/tabuleiro/capa-personagens.png', '500x275', 'original-tabuleiro', 'Celebração de chegada ao final do tabuleiro'),
  cena('tab-vitoria-2', 'tabuleiro', ['vitoria', 'ranking'], '/aula-gamificada/cenas/tabuleiro-vitoria-chegada.svg', '/aula-gamificada/cenas/tabuleiro-vitoria-chegada-estatica.svg', '480x270', 'complemento-local', 'Bandeira quadriculada e peões na linha de chegada'),

  // ======================== OUTROS 5 JOGOS (8 cenas cada) ========================
  ...[
    ['quiz', 'programa de perguntas'],
    ['memoria', 'descoberta de pares'],
    ['associacao', 'conexões visuais'],
    ['ordenacao', 'sequência e mecanismo'],
    ['equipes', 'arena cooperativa'],
  ].flatMap(([modo, tema]) => [
    cena(`${modo}-espera-1`, modo, ['espera', 'sem_resposta'], `/aula-gamificada/cenas/${modo}-espera.svg`, `/aula-gamificada/cenas/${modo}-espera-estatica.svg`, '480x270', 'complemento-local', `Espera em ${tema}`),
    cena(`${modo}-desafio-1`, modo, ['desafio', 'resposta_recebida', 'ultimos_segundos', 'parcial', 'revelacao_neutra'], `/aula-gamificada/cenas/${modo}-desafio.svg`, `/aula-gamificada/cenas/${modo}-desafio-estatica.svg`, '480x270', 'complemento-local', `Rodada ativa em ${tema}`),
    cena(`${modo}-acerto-1`, modo, ['acerto'], `/aula-gamificada/cenas/${modo}-acerto-1.svg`, `/aula-gamificada/cenas/${modo}-acerto-1-estatica.svg`, '480x270', 'complemento-local', `Conquista 1 em ${tema}`),
    cena(`${modo}-acerto-2`, modo, ['acerto'], `/aula-gamificada/cenas/${modo}-acerto-2.svg`, `/aula-gamificada/cenas/${modo}-acerto-2-estatica.svg`, '480x270', 'complemento-local', `Conquista 2 em ${tema}`),
    cena(`${modo}-erro-1`, modo, ['erro'], `/aula-gamificada/cenas/${modo}-erro-1.svg`, `/aula-gamificada/cenas/${modo}-erro-1-estatica.svg`, '480x270', 'complemento-local', `Revisão 1 em ${tema}`),
    cena(`${modo}-erro-2`, modo, ['erro', 'nova_tentativa'], `/aula-gamificada/cenas/${modo}-erro-2.svg`, `/aula-gamificada/cenas/${modo}-erro-2-estatica.svg`, '480x270', 'complemento-local', `Recuperação 2 em ${tema}`),
    cena(`${modo}-vitoria-1`, modo, ['vitoria', 'ranking'], `/aula-gamificada/cenas/${modo}-vitoria-1.svg`, `/aula-gamificada/cenas/${modo}-vitoria-1-estatica.svg`, '480x270', 'complemento-local', `Celebração 1 em ${tema}`),
    cena(`${modo}-vitoria-2`, modo, ['vitoria', 'ranking'], `/aula-gamificada/cenas/${modo}-vitoria-2.svg`, `/aula-gamificada/cenas/${modo}-vitoria-2-estatica.svg`, '480x270', 'complemento-local', `Celebração 2 em ${tema}`),
  ]),
];

function hashEstavel(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Seleciona uma cena compatível com (jogo, situacao) de forma estável por eventoId,
 * evitando repetir consecutivamente a mesma cena quando houver alternativas.
 */
export function selecionarCenaSemRepeticao({
  jogo = 'quiz',
  situacao = 'desafio',
  eventoId = 'padrao',
  historicoPorChave = null,
}) {
  const candidatosJogo = CATALOGO_CENAS.filter(
    (c) => c.jogo === jogo && c.situacoes.includes(situacao),
  );
  const candidatos =
    candidatosJogo.length > 0
      ? candidatosJogo
      : CATALOGO_CENAS.filter((c) => c.jogo === jogo);

  if (candidatos.length === 0) return CATALOGO_CENAS[0];

  const chaveEvt = `${jogo}:${situacao}:${eventoId}`;
  const chaveUltimo = `${jogo}:${situacao}:__ultimo`;

  if (historicoPorChave?.has(chaveEvt)) {
    return historicoPorChave.get(chaveEvt);
  }

  const ultimoId = historicoPorChave?.get(chaveUltimo);
  const semRepetir =
    candidatos.length > 1 && ultimoId
      ? candidatos.filter((c) => c.id !== ultimoId)
      : candidatos;

  const idx = hashEstavel(String(eventoId)) % semRepetir.length;
  const escolhida = semRepetir[idx];

  if (historicoPorChave) {
    historicoPorChave.set(chaveEvt, escolhida);
    historicoPorChave.set(chaveUltimo, escolhida.id);
  }
  return escolhida;
}
