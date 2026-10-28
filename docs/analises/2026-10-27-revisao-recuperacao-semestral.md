# Revisão independente — recuperação semestral RN-81

**Commit examinado:** `7e7b3d0a2122392cd179a77ca026b693072203fa`, comparado a `f582906`.
**Resultado:** não liberar para produção. Há falhas reproduzidas e critérios de aceite incompletos.
**Escopo desta revisão:** leitura dos diffs e consumidores, testes automatizados sintéticos, lint e tentativa de build. Nenhuma nota real, cobrança, regra de produção ou código de produção foi alterado pela revisão.

## O que está correto

- Soma de parcelas em centésimos e distinção entre pendência e zero foram implementadas; 4+6 com notas 3+5 produz 8.
- Recuperação está explicitamente fora da sincronização regular, inclusive global. A fórmula existente 25/25/50 não foi reescrita.
- A finalidade é separada de bimestre; projeções públicas incluem semestre e excluem destinatários, rubricas e gabaritos privados.
- O lançamento usa transação e verifica a revisão do Diário, preservando bimestres. Proveniência fica fora dos valores numéricos de `recuperacao`.
- O autor declarou cobertura parcial e pendências. Os oito arquivos de testes entregues são novos; não há edição de testes anteriores nesse commit.

## Achados que impedem concluir a entrega

### 1. P1 — Botão Corrigir não abre atividade

`frontend/src/components/atividades/RecuperacaoSemestral.jsx:332` chama `setAtividadeAberto`, mas o setter declarado é `setAtividadeAberta`. Clique lança `ReferenceError: setAtividadeAberto is not defined` e impede chegar às correções pelo conjunto.

**Evidência:** `REV-R81-06`, com clique real via Testing Library e captura do erro do navegador simulado. Não é detectado pela suíte entregue nem pelo lint atual.

**Correção:** usar o setter existente e testar abertura, retorno, correção manual e IA pelo fluxo completo do conjunto.

### 2. P1 — Conjunto de outro ano pode lançar nota na turma

`frontend/src/aplicacao/diario/lancarRecuperacao.js:16` procura a turma só por ID e não compara o ano. `RecuperacaoRepository.js:50` também não valida esse vínculo. Na criação, `RecuperacaoSemestral.jsx:25` troca legado pelo ano do relógio e o campo de ano é livre; a lib confia na lista de alunos recebida do cliente.

**Evidência:** `REV-R81-01`: turma `anoLetivo: 2026`, conjunto `anoLetivo: '2025'`; o repositório aceita, grava `rec1: 8` e incrementa a revisão. A transação está presente, mas a regra de escopo não está.

**Correção:** derivar/validar ano canônico da turma em criação e lançamento, distinguir legado explicitamente e filtrar conjuntos pelo contexto selecionado. Não corrigir esse problema migrando ou apagando dados legados.

### 3. P1 — Prévia aceita parcelas alteradas quando a soma é igual

`RecuperacaoRepository.js:92` compara somente a chave formada por conjunto, versão, aluno, semestre e total. Trocar as notas das parcelas de 3+5 para 4+4 mantém a chave. O lançamento usa a composição nova sem nova conferência docente. Não há comparação integral das atividades/entregas exibidas com os dados transacionais, nem igualdade exata com `conjunto.atividadeIds`.

**Evidência:** `REV-R81-02` esperava `RECUPERACAO_PREVIA_OBSOLETA`; a operação gravou recuperação e proveniência com parcelas diferentes das conferidas.

**Correção:** versionar/conferir o snapshot relevante inteiro: identidade/contexto, composição/máximos, destinatários, entrega, estado, nota revisada/final e revisões. Exigir composição canônica completa, não somente a lista recebida do cliente. Alteração relevante exige nova prévia mesmo que o total não mude.

### 4. P1 — Composição e unicidade não são protegidas contra concorrência

`frontend/src/lib/firebase-atividades.js:58-102` consulta conjunto/atividades antes do lote de gravação. Dois salvamentos podem validar simultaneamente o mesmo orçamento disponível e ambos gravar. O lote atômico não torna atômica a leitura/validação anterior: pode haver excesso de pontos, perda de `atividadeIds` e versão repetida. `firebase-recuperacao.js:54-69` também consulta conjuntos antes de gravar um ID novo; duas abas podem criar dois conjuntos vigentes para o mesmo aluno/semestre.

Além disso, `atualizarConjuntoRecuperacao` grava destinatários/composição/contexto sem verificar entregas, unicidade ou incrementar versão. `updateAtividade` protege apenas as entregas da própria atividade; incluir uma atividade nova num conjunto que já tem entregas de outra atividade continua possível. Isso contraria a proteção de composição da RN-81.

**Evidência:** inspeção dos caminhos de escrita, sem alegação de teste em emulador. As regras Firestore atuais verificam propriedade do professor, não essas invariantes.

**Correção:** definir autoridade/versionamento transacional para orçamento e vínculo vigente; proteger composição inteira após qualquer entrega e revalidar no caminho de gravação. Acrescentar testes concorrentes de duas criações, duas parcelas e edição estrutural, incluindo o contrato de segurança adotado. Evitar apenas bloqueio de botão ou contador local.

### 5. P2 — Idempotência impede substituição confirmada após ajuste manual

`lancarRecuperacao.js:46` considera repetido apenas pela chave histórica. Após lançar 8, alterar manualmente Rec. 1 para 9 e tentar lançar novamente 8 com confirmação, a operação ignora o aluno como repetido. Na tela o checkbox fica desabilitado. O lançamento anterior já não corresponde ao valor atual.

**Evidência:** `REV-R81-03` recebeu zero lançamentos e manteve 9, apesar da confirmação explícita. A gravação de proveniência também substitui o registro anterior completo; `anterior` guarda só um número, sem histórico cumulativo de versões.

**Correção:** repetição exige correspondência entre lançamento e estado atual; divergência deve voltar à decisão docente. Preservar histórico de lançamentos/revisões, sem duplicar evento em retry e sem sobrescrever ajuste manual automaticamente.

### 6. P2 — Trocas de contexto não invalidam estado local da recuperação

`RecuperacaoSemestral.jsx:107-160` mantém conjunto, detalhe, atividade e prévia entre contextos; callbacks assíncronos de conferir/carregar/criar/lançar não têm guarda de geração/conta. Trocar conjunto não fecha a prévia anterior. Listagem ignora ano e turmas recebidas. Criação e troca de contexto permanecem disponíveis durante operações.

**Evidência:** `REV-R81-07` demonstra que o componente isolado continua mostrando prévia/aluno da conta anterior após mudar `user.uid`. Limite da evidência: a página externa usa `usePersistenciaDiario` e desmonta conteúdo durante troca de conta, mitigando esse caminho na montagem atual; não foi demonstrado vazamento entre contas no aplicativo completo. Trocas de ano/conjunto não têm a mesma proteção de desmontagem.

**Correção:** contexto explícito em estado e operações; invalidar prévia ao trocar ano/turma/semestre/conjunto/conta, ocultar dados incompatíveis já no render e ignorar resultados antigos. Testar também pelo componente pai, operações em andamento e recarga após gravação.

### 7. P2 — Validação de domínio incompleta

`campoDoSemestre` trata qualquer valor diferente de 2 como Rec. 1. `prepararLancamentoRecuperacao` aceita semestre 3 e um parâmetro `destinatarios` que amplia o conjunto. O cálculo por aluno filtra entregas somente por aluno/atividade, sem validar turma/ano/semestre/conjunto nessa fronteira.

**Evidência:** `REV-R81-04/05` não receberam a recusa esperada. Esses dois testes exercitam a fronteira de aplicação, não demonstram gravação não autorizada pelo servidor; o repositório revalida parte dos campos e hoje não usa o override de destinatários.

**Correção:** validação estrita nas fronteiras, seleção somente como subconjunto autorizado e entregas com identidade/contexto conferidos. Não ampliar escopo silenciosamente ou tratar valores inválidos como semestre 1. Incluir casos de notas/máximos acima da escala antes de arredondar.

### 8. P2 — Fluxo adaptado, prévia pedagógica e período público incompletos

- A alteração no publicador adaptado adicionou apenas filtragem discente. `converterAdaptadaParaAtividadeOnline` continua recebendo bimestre e produzindo atividade bimestral de 10. `VisualizadorAtividadeAdaptada.jsx:171` não envia conjunto/finalidade/semestre. A tela de recuperação abre apenas `AtividadeForm`; não oferece vínculo de adaptação ao conjunto. Falta cumprir recuperação regular **e adaptada**, inclusive distribuição 4+6 quando aplicável, sem contornar revisão das imagens.
- A prévia exibe total/pendências/nota atual, mas não parcelas nem efeito antes/depois no semestre/situação, exigidos pela RN-81. Códigos como `sem_entrega` aparecem diretamente ao professor.
- `frontend/src/app/aluno/notas/page.js:40` e `frontend/src/components/aluno/DevolutivasAluno.jsx:8` ainda exibem bimestre. Para recuperação sem bimestre o texto fica sem número. `montarHistoricoFeedback` não transporta finalidade/semestre, e `frontend/src/lib/aluno/feedback-pdf.js:41` produz `undefinedº bimestre` no PDF. O feedback existente pode chegar ao relatório, mas seu contexto semestral não foi integrado.

**Correção:** completar o caminho real de criação/adaptação e os consumidores do histórico. Reutilizar cálculo compartilhado para a prévia; não duplicar fórmula. Testar Portal e PDF exportado com recuperação corrigida, parcelas e contexto semestral, mantendo publicação explícita e preservação do outro semestre.

## Verificações executadas

1. Antes de acrescentar os testes da revisão: `npm test` em `frontend` → **960 testes / 206 arquivos aprovados**, exit 0.
2. Dois arquivos novos, sem editar os testes recebidos: `tests/integration/recuperacao_semestral_revisao.test.js` e `tests/unit/components/atividades/RecuperacaoSemestralRevisao.test.jsx` → **7 testes falhando**, conforme comportamentos reproduzidos acima. Esses testes permanecem locais para o ciclo Red-Green do responsável; nenhum foi marcado skip/todo ou teve asserção relaxada.
3. Lint dos 15 arquivos JS/JSX de produção alterados → **0 erros, 2 avisos de `<img>`** no formulário; não detectou o setter inexistente.
4. `NODE_USE_SYSTEM_CA=1 npm run build` → **exit 1**, erro Turbopack ao resolver fontes Google Manrope (`next/font/google queries have exactly one entry` / módulo interno de fonte). Não atribuído ao DeepSeek: não houve alteração do layout/fontes no diff, mas a causa não foi isolada por build da versão anterior. Não modificar fontes ou configuração de produção para ocultar a falha.
5. Não realizada homologação visual em navegador real, emulador Firestore ou PDF renderizado nesta revisão. Não anunciar esses aceites como concluídos.

## Handoff para DeepSeek / OpenCode

```text
Corrija a implementação RN-81 no commit 7e7b3d0, seguindo a revisão:
docs/analises/2026-10-27-revisao-recuperacao-semestral.md.

Leia primeiro AGENTS.md, specs/RULES.md, specs/PRD.md, specs/TESTS_SPEC.md
e docs/plans/2026-10-27-recuperacao-semestral.md.

Há 7 regressões reproduzidas em dois arquivos novos já presentes no workspace:
tests/integration/recuperacao_semestral_revisao.test.js
tests/unit/components/atividades/RecuperacaoSemestralRevisao.test.jsx
Não edite/remova/enfraqueça esses testes nem os 960 testes entregues.

Corrija os oito grupos do relatório, prioritariamente ano/contexto, snapshot
integral da prévia, concorrência/composição e abertura da correção. Depois
complete idempotência/histórico, validação, integração adaptada e contexto
semestral no Portal/PDF. Atualize contratos antes das mudanças estruturais;
adicione testes novos para os cenários ainda sem reprodução automatizada.
Teste também as proteções pelo componente pai e os caminhos reais de escrita.

Preserve pesos 2/3, aprovação 25/25/50, bimestres e recuperação manual.
Uma ou várias atividades somam 10 pontos máximos; não calcular média.
Não ativar Blaze, migrar/apagar dados, mudar provedor ou usar notas reais.
Não alterar configuração/fontes só para fazer o build passar: investigar
separadamente o erro registrado. Não esconder validações faltantes.

Execute testes direcionados Red-Green, suíte completa, lint e build.
Entregue resultados reais e limitações, com diff para nova revisão independente
de notas/autorização/persistência. Não publicar a implementação enquanto
houver falhas conhecidas ou pendências críticas da revisão.
```

## Correções aplicadas em 27/10/2026 (para nova revisão independente)

- **Ano/contexto:** `anoLetivoDaTurma` deriva o ano da turma; a criação não aceita ano digitado e turma sem ano exige `legado`. A prévia recusa conjunto de outro ano da turma.
- **Snapshot integral:** a prévia guarda composição canônica, destinatários, parcelas, status e notas revisada/final. `RecuperacaoRepository` recalcula dentro da transação e recusa com `RECUPERACAO_PREVIA_OBSOLETA` qualquer divergência, inclusive total igual com parcela diferente.
- **Concorrência:** `firebase-recuperacao` cria/edita/cancela em `runTransaction` com locks determinísticos (`turma/ano/S/aluno`), versão incremental e conferência de `versaoEsperada`. Conjuntos legados sem lock são conferidos antes da transação (limite declarado).
- **Composição congelada:** `firebase-atividades` confere a versão do conjunto, grava `escalas` e bloqueia mudança de composição/escala quando já existe entrega.
- **Histórico/idempotência:** histórico cumulativo em `recuperacaoLancamentos`; repetição idêntica é ignorada; nota manual divergente exige confirmação; histórico não é apagado.
- **Validação/UI:** comprimento do semestre estrito, destinatários e escala revalidados, correção abre pelo setter correto, estado da conta anterior é limpo na troca de conta e a prévia mostra parcelas e efeito semestral.
- **Adaptado:** `converterAdaptadaParaAtividadeOnline` aceita `recuperacao` (conjunto, versão, semestre, ano, pontos) e distribui a parcela em centésimos; o modal permite escolher conjunto/saldo.
- **Portal/PDF:** `rotuloPeriodo` exibe semestre para recuperação e bimestre para regular em `DevolutivasAluno`, `feedback-pdf`, lista de atividades e painel.

Validação real desta rodada: 7 testes da revisão aprovados sem edição; 17 testes novos em três arquivos; suíte completa **984 testes/211 arquivos**; lint sem erros (2 avisos preexistentes de `<img>`); build de produção exit 0 com `NODE_USE_SYSTEM_CA=1`. O erro de fontes da revisão não se reproduziu e nenhuma fonte/configuração foi alterada.

Pendências que continuam abertas: concorrência em sessão autenticada/Firestore real, Analytics, PDF renderizado, 390/1440 px, teclado/foco/leitor de tela e publicação funcional no Portal. Nada foi publicado.
