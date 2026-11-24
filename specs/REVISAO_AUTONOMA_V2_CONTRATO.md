# Contrato — Aventura do Conhecimento V2 (desafios no percurso)

Complementa `REVISAO_AUTONOMA_IMERSIVA_V2_SPEC.md`. Escrito antes do código; testes mapeados em `TESTS_SPEC.md` (LIVRE-V2-*).

## Versionamento
- `schema` ausente/1 = V1 (uma questão = uma fase). Continua retomável com as regras originais.
- `schema: 2` = V2. Criada somente quando o pedido de criação traz `fases` (ou quando a origem do reforço é V2).
- Nenhuma migração: documentos V1 não são reescritos.

## Configuração V2
- `fases` 1–6, `estrelasPorFase` 1–3; questões por fase = estrelas + 1 (portal); total ≤ 24.
- Exceção explícita: se o conteúdo tem apenas 1 questão liberada, `fases=1, estrelasPorFase=0` (só portal).
- Necessário = `fases × (estrelasPorFase + 1)`; disponível = questões revisadas e liberadas à turma. Necessário > disponível → 422 com os dois números. Nunca repete nem fabrica questões.
- Reforço dos erros (origem V2): `n` erros (≤ 24) distribuídos em `min(6, ceil(n/4))` fases; cada fase tem `questões-1` estrelas (≥ 0) + portal. Primeira tentativa nunca é sobrescrita (nova sessão).
- Função de domínio `opcoesConfiguracao(disponivel)` usada por UI e servidor; sugestão = maior configuração possível, preferindo 3×3.

## Estado privado (sessão V2)
`{schema:2, fases:[{eventos:[{id, tipo:'estrela'|'portal', questaoId, estado:'pendente'|'aberto'|'respondido'|'concluido', alternativaId?, correta?, pontos}]}], questoes[] (congeladas), faseIndice, abertoId, pontosJogo, revision, fase:'jogando'|'concluida'}`.
Tamanho real do documento é verificado (< 900 KB) antes de gravar → 422.

## Estado público (projeção)
`{schema:2, id, revision, fase, faseAtual, totalFases, disciplina, conteudo, dificuldade, eventos:[{id,tipo,estado,correta?,x,y}], estrelasRespondidas, estrelasTotal, portalLiberado, pontosJogo, acertos, erros, desafiosRespondidos, total, aberto:{eventoId, tipo, questao:{id,enunciado,alternativas[],imagem?}}|null, feedback:{eventoId,correta,alternativaId,respostaCorreta,explicacao}|null}`.
Gabarito só aparece em `feedback` do evento respondido; nenhuma questão futura é exposta.

## Operações (todas: `requestId` + `expectedRevision`, idempotentes; mesmo requestId com payload diferente → 409)
| Rota | Corpo | Regra |
|---|---|---|
| `POST sessoes` | `{professorId,disciplina,conteudo,dificuldade,requestId,fases,estrelasPorFase}` | cria V2 |
| `POST sessoes/:id/abrir` | `{eventoId}` | evento `pendente` da fase atual; apenas um aberto por vez; portal só com todas as estrelas `concluido` |
| `POST sessoes/:id/responder` | `{eventoId,questaoId,alternativaId}` | evento `aberto`; primeira resposta aceita; acerto = +100 pontos de jogo uma única vez; erro = 0 |
| `POST sessoes/:id/confirmar` | `{eventoId}` | evento `respondido` → `concluido`; libera abertoId |
| `POST sessoes/:id/avancar` | `{}` | V2: portal `concluido` → próxima fase ou `concluida` |

Autorização inalterada: login do aluno, vínculo ativo, turma, retirada de liberação (403 se uma questão pendente da fase atual foi retirada). Nenhuma escrita em notas/Diário. Pontos de jogo e acertos são campos separados; 100 pontos nunca entram em nota.

## Cliente
- Canvas com chave por fase física (`sessaoId:faseAtual`), nunca por pergunta; eventos resolvidos chegam por ref.
- Palco imersivo (fullscreen) contém HUD, canvas, controles, desafio, menu, áudio. Fullscreen e desbloqueio de áudio são pedidos dentro do gesto de “Jogar/Continuar”, antes de qualquer `await`.
- Controles: direcional à esquerda, pulo à direita, alvos ≥ 64 px, multitoque por ponteiro. Teclado A/D/setas/espaço/W (case-insensitive), ignorado em campos/botões.
- Áudio: motor compartilhado (`MotorAudioJogo`) via `ProvedorAudiovisualSala`, perfil `plataforma`, efeitos `coleta`, `salto`, `queda`, `portal`, `fase_concluida`, `acerto`, `erro`, `vitoria`. Eventos com id estável `ra:sessao:evento:situação`.

Atualização de 24/11/2026: ver `AVENTURA_FASES_AVATARES_SPEC.md` para layout 3 e oito avatares. Layout 2 e progresso de sessões antigas permanecem preservados.
