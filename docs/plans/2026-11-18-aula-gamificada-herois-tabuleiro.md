# Plano de Implementação — Modalidades `herois` e `tabuleiro` na Aula Gamificada

**Data:** 2026-11-18
**Especificação de referência:** `specs/AULA_GAMIFICADA_HEROIS_TABULEIRO_SPEC.md`
**Escopo desta entrega:** Somente especificação e plano revisados. **Nenhuma implementação será feita antes da aprovação.**

---

## 1. Extração e Organização das Mídias Originais

1. **Extrair mídias fornecidas pelo usuário** de `/Users/kelsopalheta/Documents/Jogos pedagógicos/` para ativos estáticos locais:
   - `frontend/public/aula-gamificada/herois/`: trilha `trilha-herois.mp3` (`media1.mp3`), capa/cenários (`image1.jpeg`, `image1..18.png`) e os 19 GIFs (`image1..19.gif`).
   - `frontend/public/aula-gamificada/tabuleiro/`: trilha `trilha-tabuleiro.mp3` (`Rap do Minecraft ...mp3`), cenários e personagens (`image1-8.jpeg`, `image2-11.png` [capa], `image3-13.png` [peão Azul], `image4-15.png` [peão Verde], `image6-19.tif` convertido para `image6-19.png`) e os GIFs (`image6-21.gif`, `image7-22.gif`, `image8-25.gif`, `image9-28.gif`, `image10-31.gif`).
2. **Criar manifesto de mídias** `frontend/src/components/aula-gamificada/audio/midiasJogos.js` (ou `midiasJogos.js` em `jogos/`) mapeando telas de capa, pergunta, acerto, erro/golpe, cartas de evento e vitória/chegada aos respectivos arquivos em `/aula-gamificada/herois/*` e `/aula-gamificada/tabuleiro/*`.

---

## 2. Mapa de Arquivos (Criação e Alteração)

### 2.1 Domínio e Aplicação (`frontend/src/dominio/aula-gamificada/` e `frontend/src/aplicacao/aula-gamificada/`)
1. **Alterar** `frontend/src/dominio/aula-gamificada/modalidades.js`
   - Registrar `'herois'` e `'tabuleiro'` em `MODALIDADES` (`tiposQuestoes: ['multipla_escolha']`), totalizando **7 modalidades**.
   - Atualizar mensagem de `obterModalidade` e adicionar `regraPontuacao` para `herois` e `tabuleiro`.
2. **Alterar** `frontend/src/dominio/aula-gamificada/questoes.js`
   - Adicionar `rejeitarPlaceholders` para recusar com HTTP `422` textos-placeholder (`"Digite aqui a pergunta"`, `"Resposta incorreta"`, `"Resposta correta"`).
3. **Alterar** `frontend/src/dominio/aula-gamificada/pontuacao.js`
   - Atualizar `calcularRanking` para suportar `modalidade === 'tabuleiro'`, ordenando por `posicaoTabuleiro` decrescente e desempatando por `pontos` totais da equipe decrescentes (preservando empates com mesma `posicao` e `empate: true`).
4. **Alterar** `frontend/src/dominio/aula-gamificada/sala.js`
   - Implementar regras puras e determinísticas:
     - `equipeDaVezTabuleiro(sala)`: `equipes[(rodada - 1) % equipes.length]`.
     - `avaliarRodadaTabuleiro(sala, questao, respostasRodada)`:
       - `respondentes === 0` → carta `'passe_a_vez'` (`"Passe a vez"`), avanço `0`.
       - `acertos / respondentes <= 0.5` → carta `'erro_nao_ande'` (`"Ops. Não ande! Você errou"`), avanço `0`.
       - `acertos / respondentes > 0.5` e `questao.dificuldade === 'dificil'` → carta `'avance_2'` (`"Parabéns, avance 2 casas."`), avanço `+2`.
       - `acertos / respondentes > 0.5` e `questao.dificuldade !== 'dificil'` → carta `'avance_1'` (`"Parabéns, avance 1 casa."`), avanço `+1`.
       - Clamp em `[0, 12]`; marca `vencedorChegadaId` ao atingir `12`.
     - `avaliarTentativaHerois({ sala, respostaExistente, acertou, requestId, agora })`:
       - Valida `sala.fase === 'pergunta'` e `agora < sala.encerraEmMs` (caso contrário HTTP `409`).
       - Idempotência por `requestId` já processado.
       - Bloqueia com HTTP `409` se já acertou ou se `tentativas >= 2`.
       - Permite 2ª tentativa se errou na 1ª (`podeTentarNovamente: true`, `estadoHeroi: 'golpe_tente_novamente'`).
       - Consolida `pontosRodada` (`1000` ou `0`) uma única vez por rodada.
5. **Alterar** `frontend/src/aplicacao/aula-gamificada/AulaGamificadaService.js`
   - Integrar criação de sala (`POST /salas` com equipes padrão Azul/Verde em `tabuleiro`), envio de resposta (`POST /salas/{codigo}/respostas` com turno em `tabuleiro` e 2 tentativas sem duplicação em `herois`), transições (`encerrar_rodada`, `revelar`, `proxima` encerrando ao atingir `vencedorChegadaId`) e projeção de estado em `GET /salas/{codigo}/estado` e `GET /catalogo`.

### 2.2 Camada de Apresentação (`frontend/src/components/aula-gamificada/`)
6. **Alterar** `frontend/src/components/aula-gamificada/constantes.js`
   - Incluir `herois` e `tabuleiro` em `MODALIDADES_PADRAO` (7 modalidades).
7. **Alterar** `frontend/src/components/aula-gamificada/HubDocente.jsx` e `CatalogoModalidades.jsx`
   - Substituir textos fixos `"5 jogos"` / `"cinco modalidades"` por contagem dinâmica baseada em `modalidades.length` (exibindo **7 jogos** / **7 modalidades** quando carregadas as 7).
8. **Alterar** `frontend/src/components/aula-gamificada/PrepararSala.jsx`
   - Exibir configuração de equipes (padrão `Equipe Azul` e `Equipe Verde`, até 4 equipes) quando `modalidade === 'tabuleiro'`, além de `'equipes'`.
9. **Criar** `frontend/src/components/aula-gamificada/jogos/ControladorAudioJogo.jsx`
   - Player acessível baseado em `<audio>` para `trilha-herois.mp3` e `trilha-tabuleiro.mp3`, com botão explícito `Som: Ligado / Desligado` (`aria-pressed`), sem autoplay forçado e seguro em ambientes sem suporte a mídia (jsdom/SSR).
10. **Criar** `frontend/src/components/aula-gamificada/jogos/JogoHerois.jsx`
    - Preserva visual, GIFs celebratórios/golpe e áudio de `Herois`; no celular exibe botões grandes (`min-h-12`) e estado de `"Que golpe! Você errou! Tente novamente"` com `aria-live="polite"` dentro do prazo; no telão exibe progresso da turma, fase e celebração final. Suporta `prefers-reduced-motion`.
11. **Criar** `frontend/src/components/aula-gamificada/jogos/JogoTabuleiro.jsx`
    - Preserva visual, personagens (peões Azul/Verde), GIFs das 4 cartas e áudio de `Jogo de tabuleiro minicraft`; renderiza trilha `Início` → `1..12` → `Chegada` com rótulos textuais (`Azul`, `Verde`), destaque da equipe da vez, exibição da carta da rodada e controles acessíveis no celular. Suporta `prefers-reduced-motion`.
12. **Alterar** `frontend/src/components/aula-gamificada/SalaDocenteView.jsx` e `SalaAlunoView.jsx`
    - Renderizar `JogoHerois` e `JogoTabuleiro` mantendo `RenderTextoSeguro` e sem alterar o comportamento das 5 modalidades existentes.

---

## 3. Plano de Testes (TDD — Red-Green-Refactor)

### 3.1 Testes Unitários de Domínio (`tests/unit/dominio/aula-gamificada/`)
1. `modalidadesHeroisTabuleiro.test.js`
   - Verifica total de 7 modalidades em `MODALIDADES`, aceitação apenas de `multipla_escolha` para `herois` e `tabuleiro` (`422` para `pares`/`ordenacao`) e `regraPontuacao`.
2. `placeholderGuard.test.js`
   - Rejeita com `422` questões contendo `"Digite aqui a pergunta"`, `"Resposta incorreta"` ou `"Resposta correta"`.
3. `tabuleiroRegras.test.js`
   - Testa alternância cíclica de `equipeDaVezId` por rodada.
   - Testa todas as 4 cartas: `0` respondentes → `Passe a vez` (`+0`); `<= 50%` acertos → `Ops. Não ande! Você errou` (`+0`); `> 50%` em `facil`/`medio` → `Avance 1 casa` (`+1`); `> 50%` em `dificil` → `Avance 2 casas` (`+2`).
   - Testa clamp na casa `12`, definição de `vencedorChegadaId` e ordenação do ranking (`posicaoTabuleiro` desc, depois `pontos` desc, com `empate: true`).
4. `heroisTentativas.test.js`
   - Testa 1ª tentativa errada → `podeTentarNovamente: true`, `pontosRodada: 0`, feedback `"Que golpe! Você errou! Tente novamente"`.
   - Testa 2ª tentativa certa dentro do prazo → `pontosRodada: 1000`, `podeTentarNovamente: false`.
   - Testa 2ª tentativa errada → `pontosRodada: 0`, `podeTentarNovamente: false`.
   - Testa proteção contra pontuação duplicada: repetir `requestId` retorna mesmo recibo sem somar pontos; 3ª tentativa ou tentativa após acerto retorna `409`; tentativa após `encerraEmMs` retorna `409`.

### 3.2 Testes de Integração e Contrato (`tests/integration/aula-gamificada/` e `tests/contract/`)
5. `heroisTabuleiroContratos.test.js`
   - `GET /catalogo` retorna as 7 modalidades.
   - `POST /gerar` gera questões `multipla_escolha` em disciplinas variadas e dificuldades `facil`/`medio`/`dificil` para `herois` e `tabuleiro`.
   - `GET /salas/{codigo}/estado` oculta `respostaCorreta` e `explicacao` durante `fase === 'pergunta'` / `revelado === false`.
   - Em `tabuleiro`, resposta de participante fora da `equipeDaVezId` retorna `409`; chegada na casa `12` encerra a sala após o ranking.
   - Em `herois`, fluxo completo de `"Tente novamente"` soma no máximo `1000` pontos por rodada no ranking final.

### 3.3 Testes de Componentes e Acessibilidade (`tests/unit/components/aula-gamificada/`)
6. `CatalogoContagemSeteJogos.test.jsx`
   - Verifica que `HubDocente` e `CatalogoModalidades` exibem dinamicamente **7 jogos** (e adaptam se a lista mudar).
7. `JogoHerois.test.jsx`
   - Renderiza mídias/GIFs de `herois`, botão de áudio acessível (`aria-pressed`, sem autoplay), fluxo visual de `"Tente novamente"` com `aria-live="polite"`, e respeito a `prefers-reduced-motion`.
8. `JogoTabuleiro.test.jsx`
   - Renderiza trilha `Início`..`Chegada`, peões Azul/Verde com rótulo textual, bloqueio visual fora do turno, exibição das 4 cartas, controle de áudio e `prefers-reduced-motion`.
9. `PrepararSalaTabuleiro.test.jsx`
   - Verifica configuração de equipes no preparo da sala `tabuleiro` e compatibilidade com filtros de disciplina/dificuldade.

### 3.4 Validação Final (após aprovação e implementação)
- Suíte Vitest completa (`100%` dos testes novos + `102` testes existentes intactos), `npm run lint` (0 erros) e `npm run build` (`next build`).
- Capturas em desktop (telão) e celular para `herois` e `tabuleiro`.
