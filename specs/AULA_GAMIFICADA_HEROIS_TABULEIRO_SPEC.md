# Especificação — Novas Modalidades da Aula Gamificada (`herois` e `tabuleiro`)

**Data:** 2026-11-18
**Status:** Revisada para aprovação (pré-implementação)
**Base normativa:** `specs/AULA_GAMIFICADA_SPEC.md`, `specs/PALETA_ARTE_EM_JOGO_SPEC.md`, `AGENTS.md`

---

## 1. Objetivo

Adaptar os dois jogos pedagógicos analisados em `/Users/kelsopalheta/Documents/Jogos pedagógicos/` para o ecossistema **Aula Gamificada** do `RotinaDocente` como duas novas modalidades oficiais, elevando o catálogo de **5 para 7 jogos**:

1. **`herois` ("Heróis")**, derivado de `Herois.pptx` e `Herois.key`.
2. **`tabuleiro` ("Tabuleiro")**, derivado de `Jogo de tabuleiro minicraft_1.key` e `Jogo de tabuleiro minicraft_2.key`.

As novas modalidades preservam **o visual, as animações (GIFs e transições), o áudio original e as mecânicas** dos arquivos fornecidos pelo usuário, operando integradas ao **banco de questões**, **todas as disciplinas**, **três níveis de dificuldade (`facil`, `medio`, `dificil`)** e **geração por IA (`POST /api/aula-gamificada/gerar`)**, com controles acessíveis para **celular** (aluno) e **telão** (docente/projeção).

---

## 2. Diagnóstico dos Arquivos Originais

### 2.1 `Herois.key` e `Herois.pptx`
- **Relação entre arquivos:** `Herois.key` (179 entradas) e `Herois.pptx` (141 entradas) representam o mesmo jogo (mesma trilha MP3 `media1.mp3` de 1.972.989 bytes e mesmos 19 GIFs animados `image1.gif`..`image19.gif`).
- **Estrutura original (32 slides em `Herois.pptx`):**
  - Slide 1: Capa com botão `"Jogar"`, áudio `media1.mp3` e transição para a primeira pergunta.
  - Blocos de 3 slides por pergunta:
    1. **Pergunta** com 3 alternativas (`A`, `B`, `C`).
    2. **Acerto** (`"Parabéns!!!! Você conseguiu!"` + GIF celebratório + `"Vamos para a próxima"`).
    3. **Erro** (`"Que golpe! Você errou! Tente novamente"` + GIF de impacto + retorno à pergunta).
  - Slides 2–25: 8 questões reais de Arte Conceitual / Instalação.
  - **Slides 26–28 e 29–30 (IGNORAR):** Perguntas-placeholder vazias (`"Digite aqui a pergunta"`, `"Resposta incorreta"`, `"Resposta correta"`).
  - Slide 31: Vitória (`"Comemore! Vocês conseguiram!"` + `image19.gif`).
  - Slide 32: Encerramento (`"Fim de jogo"` + `media1.mp3`).

### 2.2 Diferenças entre `Jogo de tabuleiro minicraft_1.key` e `Jogo de tabuleiro minicraft_2.key`
Comparação binária (SHA-256) e de conteúdo descomprimido (`.iwa` Snappy) entre os dois arquivos de 94 entradas:

| Aspecto | `Jogo de tabuleiro minicraft_1.key` | `Jogo de tabuleiro minicraft_2.key` | Conclusão |
|---|---|---|---|
| Estrutura de slides | 17 slides (Capa, Tabuleiro, 4 Cartas de Evento, 11 Perguntas) | 17 slides (mesma estrutura) | Idêntica |
| Áudio (`Data/Rap do Minecraft ...mp3`) | 3.071.818 bytes | Mesmo hash SHA-256 | Idêntico |
| Mídias (imagens, GIFs `image6..10.gif`, Steve, Alex, lobo, casa) | Mesmos arquivos | Mesmos hashes SHA-256 | Idênticas |
| Capa (`Index/Slide.iwa`, `"jogar"`) | 3.746 bytes | 3.746 bytes (diff apenas de metadados) | Funcionalmente idêntica |
| Tabuleiro (`Index/Slide-798-2.iwa`) | Trilha `Início` → `Chegada`, peões Azul e Verde (`motion-path`), painel `Perguntas` (`P-1..P-11`), `Parabéns!` | Mesmo tabuleiro e animações (diff pontual de metadado `ppear-` vs `ppearm` e miniaturas `Data/st-*.jpg` regeneradas) | Funcionalmente idêntico |
| Cartas de resultado (Slides 3–6) | `Parabéns, avance 1 casa.`, `Parabéns, avance 2 casa.`, `Passe a vez`, `Ops. Não ande! Você errou` | Mesmas 4 cartas | Idênticas |
| **11 slides de perguntas (`Slide-1250-2.iwa` a `Slide-2001-2.iwa`)** | **Conjunto 1** (11 perguntas sobre Arte Conceitual e Instalação, 4 alternativas cada) | **Conjunto 2** (11 perguntas **totalmente distintas** sobre Arte Conceitual e Instalação, 4 alternativas cada) | **Única diferença pedagógica real** |

---

## 3. Preservação de Referências Visuais e Mídias Originais

- As mídias originais fornecidas pelo usuário nos arquivos `.pptx` e `.key` serão extraídas para pastas locais dedicadas em `frontend/public/aula-gamificada/`:
  - `frontend/public/aula-gamificada/herois/`: capa/cenário, botões, 19 GIFs de feedback/vitória e trilha MP3 (`trilha-herois.mp3`).
  - `frontend/public/aula-gamificada/tabuleiro/`: cenário/fundo, peões Azul (Steve) e Verde (Alex), GIFs das 4 cartas de evento e celebração (`image6..10.gif`), imagens convertidas para formato web (`.tif` → `.png`) e trilha MP3 (`trilha-tabuleiro.mp3`).
- **Preservação fiel:** `JogoHerois.jsx` e `JogoTabuleiro.jsx` exibem as imagens, GIFs animados e players de áudio `<audio>` apontando diretamente para essas mídias originais, mantendo a estética de cada jogo.
- **Controles acessíveis para áudio e movimento:**
  - Botão explícito **`Som: Ligado / Desligado`** (`aria-pressed`), sem autoplay bloqueado pelo navegador e sem falha em ambientes sem mídia/áudio (ex.: testes jsdom).
  - Respeito a **`prefers-reduced-motion`** e toggle manual **"Animações reduzidas"**: quando ativo, pausa/substitui animações de movimento/tremor e exibe versão estática/badge de alto contraste mantendo todo o conteúdo legível.

---

## 4. Integração ao Modelo de Domínio e Catálogo Dinâmico

### 4.1 Catálogo de 7 Jogos
- `frontend/src/dominio/aula-gamificada/modalidades.js` passa a registrar **7 modalidades**:
  `quiz`, `memoria`, `associacao`, `ordenacao`, `equipes`, `herois`, `tabuleiro`.
- Contagens exibidas na interface (`HubDocente.jsx` e `CatalogoModalidades.jsx`) devem ser **dinâmicas** com base no total de modalidades retornadas pelo catálogo (`${modalidades.length} jogos`), removendo textos fixos `"5 jogos"` / `"cinco modalidades"` para refletir **7 jogos**.

### 4.2 Questões, Disciplinas, Dificuldades e Proteção contra Placeholders
- Ambas as modalidades aceitam `tipo: 'multipla_escolha'` (3 a 5 alternativas), compatíveis com o banco de questões, criação manual, todas as disciplinas, séries e geração por IA (`POST /api/aula-gamificada/gerar`).
- Validação em `questoes.js` rejeita com HTTP `422` textos-placeholder conhecidos dos arquivos originais (`"Digite aqui a pergunta"`, `"Resposta incorreta"`, `"Resposta correta"`).

---

## 5. Regras Únicas e Testáveis de Jogo (Servidor Autoritativo)

### 5.1 Modalidade `herois` — `"Tente novamente"`, Prazo e Anti-duplicação
- **Fluxo da sala:** `espera → pergunta → feedback → ranking → proxima/encerrada`.
- **Prazo:** Cada rodada tem prazo único controlado pelo servidor (`encerraEmMs = agora + tempoSegundos * 1000`). Nenhuma resposta é aceita após `agora >= sala.encerraEmMs` ou fora de `fase === 'pergunta'` (HTTP `409`).
- **Regra única de `"Tente novamente"`:**
  1. Cada participante tem **no máximo 2 tentativas** por rodada dentro do mesmo prazo (`encerraEmMs`).
  2. **1ª tentativa (`tentativas === 1`):**
     - **Acertou:** `acertou = true`, `pontosRodada = 1000`, `podeTentarNovamente = false`, `estadoHeroi = 'vitoria_fase'`.
     - **Errou:** `acertou = false`, `pontosRodada = 0`, `podeTentarNovamente = true`, `estadoHeroi = 'golpe_tente_novamente'`. O aluno recebe imediatamente o feedback `"Que golpe! Você errou! Tente novamente"` e pode reenviar uma nova alternativa com novo `requestId` enquanto `agora < sala.encerraEmMs`.
  3. **2ª tentativa (`tentativas === 2`):**
     - **Acertou:** `acertou = true`, `pontosRodada = 1000`, `podeTentarNovamente = false`, `estadoHeroi = 'vitoria_fase'`.
     - **Errou:** `acertou = false`, `pontosRodada = 0`, `podeTentarNovamente = false`, `estadoHeroi = 'golpe_encerrado'`.
- **Proteção contra pontuação duplicada e replay:**
  - Cada resposta armazenada para `(participanteId, rodada)` guarda `tentativas`, `pontosRodada` (`0` ou `1000`) e `requestIds` processados.
  - Reenvio com `requestId` já processado retorna de forma idempotente o recibo correspondente sem alterar pontuação nem incrementar `tentativas`.
  - Novo `requestId` quando `acertou === true` ou `tentativas >= 2` é rejeitado com HTTP `409` (`"Você já concluiu suas tentativas nesta rodada."`).
  - A pontuação acumulada do participante soma **exatamente `pontosRodada`** uma única vez por rodada (máximo `1000` pontos por rodada).

### 5.2 Modalidade `tabuleiro` — Turnos, Avanço, `"Passe a vez"`, Vitória e Ranking
- **Equipes e Peões:**
  - Mínimo de 2 equipes e máximo de 4 equipes por sala; quando não informadas na criação, inicializa `Equipe Azul` e `Equipe Verde`.
  - Trilha fixa de `totalCasas = 12` posições (`0 = Início` até `12 = Chegada`). Todas as equipes iniciam na casa `0`.
- **Regra única de Turnos:**
  - Cada rodada pertence a **uma única equipe da vez**, determinada de forma fixa e cíclica por:
    `equipeDaVez = equipes[(rodada - 1) % equipes.length]`.
  - Apenas participantes da `equipeDaVez` podem responder na rodada atual. Tentativa de envio por participante de outra equipe é rejeitada com HTTP `409` (`"Rodada exclusiva da equipe da vez."`).
- **Regra única de Avaliação e Cartas de Evento (ao executar `encerrar_rodada` → `revelar`):**
  - Seja `respondentes` o total de participantes da `equipeDaVez` que enviaram resposta na rodada e `acertos` o total deles que acertou a questão:
    1. **Zero respondentes (`respondentes === 0`):**
       - Carta: **`Passe a vez`** (`"Passe a vez"`).
       - Avanço: **`0` casas**.
    2. **Erro coletivo (`respondentes > 0` e `acertos / respondentes <= 0.5`, ou seja, sem maioria estrita `> 50%`):**
       - Carta: **`Ops. Não ande! Você errou`**.
       - Avanço: **`0` casas**.
    3. **Acerto da equipe (`respondentes > 0` e `acertos / respondentes > 0.5`):**
       - Se questão `dificil` → Carta: **`Parabéns, avance 2 casas.`** (`+2` casas).
       - Se questão `facil` ou `medio` → Carta: **`Parabéns, avance 1 casa.`** (`+1` casa).
  - Atualização da posição: `posicaoTabuleiro = Math.min(totalCasas, posicaoAtual + avanco)`. Nunca há recuo nem extrapolação acima de `12`.
- **Regra única de Vitória e Encerramento:**
  - Se a `equipeDaVez` atingir `posicaoTabuleiro === 12` (`Chegada`), `vencedorChegadaId` é gravado no estado da sala e exibido com a tela/GIF `"Parabéns!"`.
  - Após revelar e abrir `ranking`, o comando `proxima` encerra imediatamente a sala (`fase = 'encerrada'`) se `vencedorChegadaId` estiver definido ou se `rodada === totalRodadas`.
- **Regra única de Ranking (`rankingEquipes`):**
  - Ordenado por:
    1. `posicaoTabuleiro` decrescente (maior casa alcançada);
    2. Desempate por `pontos` totais da equipe decrescentes (soma dos `1000` pontos por acerto individual dos integrantes).
  - Empate idêntico em `(posicaoTabuleiro, pontos)` recebe a mesma `posicao` e `empate: true`.

---

## 6. Contratos HTTP Existentes

Reutiliza **exclusivamente** os endpoints já definidos em `specs/AULA_GAMIFICADA_SPEC.md` (sob `/api/aula-gamificada`):

- **`GET /catalogo`** → `{ modalidades, turmas, questoes, salas }`, passando a incluir `herois` e `tabuleiro` em `modalidades` (total de 7).
- **`POST /gerar`** → aceita `modalidade: 'herois' | 'tabuleiro'` com `tipo: 'multipla_escolha'` para qualquer `disciplina`, `anoEscolar` e distribuição de `facil`/`medio`/`dificil`.
- **`POST /salas`** → aceita `modalidade: 'herois' | 'tabuleiro'`; para `tabuleiro`, inicializa `equipes` (padrão Azul e Verde) e `tabuleiroEstado: { totalCasas: 12, posicoesPorEquipe, equipeDaVezId, ultimaCarta, vencedorChegadaId }`.
- **`GET /salas/{codigo}/estado`** → `{ estado }` projetado por papel (`docente`/telão e `aluno`):
  - Em `herois`, inclui no recibo do aluno `tentativas`, `maxTentativas: 2`, `podeTentarNovamente`, `estadoHeroi`.
  - Em `tabuleiro`, inclui `equipeDaVezId`, `posicoesPorEquipe`, `ultimaCarta`, `vencedorChegadaId` e `rankingEquipes` ordenado por casa + pontos.
  - Mantém `respostaCorreta` e `explicacao` ocultos enquanto `fase === 'pergunta'` ou `revelado === false`.
- **`POST /salas/{codigo}/respostas`** → valida prazo, equipe da vez (em `tabuleiro`), limite de 2 tentativas e idempotência por `requestId` (em `herois`).
- **`POST /salas/{codigo}/comandos`** → mantém `expectedRevision` otimista e transições oficiais do professor.

---

## 7. Acessibilidade (Celular e Telão)

- **Telão (Docente):** layout 16:9 sem rolagem horizontal, contraste WCAG AA (≥ 4.5:1), atalhos de teclado (`M` para som, `Enter`/`Space` nos comandos), indicador explícito de equipe da vez (`Azul`, `Verde`, ...) com cor + texto + ícone.
- **Celular (Aluno):** botões de alternativa `min-h-12` (`>= 48px`), rótulos `A..E`, região `aria-live="polite"` anunciando `"Que golpe! Você errou! Tente novamente"` (com tentativas restantes) ou bloqueio de aguardo da equipe da vez, e botão de áudio sem autoplay forçado.
