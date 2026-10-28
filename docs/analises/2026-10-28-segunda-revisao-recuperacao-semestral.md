# Segunda revisão independente — recuperação semestral

**Commit examinado:** `51abb4fb54530860da40d46cfb2760e555ab6c8b`.
**Comparação:** correções sobre `7e7b3d0`, considerando a RN-81 e o relatório de 27/10.
**Decisão:** manter publicação retida. Os sete testes da revisão anterior passaram, mas quatro novos casos reproduzem invariantes ainda não atendidas. Nenhum código de produção foi alterado nesta revisão.

## Avanços verificados

- Os **984 testes em 211 arquivos** passaram na execução independente, incluindo os sete testes anteriores. Não houve edição de testes que já estavam no commit `7e7b3d0`; os testes da revisão anterior foram incorporados ao novo commit.
- Botão de correção, validação de semestre, destinatários, ano não legado, idempotência após ajuste manual e histórico receberam correções. A prévia compara parcelas, estados e notas, não apenas o total.
- Publicador adaptado passou a aceitar recuperação e distribuir pontos da parcela; Portal, histórico e PDF passaram a transportar/exibir semestre. A prévia ganhou parcelas e efeito no semestre via cálculo compartilhado. Isso foi conferido no código e nos testes, sem alegar homologação visual completa.
- `NODE_USE_SYSTEM_CA=1 npm run build`: **exit 0**. A falha de fontes da rodada anterior não se repetiu. Nenhuma alteração de fonte/configuração foi necessária.
- Lint dos arquivos de produção do escopo: **0 erros, 2 avisos preexistentes de `<img>`** em `AtividadeForm.jsx`.

## Quatro falhas reproduzidas

Arquivo novo: `tests/integration/recuperacao_concorrencia_revisao.test.js`. Os quatro testes falham por aceitação de operação indevida/perda de reserva, não por erro de importação ou ausência de função no mock. O banco é sintético e suporta lotes atômicos e transações com controle otimista/retry; não substitui o emulador Firestore.

### 1. P1 — Orçamento ainda pode ser consumido duas vezes

**Local:** `frontend/src/lib/firebase-atividades.js`, funções `prepararRecuperacao` e `gravarComTokens`.

Leitura de versão, cálculo da composição e escrita continuam separados. Duas criações, ambas vendo versão 1 e orçamento de 10 disponível, passam na conferência e gravam duas atividades de 10. O lote só torna as escritas de cada operação atômicas; não verifica se a versão lida anteriormente continua atual. O conjunto ainda pode perder um dos IDs e receber a mesma versão incrementada nas duas operações.

**Teste:** `REV2-R81-01`, duas chamadas concorrentes a `createAtividade`, com `conjuntoVersao: 1`. Ambas retornam sucesso quando apenas uma poderia consumir os 10 pontos.

**Correção necessária:** leitura/validação do orçamento canônico e gravação de parcela, composição e versão precisam compartilhar controle transacional. A declaração de que um mock antigo não suporta determinada assinatura não autoriza retirar a proteção de concorrência. Preservar o caminho regular e introduzir um caminho transacional próprio para recuperação, se necessário, sem editar testes para fazê-los passar.

### 2. P1 — Inclusão de parcela ignora congelamento após entrega

**Local:** `frontend/src/lib/firebase-atividades.js`, cálculo de `idsAtuais`, `idsNovos` e `composicaoMudou`.

`idsAtuais` já recebe o ID da atividade que ainda será criada antes da comparação com `idsNovos`. Por isso, adicionar a nova atividade não é detectado como mudança de composição. A consulta de entregas pode nem acontecer.

**Teste:** `REV2-R81-02`: conjunto com atividade de 4 pontos e uma entrega existente aceita atividade nova de 6 pontos. A operação deveria preservar a distribuição congelada.

**Correção necessária:** comparar o conjunto persistido real, sem inserir antecipadamente a parcela nova no estado anterior. A primeira entrega e o congelamento devem ter autoridade compartilhada com a gravação da composição; uma consulta de entregas fora da transação não basta para impedir corrida entre entrega e edição. Documentar o mecanismo e testar ambas as ordens concorrentes.

### 3. P1 — Edição de destinatários não consulta entregas

**Local:** `frontend/src/lib/firebase-recuperacao.js`, `atualizarConjuntoRecuperacao`.

A transação verifica versão e reservas dos destinatários que entram, mas não verifica se o conjunto já possui entregas nem congela seu contexto/composição. Incrementar a versão não atende à regra de preservar destinatários depois das entregas.

**Teste:** `REV2-R81-03`: conjunto com entrega do aluno A aceita acrescentar B e grava os novos destinatários. O teste exige recusa e preservação do conjunto anterior.

**Correção necessária:** validar o congelamento no caminho de escrita do conjunto, em conjunto com a criação/edição das parcelas. Mudança de turma/ano/semestre também precisa ser proibida ou ter contrato explícito seguro antes das entregas, incluindo reserva para todos os destinatários no contexto novo. Não deixar reservas presas ao contexto antigo.

### 4. P1 — Cancelamento repetido pode apagar a reserva de outro conjunto

**Local:** `frontend/src/lib/firebase-recuperacao.js`, `cancelarConjuntoRecuperacao`.

O cancelamento apaga incondicionalmente as reservas por turma/ano/semestre/aluno. Sequência: cancelar C1 → criar C2 para o mesmo aluno → repetir cancelamento de C1. A reserva já pertence a C2, mas é apagada. A exclusividade deixa de estar protegida para novas operações.

**Teste:** `REV2-R81-04`: após a sequência, a reserva deveria continuar com `conjuntoId` de C2; o resultado recebido é ausência da reserva.

**Correção necessária:** cancelamento idempotente, com leitura de cada reserva e exclusão somente se ainda pertence ao conjunto cancelado. Todas as leituras devem ocorrer antes das escritas, conforme exigido pelo Firestore. Validar também caminhos de remoção de destinatário e mudanças de contexto; não apagar uma reserva de outro conjunto.

## Situação dos testes e da publicação

- Base recebida: 984/984 aprovados. Novo arquivo da revisão: **4/4 falhando**, exit 1, conforme reprodução acima. Não anunciar aprovação integral depois de acrescentá-lo.
- Testes, documentação e reprodução desta revisão estão locais. Não houve push, deploy ou gravação de notas reais.
- Permanecem as homologações funcionais/visuais declaradas anteriormente. As correções dos quatro casos não substituem o teste de isolamento e concorrência dos caminhos completos, especialmente entrega versus composição.
- O lembrete de recuperação semestral permanece ativo até a entrega funcional aprovada. O lembrete separado de armazenamento de imagens adaptadas também permanece; manter plano Firebase atual.

## Prompt pronto para OpenCode / DeepSeek

```text
Corrija os quatro bloqueios restantes da RN-81 documentados em:
docs/analises/2026-10-28-segunda-revisao-recuperacao-semestral.md

Commit atual: 51abb4f. Os sete testes da primeira revisão já passam.
O arquivo novo tests/integration/recuperacao_concorrencia_revisao.test.js
reproduz quatro falhas: orçamento concorrente, nova parcela após entrega,
edição de destinatários após entrega e cancelamento que remove reserva alheia.

Leia AGENTS.md e contratos RN-81 antes do código. Preserve todos os testes
existentes e as quatro novas asserções; não editar, remover, pular ou afrouxar.
Não use limitação de um mock como motivo para retirar transação de produção.
Separe o caminho de recuperação do caminho regular se necessário.

Implemente autoridade transacional para orçamento/composição/versão e
congelamento após a primeira entrega, incluindo concorrência da entrega com
edição. Cancelamento precisa ser idempotente e excluir apenas reservas do
próprio conjunto. Verifique também remoção de destinatário e alteração de
contexto, evitando apagar reservas alheias ou deixar locks no contexto antigo.

Adicione testes para os caminhos concorrentes ainda não cobertos. Preserve
notas, histórico, fluxo regular, privacidade, pesos 2/3 e aprovação 25/25/50.
Não migrar/apagar dados reais, mudar cobrança/plano ou mexer em fontes.

Execute testes novos Red-Green, suíte inteira, lint e build. Entregue diffs,
evidências reais e limitações para nova revisão. Não faça push/deploy enquanto
houver falhas conhecidas ou pendências críticas de integridade de notas.
```

## Status das correções aplicadas — 28/10/2026

- **REV2-R81-01 resolvido:** criação/edição de parcela de recuperação usa `runTransaction`; a composição/versão persistida no conjunto e as atividades irmãs são lidas na mesma transação. Duas parcelas concorrentes não podem consumir o mesmo orçamento.
- **REV2-R81-02 resolvido:** a primeira entrega grava `congelado: true` no conjunto na mesma transação da entrega; a criação/edição de parcela lê esse documento na transação. A consulta de entregas legadas cobre dados anteriores ao marcador, sem ser a única barreira.
- **REV2-R81-03 resolvido:** `atualizarConjuntoRecuperacao` recusa destinatários/contexto após entrega (`RECUPERACAO_CONGELADA`). Antes das entregas, contexto só muda sem atividades; as reservas são migradas e as chaves antigas só são apagadas se pertencerem ao próprio conjunto.
- **REV2-R81-04 resolvido:** cancelamento é idempotente; lê cada reserva antes de escrever e só apaga locks com o mesmo `conjuntoId`. Repetir o cancelamento antigo não remove a reserva de um conjunto novo.
- **Testes:** os quatro `REV2-R81-01..04` passam sem edição. Foram adicionados 14 testes concorrentes/de lock em `recuperacao_congelamento_ordem.test.js` (4), `recuperacao_locks_contexto.test.js` (6) e `recuperacao_congelamento_entrega.test.js` (4).
- **Evidência:** 1002 testes/215 arquivos aprovados; lint dos arquivos alterados exit 0; build de produção exit 0 com `NODE_USE_SYSTEM_CA=1`.
- **Limitações:** concorrência em Firestore real, homologação visual 390/1440 px, teclado/foco/leitor de tela, PDF real e publicação funcional no Portal continuam pendentes. Entregas anteriores ao marcador durante a janela de implantação dependem da consulta legada. Publicação continua retida até nova revisão independente; nenhum push, deploy ou dado real foi alterado.
