# Relatório de Entrega — Modalidades Heróis e Tabuleiro (`Aula Gamificada`)

**Data:** 2026-11-18
**Especificação:** `specs/AULA_GAMIFICADA_HEROIS_TABULEIRO_SPEC.md`
**Plano:** `docs/plans/2026-11-18-aula-gamificada-herois-tabuleiro.md`
**Revisão atendida:** `docs/analises/2026-11-18-herois-tabuleiro-revisao.md`

---

## 1. Resumo da Implementação e Correções

1. **Catálogo dinâmico de 7 jogos (`quiz`, `memoria`, `associacao`, `ordenacao`, `equipes`, `herois`, `tabuleiro`):**
   - Domínio em `frontend/src/dominio/aula-gamificada/modalidades.js` e metadados em `frontend/src/components/aula-gamificada/constantes.js` e `frontend/src/config/modules.js`.
   - `HubDocente.jsx`, `CatalogoModalidades.jsx`, `AcessoAulaGamificada.jsx` e `AcessoAlunoView.jsx` refletem dinamicamente a contagem retornada pelo catálogo (sem mascarar falha de carregamento com fallback fixo).
2. **Mídias originais preservadas:**
   - Extraídas de `/Users/kelsopalheta/Documents/Jogos pedagógicos/` para `frontend/public/aula-gamificada/herois/` (39 arquivos: trilha MP3, 19 GIFs e imagens) e `frontend/public/aula-gamificada/tabuleiro/` (11 arquivos: fundo, personagens/peões Azul e Verde, casa-bloco convertida para PNG, 5 GIFs e trilha MP3).
   - `ControladorAudioJogo.jsx` oferece `<audio>` com botão acessível `Som: Ligado / Desligado` (`aria-pressed`), sem autoplay forçado, e controle de movimento reduzido (`prefers-reduced-motion` + toggle manual) que substitui GIFs por imagens estáticas correspondentes.
3. **Regras autoritativas e proteção contra placeholders:**
   - `questoes.js`: `rejeitarPlaceholders` bloqueia com HTTP `422` textos-placeholder (`"Digite aqui a pergunta"`, `"Resposta incorreta"`, `"Resposta correta"`).
   - `sala.js` e `AulaGamificadaService.js`:
     - **Heróis:** feedback individual imediato (`estadoHeroi`: `'vitoria_fase'`, `'golpe_tente_novamente'`, `'golpe_encerrado'`), máximo 2 tentativas dentro do prazo `encerraEmMs`, proteção contra pontuação duplicada (`1000` pts consolidado uma única vez por rodada) e sigilo de gabarito/coletivo até o comando `revelar`.
     - **Tabuleiro:** equipes padrão `Equipe Azul` e `Equipe Verde` com alunos distribuídos automaticamente (mín. 2, máx. 4 equipes validadas no cliente e no servidor com `422`), turno cíclico por rodada (`409` fora da vez), avanço **único** ao executar `revelar` (`Passe a vez`, `Ops. Não ande! Você errou`, `Avance 1 casa` em `facil`/`medio`, `Avance 2 casas` em `dificil`), chegada na casa `12` e ranking ordenado por `posicaoTabuleiro` decrescente + `pontos`.
4. **Correções da revisão independente (`docs/analises/2026-11-18-herois-tabuleiro-revisao.md`):**
   - Propagação de `bloqueado` em `SalaAlunoView.jsx` para `JogoHerois` e `JogoTabuleiro` (bloqueia envio quando desconectado).
   - Idempotência com `requestId` estável por tentativa pendente (`resolverRequestIdOperacao`), novo `requestId` após confirmação de erro na 1ª tentativa, e tratamento visível de erro (`role="alert"`).
   - Movimento reduzido usando imagens estáticas em `JogoHerois` e `JogoTabuleiro`.
   - Feedback pedagógico docente com `explicacao` e destaque do gabarito (`Correta`) na fase `feedback`, além da celebração temática montada em `fase === 'encerrada'`.
   - `PrepararSala.jsx` com prévia editável consistente, limite de 4 equipes no Tabuleiro e distribuição automática de novos alunos ao marcar outra turma.

---

## 2. Validação Automatizada

- **Testes direcionados (`HeroisTabuleiroRevisaoIndependente`, `HeroisTabuleiroUI`, `aula_gamificada_herois_tabuleiro`, `aula_gamificada_banco` e `tests/unit/components/aula-gamificada/`):**
  - **16 arquivos / 63 testes aprovados (0 falhas).**
- **ESLint (`npm --prefix frontend run lint`):**
  - **0 erros** (apenas avisos pré-existentes/de `<img>` estático).
- **Build de produção (`npm --prefix frontend run build`):**
  - **Aprovado** (`next build` concluído com 42/42 páginas estáticas).

---

## 3. Evidências Visuais (Dados Sintéticos)

Capturas reais renderizadas no bundle de produção (`next start`) em `docs/evidencias/2026-11-18-aula-gamificada-herois-tabuleiro/`:
- `01-herois-aluno-mobile.png` (`390×844` — visão do aluno no celular)
- `02-herois-desktop.png` (`1440×900` — GIF original, alternativas e feedback individual `"Que golpe! Você errou! Tente novamente"`)
- `03-tabuleiro-aluno-mobile.png` (`390×844` — trilha em blocos e controles no celular)
- `04-tabuleiro-desktop.png` (`1440×900` — trilha `Início → 1..11 → Chegada`, peões Azul/Verde originais e carta `"Parabéns, avance 2 casas."`)
