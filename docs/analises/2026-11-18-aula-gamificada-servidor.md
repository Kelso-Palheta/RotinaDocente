# Aula Gamificada — servidor, banco e geração IA

Data: 18/11/2026 (2ª etapa: correções da revisão independente)
Escopo: seção “DeepSeek — servidor, banco e geração IA” de `docs/plans/2026-11-18-aula-gamificada.md`.
Contrato: `specs/AULA_GAMIFICADA_SPEC.md` (congelado) + correções de `docs/analises/2026-11-18-aula-gamificada-revisao-independente.md`. Interface e páginas não foram alteradas.

## Entregue

### Domínio (`frontend/src/dominio/aula-gamificada/`)

- `comum.js`: erros públicos `falha(status, message)`, validação de textos/segmentos, hashes determinísticos, embaralhamento com semente, limpeza de HTML/texto vindo da IA e geração de IDs.
- `modalidades.js`: as cinco modalidades, tipos de questão aceitos, rejeição de combinação incompatível e texto da regra de pontuação exibido na preparação.
- `questoes.js`: normalização e validação dos três tipos (`multipla_escolha`, `pares`, `ordenacao`), derivação de gabarito, IDs públicos novos e não inferíveis para cartas de pares, projeção pública sem gabarito/explicação/tabela privada, tabuleiro de memória só com IDs e projeção de faces (`facesDasCartas`) apenas para o que o jogador pode ver, além da validação das respostas dos alunos.
- `pontuacao.js`: 1000 pontos por acerto no quiz/equipes; proporção arredondada para associação, ordenação e memória; ranking com empate compartilhado e soma por equipe.
- `sala.js`: máquina de estados `espera → pergunta → feedback → ranking → próxima pergunta/encerrada`, congelamento do conteúdo por rodada, validação de comando/prazo, roster de participantes, projeção de estado por papel, ocultação da pontuação da rodada até a revelação e faces de memória por recibo/reconexão.
- `geracao.js`: validação da entrada, prompt com quantidades exatas por dificuldade, defesa contra instruções embutidas no material, limpeza de HTML, preparação de ordenação limpando itens e gabarito com o mesmo critério e validação de formato/quantidade/gabarito da resposta da IA.
- `comum.js` (revisão): `limparTextoIA` remove apenas tags HTML reais (`<letra ...>`), preservando desigualdades e fórmulas como `Se x < 2 e y > 3`. Entidades são decodificadas antes da limpeza, para que HTML escapado também seja neutralizado.

### Aplicação (`frontend/src/aplicacao/aula-gamificada/AulaGamificadaService.js`)

- Catálogo privado por docente (questões, turmas, salas e roster mínimo por turma com ID de participante já calculado).
- Criação/edição de questão com `expectedRevision`, retorno obrigatório a rascunho e preservação do trabalho em conflito.
- Revisão docente obrigatória, com explicação pedagógica validada no servidor.
- Geração BYOK: recebe a configuração da IA por header, devolve rascunhos completos e não persiste nada.
- Criação de sala apenas com questões revisadas e compatíveis, código único, conteúdo congelado, roster congelado e equipes validadas.
- Entrada e estado do aluno com vínculo vigente, turma autorizada, matrícula ativa no diário e participante da sala.
- Entrada transacional: revalida o vínculo dentro da transação e atualiza apenas a presença, preservando pontos e progresso de uma resposta concorrente.
- Comandos do docente com revisão otimista, idempotência por `requestId`, leitura do conteúdo da rodada de destino antes das escritas e uma única transição vencedora em concorrência.
- Respostas dos cinco jogos, com validação de opções/itens, pontuação exclusivamente no servidor, recibo idempotente e rejeição de prazo vencido/repetição manipulada.
- Memória com tabuleiro individual persistido, fechamento do par errado na próxima virada, conclusão calculada uma vez e progresso agregado para o professor.
- Consolidação idempotente da pontuação de memória (valor absoluto, sem soma dupla).

### Infraestrutura (`frontend/src/infraestrutura/aula-gamificada/`)

- `FirestoreStore.js`: reutiliza o store Admin da Revisão, sem modificar aquele módulo.
- `acessoServidor.js`: Bearer Firebase para docente e sessão do Portal (`aluno_session`) para aluno.
- `runtimeServidor.js`: Firestore Admin, IDs/códigos criptográficos e adaptador `callAI` + `extrairJsonIA` com a configuração BYOK do header.
- `httpServidor.js`: handler puro, roteamento, origem obrigatória em POST, limite de corpo, erros `{error, message}` e redação da chave de IA na resposta.

### Rota

`frontend/src/app/api/aula-gamificada/[...partes]/route.js` com `runtime = 'nodejs'`, `dynamic = 'force-dynamic'` e `maxDuration = 300`.

Rotas implementadas exatamente conforme o contrato:

| Método | Rota | Papel |
| --- | --- | --- |
| GET | `/api/aula-gamificada/catalogo` | docente |
| POST | `/api/aula-gamificada/gerar` | docente |
| POST | `/api/aula-gamificada/questoes` | docente |
| POST | `/api/aula-gamificada/questoes/{id}/revisar` | docente |
| POST | `/api/aula-gamificada/salas` | docente |
| POST | `/api/aula-gamificada/salas/{codigo}/entrar` | aluno |
| GET | `/api/aula-gamificada/salas/{codigo}/estado` | docente/aluno |
| POST | `/api/aula-gamificada/salas/{codigo}/comandos` | docente |
| POST | `/api/aula-gamificada/salas/{codigo}/respostas` | aluno |

## Persistência

- `aulaGamificadaDocentes/{uid}/questoes/{id}` — banco privado do professor.
- `aulaGamificadaDocentes/{uid}/requisicoes/{hash}` — idempotência de criação/edição/revisão de questão, criação de sala e comandos.
- `aulaGamificadaSalas/{codigo}` — sala e revisão otimista.
- `aulaGamificadaSalas/{codigo}/conteudos/{indice}` — cópia pública congelada + segredo privado (gabarito, explicação, tabela de pares e questão completa).
- `aulaGamificadaSalas/{codigo}/participantes/{id}` — roster congelado, pontos, equipe, presença e progresso de memória.
- `aulaGamificadaSalas/{codigo}/respostas/{rodada}_{participante}` — resposta, recibos por `requestId`, estado do tabuleiro de memória e pontos da rodada.

Nenhuma coleção de notas, recuperação ou redação é tocada. Leituras sempre precedem escritas dentro das transações.

## Decisões relevantes para a integração

1. **Criação x edição de questão**: presença de `expectedRevision` significa edição. Ausência significa criação — inclusive para salvar um rascunho gerado pela IA, que já chega com `id` do servidor. Criar com um `id` já existente retorna 409.
2. **`requestId` obrigatório** em `POST /questoes`, `/questoes/{id}/revisar`, `/salas`, `/comandos` e `/respostas`. Repetir o mesmo `requestId` devolve o mesmo resultado sem reaplicar efeitos.
3. **`POST /gerar`** aceita `modalidade` opcional para validar a compatibilidade do tipo antes de chamar a IA. O material deve chegar já extraído e confirmado em `textoMaterial`; upload/extração continuam nos extratores existentes.
4. **BYOK**: a chave viaja em `x-user-ai-key` e é redigida de qualquer resposta por segurança. Nenhuma chave é gravada.
5. **POST exige `Origin`** igual à origem da requisição; GET não exige.
6. **Estado do aluno** nunca inclui `participantes`, `distribuicao` nem dados de colegas. O recibo próprio é a única resposta individual exposta.
7. **Feedback**: `gabarito`, `explicacao` e `paresCorretos` só aparecem depois de `revelar`. Em memória, `paresCorretos` inclui as faces (`esquerda`/`direita`) para o feedback final.
8. **Memória**: o tabuleiro público (`rodada.questao.cartas`) traz **apenas os IDs embaralhados**. As faces visíveis vêm em `rodada.faces` e nos campos de face do recibo, sempre limitadas ao que o jogador já virou ou encontrou. O recibo traz `virarId`, `cartasReveladas` (IDs desta ação), `cartasEncontradas` (IDs cumulativos), `cartasVisiveis` (IDs do tabuleiro aberto), `facesVisiveis`, `facesEncontradas` e `completo`.
9. **Ranking** aparece em `ranking` e `encerrada` (somente após revelação); empates compartilham posição e a seguinte é saltada.
10. **Timeout**: o prazo é sempre o do servidor (`prazo`/`servidorAgora`); respostas depois de `prazo` retornam 409.
11. **Pontuação antes da revelação**: `eu.pontos`, o recibo (campo `pontos`) e a lista `participantes` do docente publicam apenas a pontuação consolidada de rodadas já reveladas. A pontuação da rodada corrente fica oculta até `revelar`; depois disso os totais e o ranking aparecem integralmente.
12. **Troca de rodada**: `proxima` projeta imediatamente o conteúdo congelado da rodada nova; a leitura ocorre antes de qualquer escrita da transação.
13. **Entrada idempotente**: repetir `entrar` não reescreve o participante. A atualização de presença acontece em transação, relê o documento e altera somente `entrouEmMs`.
14. **Texto da IA**: a limpeza neutraliza tags HTML reais e mantém expressões matemáticas. A interface deve renderizar como texto (nunca `dangerouslySetInnerHTML`).

## Integração com Antigravity

O catálogo docente passou a incluir o roster mínimo por turma, com o ID de participante já calculado pelo servidor (mesmo SHA-256 usado na sala):

```json
{
  "turmas": [
    {
      "id": "turma-1",
      "nome": "6º ano A",
      "totalAlunos": 2,
      "alunos": [
        { "id": "<participanteId estável>", "alunoId": "a1", "nome": "Ana" },
        { "id": "<participanteId estável>", "alunoId": "a2", "nome": "Bia" }
      ]
    }
  ]
}
```

- A interface deve usar `alunos[].id` em `equipes[].participanteIds`; `alunoId` serve apenas para exibição/ordenação local.
- Alunos homônimos e o mesmo `alunoId` em turmas distintas permanecem distintos porque o `id` combina turma + aluno.
- O mínimo de duas equipes continua validado no servidor; mensagem `Cadastre pelo menos duas equipes para este modo.`
- O roster é entregue apenas no catálogo autenticado do docente; o estado do aluno não expõe colegas.
- Memória: renderizar o tabuleiro pela ordem de `rodada.questao.cartas` (IDs) e buscar a face em `rodada.faces`/`eu.recibo.faces*`; sem face, renderizar o verso. Não inferir a face a partir do ID.

## Testes

Arquivos do servidor (nenhum teste recebido foi apagado):

- `tests/unit/aula_gamificada_questoes.test.js`
- `tests/unit/aula_gamificada_pontuacao.test.js`
- `tests/unit/aula_gamificada_geracao.test.js`
- `tests/unit/aula_gamificada_sala.test.js`
- `tests/unit/aula_gamificada_matematica_revisao.test.js` — regressão da revisão (1 caso)
- `tests/integration/aula_gamificada_banco.test.js`
- `tests/integration/aula_gamificada_jogos.test.js`
- `tests/integration/aula_gamificada_revisao_independente.test.js` — regressões da revisão (4 casos)
- `tests/contract/aula_gamificada_http.test.js`

Cobrem: validação de questões/dificuldades, gabarito privado, IDs de pares, revisão obrigatória, sanitização da IA, quantidades exatas, máquina de estados, isolamento por professor/turma/aluno, turma arquivada e aluno removido, idempotência de questão/sala/comando/resposta, entrada repetida e concorrente, concorrência de comando e de resposta, prazo vencido, repetição manipulada, os cinco jogos, memória (virada, erro, conclusão, consolidação única e tabuleiro oculto), equipes, ranking com empate, reconexão, contrato HTTP completo e preservação de desigualdades matemáticas.

## Correções da revisão independente (18/11/2026)

Aplicadas em `docs/analises/2026-11-18-aula-gamificada-revisao-independente.md`, sem tocar nos arquivos da interface:

1. **Memória deixava de expor faces ocultas** — `questaoPublica` agora entrega só os IDs embaralhados do tabuleiro. As faces são projetadas por `projetarEstado` (`rodada.faces`) e pelo recibo (`facesVisiveis`/`facesEncontradas`), sempre limitadas ao que o jogador virou ou encontrou; após `revelar`, o tabuleiro completo e `paresCorretos` com as faces são liberados a todos. A cobertura exige duas identidades distintas, o par errado fechado e os pares encontrados.
2. **Entrada podia apagar pontos** — `entrar` virou transação: valida o ator, revalida o vínculo e a matrícula dentro da transação, relê o participante e grava apenas `entrouEmMs`, preservando pontos e progresso de respostas concorrentes. Cobertura de repetição e corrida adicionada.
3. **Pontos antecipavam o gabarito** — `projetarEstado` projeta a pontuação consolidada das rodadas reveladas (`total − pontos da rodada corrente`) para `eu.pontos` e para `participantes` do docente; `recibo.pontos` continua só após `revelar`. Totais e ranking permanecem íntegros.
4. **Troca de rodada devolvia a questão antiga** — `comandar` lê o conteúdo da rodada de destino (antes de qualquer escrita) e o usa na projeção de `proxima`; leituras continuam sempre antecedendo escritas.
5. **Limpeza removia matemática legítima** — `limparTextoIA` decodifica entidades, remove comentários, blocos ativos e apenas tags reais (`</?[a-zA-Z]...>`); `Se x < 2 e y > 3, compare x e y.` sobrevive intacto. `prepararOrdenacao` limpa itens e gabarito com o mesmo critério, mantendo o texto do gabarito compatível com os itens publicados.

## Complementos de integração (2ª revisão — 18/11/2026)

1. **Presença vs. respondentes na rodada (`sala.js`)**:
   - Na projeção docente (`ator.tipo === 'professor'`), cada item de `estado.participantes` passa a incluir `respondeu: boolean` e `rodadaRespondida: number` (somente quando `respondeu === true` na rodada atual, derivado exclusivamente do registro de resposta da rodada e nunca de `entrouEmMs` ou `pontos`).
   - O estado docente também inclui `estado.respondentes`: lista pública `[{ id, nomeExibicao }]` dos participantes que responderam na rodada corrente, sem qualquer alternativa/resposta associada.
   - O estado discente (`ator.tipo === 'aluno'`) continua sem `participantes`, `respondentes` ou `distribuicao`.
2. **Proteção de IDs manuais e embaralhamento não dedutível (`questoes.js`, `sala.js`, `AulaGamificadaService.js`)**:
   - `AulaGamificadaService.salvarQuestao` passa `novosIdsPares: true` e `novosIdsItens: true` para `normalizarQuestao`, regenerando IDs opacos e independentes tanto para cartas de `pares` quanto para itens de `ordenacao` mesmo em entradas manuais (e remapeando `respostaCorreta` correspondentemente).
   - `montarConteudo` combina `${codigo}:${indice}:${questao.id}` com `segredoSemente` gerada via `this.gerarId()` (`randomUUID()` em produção, fallback aleatório se omitida) que nunca é publicada em `questaoPublica` nem no estado do cliente, impedindo reconstruir o embaralhamento a partir de `codigo`, `rodada` e `questao.id`.
   - Nova suíte de regressão: `tests/integration/aula_gamificada_complementos_revisao.test.js` (3 casos).

## Verificação executada

- Foco do servidor: `npx vitest run` nos 9 arquivos do módulo — **64 testes, 9 arquivos, 100% aprovados** (58 da entrega + 5 regressões da revisão + 1 de entrada repetida/concorrente).
- Suíte completa: `npm test` — **1630 testes aprovados, 10 ignorados; 353 arquivos aprovados, 4 ignorados; 1 arquivo com 4 falhas**. As 4 falhas estão em `tests/unit/components/aula-gamificada/RevisaoIndependenteInterface.test.jsx` (interface, em edição pelo Antigravity): retenção de `requestId`, contagem de respondentes, limpeza de banco na troca de docente e um caso de ordenação. Nenhuma delas importa módulo do servidor; não foram tocadas.
- Lint: `npx eslint` nos arquivos de `src` do módulo — **0 erros**. Os testes ficam fora do base path do ESLint do `frontend`, então são ignorados pela configuração atual.
- Build: `NODE_USE_SYSTEM_CA=1 npm run build` — **sucesso**, com `/api/aula-gamificada/[...partes]` listada como rota dinâmica.

## Pendências fora deste escopo

- Interface, páginas, projeção e extração de anexos pertencem à entrega paralela; este relatório apenas fixa o contrato que elas consomem.
- Sem commit/push nesta etapa, conforme a tarefa.
