# Terceira revisão — RN-81: publicação prematura de parcelas

**Commit:** `67c6a1bfe180c26459d66f3712fefe5903edcb54`.
**Resultado:** os quatro bloqueios anteriores foram corrigidos. Permanece um bloqueio de fluxo reproduzido ao combinar criação real da parcela com a rota real de entrega em banco sintético. **Correção aplicada em 28/10/2026 e validada localmente; ver seção final. Publicação continua retida para revisão independente.**

## Validação independente

- Suíte recebida: **1.002 testes em 215 arquivos aprovados**, incluindo as reproduções anteriores. Só arquivos novos foram acrescentados ao conjunto de testes no último commit.
- Build de produção: **exit 0**, com `NODE_USE_SYSTEM_CA=1`.
- Lint do escopo de produção: **0 erros e 2 avisos preexistentes de imagem**.
- Novo teste: `tests/integration/recuperacao_rascunho_entrega.test.js`, **1 falha** (`REV3-R81-01`). Código de produção e testes anteriores preservados nesta revisão. Nenhum dado real foi gravado.

## P1 — Aluno pode congelar a montagem antes de completar os dez pontos

Sequência reproduzida:

1. Professor cria conjunto vazio, previsto para duas atividades de 4 e 6 pontos.
2. A primeira parcela, de 4 pontos, é salva como atividade ativa, com token discente. O conjunto continua `estado: 'rascunho'`, com apenas `{r1: 4}` nas escalas.
3. O Portal pode listar essa atividade: o filtro atual considera o estado da atividade, sem aguardar o fechamento do conjunto.
4. Aluno envia uma resposta válida. `POST /api/aluno/entregar` retorna **200** e grava `congelado: true` no conjunto.
5. A adição da segunda parcela de 6 pontos passa a ser recusada pela proteção de composição corretamente implementada na rodada anterior.
6. A recuperação fica com 4 pontos máximos e não pode ser lançada, pois a prévia exige distribuição de exatamente 10. A tela não oferece cancelamento/reinício do conjunto; não é um fluxo concluível sem intervenção adicional.

**Local:** `frontend/src/hooks/atividades/useAtividades.js` ativa a atividade na criação; `frontend/src/lib/firebase-atividades.js` grava cada parcela nesse estado; a rota de entrega congela qualquer conjunto existente não cancelado, inclusive rascunho incompleto. O aviso para distribuir 10 pontos não impede o aluno de enviar antes disso.

**Teste:** usa `createAtividade` para salvar a primeira parcela e gerar o token; depois usa a rota `POST` com esse token. A entrega de conjunto ainda incompleto deveria ser recusada (403/409) sem congelamento/gravação. Foi recebida resposta 200. Não se trata apenas de fixture inválida construída diretamente para a rota.

## Correção delimitada

- Separar montagem de liberação discente. Enquanto a distribuição não estiver completa, salvar parcelas como rascunho e não apresentá-las como disponíveis para responder.
- Quando os máximos fecharem exatamente 10, liberar as parcelas do conjunto de forma consistente, preservando criação normal/adaptada, prazo e acessos. Pode haver uma ação explícita para disponibilizar, desde que a interface mostre o próximo passo com clareza.
- Não retirar o congelamento nem permitir alterar composição depois de uma entrega para contornar o problema.
- Revalidar no caminho confiável de entrega a elegibilidade do conjunto/atividade segundo o contrato de publicação adotado. Tratar dados legados explicitamente, sem migrar/apagar respostas ou enfraquecer as proteções existentes.
- Mostrar “montagem: 4 de 10 pontos” e só anunciar disponibilidade/envio quando o conjunto estiver efetivamente liberado.
- Testar o fluxo inteiro: primeira parcela 4 → sem entrega possível → segunda parcela 6 → ambas disponíveis → aluno entrega → composição congelada → correção/prévia/lançamento. Cobrir também uma atividade única de 10 e parcela adaptada.

## Prompt para DeepSeek / OpenCode

```text
Os quatro bloqueios anteriores passaram na revisão do commit 67c6a1b.
Corrija o bloqueio de fluxo restante documentado em:
docs/analises/2026-10-28-terceira-revisao-recuperacao-semestral.md

O teste novo tests/integration/recuperacao_rascunho_entrega.test.js já está
no workspace e reproduz o problema usando criação e entrega reais em banco
sintético. Uma primeira parcela de 4 pontos fica ativa; o aluno entrega,
congela o conjunto ainda incompleto e impede cadastrar a parcela de 6.

Implemente montagem/liberação discente consistente: conjunto incompleto
não recebe entregas; ao fechar 10 pontos, as parcelas podem ser liberadas.
Preserve o congelamento transacional depois da primeira entrega. Atualize
contratos e interface; não anunciar atividade disponível antes de liberá-la.
Inclua fluxo normal e adaptado e testes completos 4+6 e atividade única 10.

Não editar/excluir/enfraquecer testes existentes, incluindo a reprodução
nova. Não retirar a proteção de concorrência nem mudar notas, fórmula,
cobrança, imagens ou dados reais. Trate legado explicitamente.
Execute testes novos Red-Green, suíte completa, lint e build e entregue
para revisão. Não fazer push/deploy enquanto houver falhas conhecidas.
```

Publicação retida pelo caso reproduzido; homologações visuais e em Firestore real continuam sem declaração de aprovação.

## Correção aplicada — 28/10/2026

- A criação/edição transacional grava a parcela como `rascunho` enquanto a soma não fecha exatamente 10; o conjunto permanece `rascunho`, `liberado: false`. A transação que fecha os 10 grava `estado: 'pronto'`, `liberado: true`, `liberadoEm`, incrementa a versão e ativa todas as parcelas não arquivadas no mesmo commit.
- Editar a composição antes de qualquer entrega e voltar a deixar a soma incompleta reabre a montagem e rebaixa as irmãs para `rascunho`. Depois da primeira entrega, o congelamento existente continua bloqueando a composição.
- `POST /api/aluno/entregar` recusa conjunto incompleto ou cancelado com 409, antes de gravar entrega ou `congelado`; atividade fora da composição liberada recebe 403. `GET /api/aluno/atividade/[id]` e o boletim usam o mesmo contrato, preservando entrega legada como histórico.
- Legado sem `escalas` é reconhecido explicitamente e mantém o comportamento anterior no servidor e nos testes já existentes. Conjunto novo sempre persiste `escalas`, mesmo vazio, e `liberado: true` explícito vence a soma, exceto quando cancelado.
- A tela mostra “Montagem: 4,00 de 10 pontos” e “Restam 6,00 pontos”, sem anunciar disponibilidade. Após salvar, informa se o conjunto segue em montagem ou se fechou 10 e liberou as parcelas. O cancelamento exige confirmação e preserva entregas/notas já registradas.
- Testes novos: `tests/integration/recuperacao_montagem_liberacao.test.js` (4), `tests/unit/recuperacao_montagem_liberacao.test.js` (6) e `tests/unit/components/atividades/RecuperacaoMontagem.test.jsx` (5). A reprodução `recuperacao_rascunho_entrega.test.js` passou sem edição.
- Validação local: **1018 testes em 219 arquivos** aprovados; lint do escopo de produção sem erros; build de produção exit 0 com `NODE_USE_SYSTEM_CA=1`.
- Ainda pendentes e não aprovados: concorrência em Firestore real, homologação visual 390/1440 px, teclado/foco/leitor de tela, PDF real e publicação funcional no Portal.
