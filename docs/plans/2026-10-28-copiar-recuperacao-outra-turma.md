# Copiar recuperação para outra turma — plano de implementação

**Objetivo:** reaproveitar conteúdo de uma atividade de recuperação regular, criando outra atividade independente para turma/conjunto escolhidos.
**Arquitetura:** projeção pura de conteúdo por campos permitidos no domínio; orquestração de destino na aplicação; UI de confirmação e formulário em modo de criação; persistência transacional RN-81 existente. Não clonar documentos completos nem criar nova sincronização.
**Stack:** Next.js/React, Firebase/Firestore, Vitest/Testing Library existentes, sem dependência nova.
**Estado:** especificação autorizada; implementação encaminhada ao DeepSeek/OpenCode. Ler AGENTS.md e RN-81/RN-82 antes de executar. Cada etapa segue RED→GREEN→refactor, sem editar testes anteriores.

## Decisão de desenho

Escolhida cópia individual com revisão. Alternativas: duplicar conjunto inteiro exigiria operação atômica em lote/retomada de maior complexidade; compartilhar o mesmo documento entre turmas enfraqueceria o isolamento de recuperação. Esses dois caminhos ficam fora do escopo. Não incluir cópia em massa nem biblioteca de modelos nesta entrega.

Fluxo: atividade no conjunto de origem → “Copiar para outra turma” → selecionar outra turma e conjunto elegível (ou abrir Novo conjunto existente) → conferir semestre/ano/alunos → formulário de nova atividade preenchido apenas com conteúdo → escolher prazo, revisar pontuação/imagens → confirmar criação. O modal informa quando o salvamento completará 10 e liberará o conjunto. Repetir para cada parcela desejada. O destino pode ter outro semestre; seus dados são a autoridade.

Versão inicial atende atividade regular e imagens compatíveis com seu formulário. Atividade adaptada individualizada exige revisão/mapeamento específico e não pode ser convertida silenciosamente; se não suportada, mostrar explicação sem gravar. Não prometer remoção automática de identificação contida no conteúdo.

## Contexto confirmado no código

- `frontend/src/components/atividades/AtividadeForm.jsx`: `isEdit = !!initialData`; `idEstavel` herda `initialData.id`. Passar origem como `initialData` é incorreto e pode editar atividade original. Introduzir prop exclusiva de conteúdo inicial de criação, com projeção segura e contexto de destino separado.
- `frontend/src/components/atividades/RecuperacaoSemestral.jsx`: lista de parcelas, `contextoFormulario`, `salvarAtividade` e fluxo existente de Novo conjunto são pontos de integração. Evitar estado de destino derivado acidentalmente do conjunto de origem atualmente aberto.
- `frontend/src/hooks/atividades/useAtividades.js`: criação inclui autoria; preservar o contrato existente, guardas de conta e escopo.
- `frontend/src/lib/firebase-atividades.js`: `createAtividade`, `gravarAtividadeRecuperacao` e planejamento de tokens fornecem persistência transacional e ID estável/retry. Não criar cópia por `setDoc` direto ou spread da origem.
- `frontend/src/lib/firebase-recuperacao.js`: leitura/criação de conjuntos, reservas, versão e congelamento. Não mudar suas regras de segurança para facilitar cópia.
- `frontend/src/dominio/atividades/recuperacaoSemestral.js`: validar escala, composição e contexto reutilizando contratos atuais.

## Etapa 1 — Projeção de conteúdo

Criar `frontend/src/dominio/atividades/copiarRecuperacao.js` e `tests/unit/copiar_recuperacao.test.js`. Antes de produção, testes RED R82-01: origem com questões objetivas/discursivas, gabarito, rubrica, textosBase, materiais, materialApoio e imagens, misturados a tokens/notas/feedback e sentinelas aninhadas. Definir campos permitidos de cada estrutura após ler seus contratos reais; preservar gabarito docente legítimo, excluir respostas discentes. Implementar clone independente; mutação da cópia não altera origem. Não usar blacklist superficial ou JSON de documento completo. Campos de destino/prazo/ID não vêm da origem.

Executar de `frontend`: `npm test -- ../tests/unit/copiar_recuperacao.test.js`; confirmar falha relevante, implementar mínimo e confirmar aprovação.

## Etapa 2 — Nova atividade revisável

Adicionar testes novos no arquivo `tests/unit/components/atividades/CopiarRecuperacao.test.jsx`. Cobrir prop nova de conteúdo inicial sem ativar edição, novo ID, validação explícita de prazo, escala/saldo, cancelamento sem gravação e edição normal preservada. Implementar preenchimento da prop no formulário, mantendo `initialData` reservado à edição. Estado deve reiniciar corretamente ao trocar origem/destino e não perder conteúdo em falha recuperável. Não transportar arquivo local/blob URL que não sobreviva à leitura; informar material indisponível.

## Etapa 3 — Escolha de destino e confirmação

Adicionar botão por parcela em `RecuperacaoSemestral.jsx`; modal separado sugerido `frontend/src/components/atividades/CopiarRecuperacaoModal.jsx`. Listar apenas turmas/conjuntos próprios elegíveis; mostrar motivo quando não houver destino. Reutilizar Novo conjunto explicitamente, sem criar turmas/alunos. Restringir destinatários a IDs válidos do conjunto escolhido; subconjunto explícito permitido quando o contrato da atividade o exigir, sem herdar origem. Carregar versão e saldo atuais do destino. Exibir resumo de turma, semestre, ano, destinatários, pontos e liberação ao fechar 10. Guardas de conta/contexto e foco acessível. Cancelar não cancela conjunto preexistente nem conjunto recém-criado explicitamente.

## Etapa 4 — Persistência e isolamento

Criar `tests/integration/copiar_recuperacao.test.js`; exercitar caminho real de criação com mocks de transação compatíveis com testes RN-81. Cobrir R82-03..06, incluindo destino alterado entre modal e commit, concorrência, retry após commit com resposta perdida e preservação integral da origem. A autoria deve vir da sessão/caminho autenticado existente, nunca da origem arbitrária. Se necessário, criar caso de uso `frontend/src/aplicacao/atividades/copiarRecuperacao.js` para resolver/revalidar origem própria e destino antes de criar; não duplicar transação existente.

Verificar tokens de turma/aluno novos e ausência de escritas no Diário/entregas/publicação. Não mascarar conflitos nem sobrescrever por cache. Fonte respondida pode ser lida sem liberar sua edição. Novo ID fica estável por operação, sem reutilizar origem nem gerar outro a cada retry. Dados inválidos não deixam atividade/tokens parcialmente gravados; limites transacionais devem produzir erro claro.

## Etapa 5 — Validação e documentação

1. Rodar testes novos isolados e preservar evidência RED e GREEN.
2. `cd frontend && npm test`: suíte completa exit 0; contagem pode mudar com outras entregas, não fixar 1.018 como total obrigatório.
3. Lint dos arquivos de produção alterados com `npx eslint <arquivos>`; comparar avisos preexistentes sem ocultar novos.
4. `NODE_USE_SYSTEM_CA=1 npm run build`: exit 0; não trocar fontes/configuração para contornar falha externa.
5. Navegador com dados sintéticos: origem respondida 4+6, copiar parcelas uma por vez para turma B; B fica oculta após 4 e libera ao somar 10. Notas/feedback de A preservados; B começa sem entregas/notas. Conferir 390/1440, teclado/foco e imagens. Não alegar teste de leitor de tela ou IA se não feito.
6. Atualizar guia de recuperação e specs somente com evidências realmente executadas. Registrar formatos/imagens não suportados e limites. Não misturar correções PDF RN-81 ou armazenamento adaptado.
7. Entregar diff para revisão independente antes de publicar código. Commit/push automático após aprovação das validações e revisão, conforme preferência do usuário.

## Prompt pronto para OpenCode

```text
Implemente RN-82 em /Users/kelsopalheta/Developer/RotinaDocente.
Leia AGENTS.md, specs/RULES.md, PRD.md, TESTS_SPEC.md e docs/plans/2026-10-28-copiar-recuperacao-outra-turma.md integralmente.

Escopo: botão “Copiar para outra turma” por atividade regular de recuperação, inclusive imagens compatíveis. Escolher conjunto de outra turma própria, revisar conteúdo/pontuação e confirmar prazo novo. Usar fluxo Novo conjunto existente quando necessário; não copiar conjunto inteiro. Criar nova atividade com ID estável, contexto/destinatários/tokens novos. Nunca copiar respostas, correções, notas, histórico ou vínculos operacionais da origem. Copiar não escreve no Diário/boletim.

Siga as cinco etapas e R82-01..07. Acrescente testes RED antes de produção; nunca edite/apague testes existentes. Atenção: initialData ativa edição e herda ID no AtividadeForm; origem não pode ser passada como initialData. Use prop exclusiva para conteúdo de criação, projeção por whitelist aninhada e contexto independente. Reutilize transação RN-81 para versão, saldo, congelamento e liberação: 4 fica rascunho, 4+6 libera, excedente falha atomicamente. Origem com entregas continua imutável. Retry/duplo clique não duplica e mudança de conta/contexto ignora resultado antigo.

Não converter atividade adaptada personalizada silenciosamente; informar limitação se não suportada. Não mudar fórmula 25/25/50, autenticação, regras de acesso, sincronização, imagens/provedor/armazenamento/plano Firebase. Sem dependência nova, dados reais, IA paga, deploy ou push nesta entrega. Não misturar ajustes PDF/visual RN-81 pendentes.

Execute testes novos, suíte completa, lint e build; navegador sintético em 390/1440 e teclado/foco. Registre comandos/resultados, capturas, limites e arquivos alterados. Atualize guia/especificações com estado real. Entregue diff para revisão independente neste chat antes de publicação.
```

## Atualização de execução — 28/10/2026

Após entrega e revisão, usuário autorizou correções neste chat por ter atingido limite gratuito do OpenCode. Resultado e limites em `docs/analises/2026-10-28-correcao-copia-recuperacao.md`. As instruções de encaminhamento acima registram o fluxo original; a autorização posterior permite concluir e publicar após validação.
