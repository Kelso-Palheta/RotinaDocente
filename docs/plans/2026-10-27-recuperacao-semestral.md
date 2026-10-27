# Recuperação semestral por atividades — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar uma ou várias atividades cuja soma vale 10 pontos e lançar a nota obtida na recuperação do semestre, após conferência docente.

**Architecture:** Reutilizar atividades, entregas e correções existentes, com finalidade explícita e conjunto semestral identificado. Cálculo e validação ficam no domínio; lançamento passa pela persistência canônica versionada do Diário. Publicação continua independente e usa a fórmula de recuperação já compartilhada.

**Tech Stack:** Next.js 16, React 19, JavaScript, Firebase/Firestore, Vitest e Testing Library; sem dependências novas previstas.

---

## Estado e decisão confirmada

Este documento é especificação/handoff; não anuncia funcionalidade implementada. Em 27/10/2026 o usuário definiu: “Podem ser um ou varias atividades, e a nota total é de 0 a 10.” Interpretação operacional: distribuir 10 pontos entre as atividades e somar as notas obtidas. Exemplo: máximos 4 e 6, notas 3 e 5 → recuperação 8. Não usar média nem transformar duas atividades de 10 em 20; orientar a redistribuir os pontos.

Execução indicada: DeepSeek no OpenCode para implementação delimitada e testes. Este chat faz revisão independente das partes de autorização, persistência e notas antes da publicação funcional. Manter o lembrete da funcionalidade até implementação e validação efetivas.

Verificação desta entrega documental (27/10/2026): 18 testes existentes, em `aprovacao_semestral.test.js`, `sincronizacao_atividades_escopo.test.js` e `publicacao_aprovacao_semestral.test.js`, aprovados. Nenhum código de produção ou teste foi alterado; isso não valida a funcionalidade nova. Build e suíte completa deverão ser executados na entrega da implementação.

## Evidências do código atual

- `frontend/src/utils/diario/calculos.js`: `calcSemestre` substitui a menor nota quando melhora, somente com os dois bimestres preenchidos; pesos 2/3. `calcDesempenhoAnual` já lê `rec1`/`rec2`.
- `frontend/src/components/diario/MapaAnual.jsx` e `frontend/src/hooks/diario/useTurmas.js`: edição manual de `turma.recuperacao[alunoId].rec1/rec2`, escala 0–10.
- `frontend/src/dominio/diario/backupTurmas.js`: valores dentro de `recuperacao[alunoId]` são numéricos; não inserir objetos de histórico ali.
- `frontend/src/dominio/diario/sincronizacaoAtividades.js`: sincronização atual escreve atividades bimestrais. Recuperação não pode entrar nesse fluxo, mesmo quando o usuário escolhe todas as notas.
- `frontend/src/lib/firebase-atividades.js`: edição estrutural e listagem/sincronização precisam distinguir finalidade; a sincronização transacional atual não deve servir de modelo para gravação sem revisão.
- `frontend/src/components/atividades/AtividadeForm.jsx`: criação atualmente exige bimestre 1–4. Não falsificar bimestre para satisfazer essa validação.
- `frontend/src/app/api/aluno/entregar/route.js`: servidor deriva turma/aluno/bimestre do vínculo autorizado. Estender a derivação para finalidade/conjunto/semestre, preservando compatibilidade regular.
- `frontend/src/dominio/atividades/acessoAluno.js` e `frontend/src/infraestrutura/atividades/acessoAluno.js`: projeção pública e autorização precisam respeitar destinatários também no acesso direto.
- `frontend/src/dominio/adaptacoes/publicadorAtividadeOnline.js`: conversão adaptada já usa atividade canônica; manter `tipoAtividade` separado da finalidade semestral.
- `frontend/src/infraestrutura/diario/DiarioRepository.js`, `frontend/src/aplicacao/diario/FilaPersistenciaDiario.js` e `frontend/src/hooks/diario/usePersistenciaDiario.js`: caminho canônico versionado. Uma prévia obsoleta não autoriza escrever sobre versão nova.
- `specs/API_SPEC.md` e `specs/DATABASE_SCHEMA.md`: recuperação publicada já é individual; campos novos não podem divulgar colegas nem publicar boletim durante correção.

## Contrato técnico proposto

Validar este contrato contra os caminhos reais de escrita, regras Firestore e acesso discente antes de implementar; atualizar API_SPEC e DATABASE_SCHEMA antes do código correspondente.

1. Atividade regular: `finalidade: 'regular'`; ausência do campo é regular por compatibilidade. Mantém `bimestre` 1–4.
2. Atividade de recuperação: `finalidade: 'recuperacao_semestral'`, `conjuntoRecuperacaoId`, `semestre: 1 | 2` e contexto do conjunto. Bimestre ausente; nenhum consumidor pode tratá-lo implicitamente como 1. Não reutilizar `tipoAtividade`, que distingue adaptações.
3. Conjunto: ID estável, professorId, turmaId, anoLetivo, semestre, destinatariosIds, atividadeIds, estado e versão. Alunos são IDs canônicos. Ano legado deve ser explícito, nunca convertido automaticamente para o ano do relógio.
4. Conjunto pertence a uma única turma/ano/semestre. Um aluno tem apenas um conjunto vigente nesse contexto. Conjuntos adaptados distintos são permitidos para alunos diferentes, com distribuição total de 10 para cada um. Não criar nova tabela paralela de alunos.
5. Entrega guarda finalidade/conjunto/semestre derivados no servidor. Campos enviados pelo cliente são comparados ao vínculo autorizado; não concedem acesso. Corrigida/revisada é condição necessária, com nota válida, para compor a soma.
6. Nota lançada continua numérica em `recuperacao[alunoId].rec1/rec2`. Proveniência separada associa conjunto, versão, parcelas, lançamento anterior e data/autor. Escolher localização mínima compatível com backup/restauração e regras existentes; documentar contrato antes de gravar. Não guardar dados de colegas no snapshot público individual.
7. Conferência identifica revisão do Diário e versão/parcelas do conjunto. Se notas/composição/versão mudarem, invalidar prévia; nova confirmação precisa mostrar os valores atualizados. Usar chave idempotente baseada no conjunto, versão, aluno e semestre; não somente data de clique.

## Fluxo de uso

No Gerador/Diário: “Recuperação semestral” → turma/ano/semestre → alunos → distribuir 10 pontos → criar atividades regulares/adaptadas → enviar. Exibir pontos distribuídos/restantes e prazo por atividade. Sugerir alunos em recuperação sem matriculá-los automaticamente; o professor escolhe destinatários.

Correção reutiliza IA/manual e feedback existentes. Painel mostra aluno, parcelas, pendências e total; aluno sem parcela corrigida continua pendente. Botão “Conferir recuperação” abre prévia com rec1/rec2 atual, novo total e efeito no semestre. Não lançar automaticamente após corrigir. “Lançar recuperação” grava apenas alunos completos selecionados. Nota diferente já existente exige decisão explícita de substituição. Publicar no Portal continua ação separada.

Portal identifica “Recuperação do 1º/2º semestre”, prazo e valor de cada atividade; mostra devolutiva autorizada e não promete que a nota corrigida já foi publicada no boletim. Relatório individual inclui o mesmo feedback e contexto. Não exibir dados médicos/gabaritos/rubricas internas.

## Execução em etapas com TDD

Para cada etapa: criar teste novo → executar e confirmar falha de comportamento/importação esperada → implementar mínimo → repetir e confirmar aprovação → revisar diff. Não editar testes antigos, enfraquecer asserções ou relaxar timeouts para aprovar. Não fazer gravações em dados reais durante testes.

### 1. Domínio e exclusão da sincronização regular

**Criar:** `frontend/src/dominio/atividades/recuperacaoSemestral.js`; `tests/unit/recuperacao_semestral.test.js`; `tests/unit/sincronizacao_regular_exclui_recuperacao.test.js`.

**Integrar:** `frontend/src/dominio/diario/sincronizacaoAtividades.js` e consultas/filtros de `frontend/src/lib/firebase-atividades.js`.

Funções puras devem validar contexto, distribuição, completude, nota revisada e total; devolver pendências estruturadas sem inventar zeros. Trabalhar pontos em centésimos: converter decimal válido em inteiro antes de somar; comparar orçamento com 1000; converter para exibição apenas no fim. Não aceitar revisão inválida usando a nota antiga como fallback.

Testar R81-01/02/04: 10; 4+6; nota 3+5=8; zero válido; limite; parcelas decimais; entrega duplicada; aluno/ano/semestre errado; falta de nota; atividade legada; sincronização global e recortada. Nenhum teste de domínio deve acessar Firebase.

### 2. Criação, contrato e acesso seguro

**Integrar:** `AtividadeForm.jsx`, `frontend/src/app/atividades/page.js`, `frontend/src/hooks/atividades/useAtividades.js`, publicador adaptado e autorização/projeção/entrega listados acima. Inspecionar `firestore.rules` e todas as listagens, não só tela e endpoint principal.

**Criar:** `tests/integration/recuperacao_semestral_acesso.test.js` e testes unitários de contrato/UI necessários em arquivos novos.

Antes de escrever, atualizar `specs/API_SPEC.md`/`specs/DATABASE_SCHEMA.md` com nomes, localização do conjunto, destinatários e versionamento escolhidos. Preservar leitura de atividades antigas. Derivar contexto confiável nas escritas e não aceitar alteração estrutural com entregas por chamadas diretas. Vincular publicador adaptado sem retirar a revisão das imagens.

Testar R81-03/07: destinatário autorizado, colega não selecionado, outra turma/conta/ano, adulteração do semestre, token revogado e acesso direto por ID. Conferir projeções sem gabarito/rubrica privada. UI limita distribuição e informa semestre, sem bimestre falso. Nenhuma mudança de autenticação geral ou armazenamento de imagens.

### 3. Lançamento versionado e idempotente

**Criar:** caso de uso em `frontend/src/aplicacao/diario/` e prévia em `frontend/src/components/diario/`, com nomes documentados no contrato; `tests/integration/recuperacao_semestral_lancamento.test.js`.

**Integrar:** persistência compartilhada, Mapa Anual e painel de atividades. Não implementar uma segunda cópia local do Diário nem gravação cega de `turmas`. Preservar filas existentes e sua visão da revisão após sucesso; dados de entrega/conjunto utilizados na prévia também precisam ser revalidados no lançamento. Não basta verificar somente revisão do Diário quando a correção está em outro documento.

Testar R81-04/05: prévia sem gravação, lançamento em rec1/rec2, conflito entre abas, entrega alterada desde prévia, retry após falha, repetição após sucesso, troca de conta/contexto durante promessa, campo manual existente e substituição confirmada. Comparar todos os campos não selecionados antes/depois. Manter histórico de notas originais e proveniência fora dos valores numéricos de recuperação.

### 4. Portal, relatórios e compatibilidade

**Inspecionar/integrar:** `frontend/src/app/api/aluno/boletim/route.js`, componentes usados pelo Portal e exportadores da Ficha/boletim, identificando arquivos reais antes de editar. Reutilizar projeção individual de recuperação e cálculo compartilhado.

**Criar:** `tests/integration/recuperacao_semestral_portal_relatorio.test.js` e `tests/integration/recuperacao_semestral_backup.test.js`.

Testar R81-06/08: aluno vê somente suas tarefas/feedback; arquivar não apaga devolutiva; corrigir não publica; publicar semestre selecionado preserva outro; backup antigo e novo restauram sem perder histórico. Mapa/Portal/Analytics/PDF concordam nos limites 25/50, semestre incompleto e recuperação que não melhora nota.

### 5. Verificação, documentação e revisão independente

No diretório `frontend`, executar os testes novos durante cada ciclo. Exemplo após criar o primeiro arquivo:

```sh
npm test -- ../tests/unit/recuperacao_semestral.test.js
```

Falha inicial deve demonstrar requisito ausente; após implementação, esperar aprovação. Na conclusão, executar sequencialmente:

```sh
npm test
npx eslint <arquivos-JS-JSX-alterados>
NODE_USE_SYSTEM_CA=1 npm run build
```

Esperado: suíte inteira aprovada, nenhum teste antigo alterado, lint do escopo aprovado e build exit 0. Substituir o marcador do lint pela lista real; não colar literalmente. Se houver regra Firestore alterada, executar também os testes existentes de emulador/contrato e documentar publicação coordenada com o app.

Conferir fluxo sintético em 390/1440 px e navegação por teclado; exportar relatório individual e inspecionar feedback, paginação e ausência de dados de colegas. Atualizar guia, RN-81, TASKS e TESTS_SPEC com evidências reais e limitações. Revisão independente precisa analisar diffs de autorização, concorrência e notas, não apenas contagem de testes. Só depois da implementação revisada/validada marcar funcionalidade concluída e publicar conforme autorização do usuário.

## Prompt pronto para DeepSeek / OpenCode

```text
Implemente atividades de recuperação semestral no projeto RotinaDocente.

Leia AGENTS.md, specs/RULES.md (RN-67/69/75/80/81), specs/PRD.md,
specs/TESTS_SPEC.md (R81-01..08) e o plano completo:
docs/plans/2026-10-27-recuperacao-semestral.md.

Regra confirmada: uma ou várias atividades, com máximos somando 10 pontos;
somar notas obtidas, sem média automática. Exemplo 4+6, notas 3+5 = 8.
Ausência não é zero. Corrigir IA/manual, conferir, lançar em rec1/rec2 e
publicar são ações distintas. Não modificar fórmula existente de substituição
da menor nota, pesos 2/3 e aprovação 25/25/50.

Siga as cinco etapas do plano com TDD em arquivos novos. Antes do código,
complete os contratos técnicos API_SPEC/DATABASE_SCHEMA. Reutilize criação
normal/adaptada, autorização discente e persistência versionada do Diário.
Recuperação deve ficar fora de toda sincronização regular, inclusive global.
Preveja destinatários por ID, conta/turma/ano/semestre, legado explícito,
prévia obsoleta, correção alterada durante lançamento, idempotência e conflito.
Nunca sobrescreva recuperação manual diferente sem decisão explícita.
Preserve bimestres, outros alunos, feedback e histórico. Proteja também
chamadas diretas e listagens do Portal. Não crie bimestre 5/6.

Não editar/deletar testes antigos, migrar dados automaticamente, trocar
provedor de IA, ativar Blaze, mudar cobrança ou usar dados reais nos testes.
Não executar mudanças fora desse escopo nem apagar alterações alheias.

Entregue implementação e documentação completas, lista de arquivos,
resultados reais de testes/lint/build, evidência visual sintética e limitações.
Deixe os diffs de autorização/persistência/notas disponíveis para revisão
independente neste chat antes da publicação funcional. Não declarar essa
revisão feita por ter passado testes. Se um contrato crítico não puder ser
validado, explicite o bloqueio e não improvise gravação de notas.
```
