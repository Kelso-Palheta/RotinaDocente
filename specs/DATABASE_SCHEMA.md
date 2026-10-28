# 🗄️ Esquema de Dados (DATABASE_SCHEMA) — Cloud Firestore

## 1. Coleções Principais

### `professores/{userId}`
Documento do professor com perfil e permissões.
- `nome`: string
- `email`: string
- `modulos_permitidos`: array de IDs de módulos (`['diario', 'redacao-corretor', 'calendario-pedagogico', 'gerador-atividades']`)
- `ai_config`: Objeto com a configuração de BYOK de IA do professor:
  - `provider`: string (`'gemini' | 'openai' | 'anthropic' | 'maritaca' | 'openrouter'`)
  - `apiKey`: string (chave de API do provedor)
  - `model`: string (modelo padrão ou customizado selecionado)
  - `updatedAt`: timestamp
- `updatedAt`: timestamp

---

### `professores/{userId}/turmas/data`
Documento único contendo a lista completa de turmas do professor para sincronização atômica.
- `turmas`: Array de objetos de turma:
  - `id`: string
  - `nome`: string (ex: "3º Ano A")
  - `alunos`: Array de alunos (`id`, `nome`, `dataNascimento`, `loginKey`, `necessidades?`)
  - `bimestres`: Mapa de bimestres (`"1"`, `"2"`, `"3"`, `"4"`):
    - `atividades`: Array de atividades (`id`, `nome`, `max`)
    - `notas`: Mapa `{ [alunoId]: { simulado: number, [atvId]: number } }`
    - `config`: Objeto com pesos e critérios de aprovação.

---

### `professores/{userId}/correcoes/{corrId}`
Histórico de redações corrigidas.
- `alunoNome`: string
- `turma`: string
- `tema`: string
- `result`: string (markdown de feedback)
- `scoreData`: array com notas das 5 competências
- `totalScore`: number
- `createdAt`: timestamp

---

### `professores/{userId}/alunos_adaptados/{alunoId}`
Perfis de estudantes com necessidades específicas para adaptação curricular (PEI Rápido).
- `id`: string (UUID)
- `nome`: string (ex: "Lucas Silva")
- `turmaId`: string (referência à turma do professor)
- `turmaNome`: string (ex: "3º Ano B")
- `necessidades`: array de strings (`['tea', 'di', 'tdah', 'baixa_visao', 'cegueira', 'surdez', 'motora', 'dislexia', 'discalculia', 'ah_sd', 'epilepsia', 'ansiedade', 'toc', 'conduta', 'outras_condicoes']`)
- Observação: o mesmo array de IDs (`necessidades`, opcional) é suportado também no objeto de aluno embutido em `turmas[].alunos[]` (RN-43), sanitizado contra o catálogo oficial e omitido quando vazio.
- `nivelSuporte`: number (`1` - Leve, `2` - Moderado, `3` - Alto)
- `hiperfoco`: string opcional (ex: "Dinossauros, Transporte Ferroviário")
- `observacoes`: string opcional (ex: "Compreende melhor com frases curtas e apoio visual")
- `createdAt`: timestamp
- `updatedAt`: timestamp

---

### `professores/{userId}/atividades_adaptadas/{adaptacaoId}`
Registro de atividades adaptadas geradas pelo módulo.
- `id`: string (UUID)
- `titulo`: string (ex: "Ciclo da Água - Ciências 6º Ano")
- `disciplina`: string
- `anoLetivo`: string
- `habilidadeBNCC`: string opcional (ex: "EF06CI02")
- `origem`: string (`'do_zero' | 'atividade_existente'`)
- `conteudoOriginal`: string (texto ou enunciado original fornecido)
- `alunoId`: string opcional (referência a `alunos_adaptados`)
- `alunoNome`: string opcional
- `necessidades`: array de strings
- `nivelSuporte`: number
- `atividadeAdaptada`: string (texto estruturado da atividade com formatação acessível)
- `guiaMediacao`: string (texto de orientações para o professor regente e mediador do AEE)
- `gabarito`: string opcional
- `configImpressao`: objeto com opções de fonte (`14pt` | `18pt` | `24pt`) e contraste
- `createdAt`: timestamp
- `updatedAt`: timestamp

---

### `professores/{userId}/questoes_adaptadas/{questaoId}`
Banco de questões individuais adaptadas para reutilização e composição de provas.
- `id`: string (UUID)
- `enunciado`: string
- `tipo`: string (`'multipla_escolha' | 'verdadeiro_falso' | 'associacao' | 'discursiva'`)
- `alternativas`: array de strings (opcional)
- `gabarito`: string (opcional)
- `apoioVisualDescricao`: string (opcional)
- `imagemUrl`: string (opcional, base64)
- `scaffolding`: string (opcional, dica mediadora)
- `disciplina`: string
- `anoEscolar`: string
- `habilidadeBNCC`: string (opcional)
- `necessidades`: array de strings (`['tea', 'di', ...]`)
- `nivelSuporte`: number (1..3)
- `origem`: string (`'ia' | 'manual'`)
- `createdAt`: timestamp
- `updatedAt`: timestamp

---

### `professores/{userId}/provas_adaptadas/{provaId}`
Provas e avaliações personalizadas montadas a partir do banco de questões.
- `id`: string (UUID)
- `titulo`: string
- `disciplina`: string
- `anoEscolar`: string
- `instrucoes`: string
- `questoes`: array de objetos de questão (com ordem definida e customizações locais)
- `alunoId`: string opcional (referência a `alunos_adaptados`)
- `alunoNome`: string opcional
- `necessidades`: array de strings
- `nivelSuporte`: number
- `guiaMediacao`: string opcional
- `createdAt`: timestamp
- `updatedAt`: timestamp

## Calendário com escopo anual (RN-66)

Sob `professores/{uid}`, os novos documentos usam chave `{encodeURIComponent(turmaId)}__{anoLetivo}`:

- `grades_horarias/{chave}`: `turmaId`, `anoLetivo`, `dataInicioPeriodo`, `dataFimPeriodo`, `aplicarDesde`, `diasSemana`, `reposicoes` e origem de horários quando informada.
- `planejamentos/{chave}`: `turmaId`, `anoLetivo`, `topicos`.
- `feriados_turmas/{chave}`: `turmaId`, `anoLetivo`, `feriados: [{data,nome}]`.
- `calendario_versoes/{chave}`: `revision`, `turmaId`, `anoLetivo`, `atualizadoEm`.
- `aulas_agendadas/{id}`: coleção existente; escopo por `turmaId` e ano de `dataAgendada`. Preserva IDs existentes, status e conteúdo, acrescentando `anoLetivo`, `conteudoEncaminhado`, `historicoConteudos`, `topicosPendentes`, `bloqueioAutomatico`, `motivoCancelamento`, `execucao: {justificativa,restante}` e `reposicao` quando aplicáveis.

Leitura legada de documentos `{turmaId}` é aceita somente quando a grade identifica o ano compatível. A gravação cria documentos anuais e não sobrescreve o legado. Cada operação confirma que as leituras do snapshot ainda são atuais; divergência exige recarregar e revisar. Não há migração destrutiva automática nem exigência de novos índices compostos.

### Snapshot de notas no Portal (RN-67)
`notasAluno/{professorUid}_{turmaId}_{alunoId}.recuperacao`: objeto opcional com `rec1`/`rec2` pertencentes exclusivamente ao aluno do documento. Zero é preservado. Situações semestrais e anuais são derivadas na leitura, sem migração das notas.

### Diário — revisão e contexto (RN-68)
`professores/{uid}/turmas/data` mantém `turmas` como array compatível com os módulos existentes e acrescenta `revision` inteiro, `schemaVersion: 2` e `lastUpdated`. Vazio é estado válido e não dispara leitura legada. Uma transação valida conteúdo/revisão antes de gravar.

Turma pode incluir `anoLetivo`, `arquivada`, `copiadaDe` e `publicacoes` por bimestre/`ano` contendo `periodo`, `em`, `estado` (`completa`/`parcial`) e digest curto da assinatura. O digest sinaliza desatualização; a proteção de concorrência compara o conteúdo completo. Turmas antigas sem ano ficam em contexto legado, sem atribuição automática.

Cache `diario:{uid}:v2` contém rascunho, base, pendência e até 20 registros de histórico local. Cópia anterior de restauração: `diario_backup_anterior_{uid}`. Contexto: `diario_contexto_{uid}`. Resultado da publicação: `diario_publicacao:{uid}:{ano}`. Nenhum cache de outra conta é usado. Histórico local é limitado e não substitui backup duradouro.


## Atividades — RN-69
- `atividades/{id}`: documento privado do professor, sem `alunosPorTurma` nas novas gravações; `status: arquivada` conserva entregas e notas. Atividade e acessos são publicados num único lote, limitado preventivamente a 449 operações de acesso mais o documento principal.
- `atividades/{id}/tokens/{vinculo}`: chave Base64URL de JSON `[turmaId, alunoId]`; token novo inclui segredo criptograficamente aleatório. Metadados mínimos `alunoId`, `turmaId`, `nome`, `revogado`. Acessos legados por aluno são lidos com sessão; alterações reconciliam e revogam vínculos removidos sem apagar históricos.
- Entrega nova: `entregas/{activityId}__{vinculo}`; leitura do antigo `{activityId}_{alunoId}` exige turma/aluno correspondentes. Criação transacional; repetição retorna conflito sem mutação.
- Regras Firestore restringem atividades/tokens ao professor proprietário, preservam autoria e autorizam entrega legada pelo vínculo com sua atividade. Alunos usam o BFF com Admin SDK, onde a autorização é revalidada.

## Recuperação semestral por atividades (RN-81)
- `professores/{uid}/conjuntos_recuperacao/{conjuntoId}`: documento privado do professor. Campos `professorId`, `turmaId`, `anoLetivo`, `semestre` (`'1' | '2'`), `destinatariosIds` (IDs canônicos, sem duplicatas), `atividadeIds`, `estado` (`rascunho | pronto | cancelado`), `versao` inteiro positivo, `criadoEm`/`atualizadoEm`. Um conjunto pertence a uma única turma/ano/semestre; conjuntos adaptados para alunos diferentes podem coexistir. A subcoleção já é coberta por `professores/{userId}/{document=**}` nas regras atuais.
- `atividades/{id}` de recuperação: `finalidade: 'recuperacao_semestral'`, `conjuntoRecuperacaoId`, `semestre`, `anoLetivo`, `destinatariosIds`, `turmaIds` com exatamente uma turma e **sem** `bimestre`. `notaMaxima` é a parcela do orçamento de 10 pontos. Atividade sem `finalidade` continua regular.
- A soma das parcelas nunca passa de 10 pontos, em centésimos. Máximo menor que 10 deixa o conjunto incompleto; não há reescalonamento automático.
- `entregas/{activityId}__{vinculo}` de recuperação acrescenta `finalidade`, `conjuntoRecuperacaoId` e `semestre`, derivados no servidor, e não grava `bimestre`.
- Diário: `turmas[].recuperacao[alunoId].rec1|rec2` continua numérico e é o único valor lido pela fórmula existente. A proveniência fica fora desses números em `turmas[].recuperacaoLancamentos[alunoId].rec1|rec2 = { conjuntoId, versao, semestre, chave, total, parcelas:[{atividadeId,nota}], anterior, em, por }`. `chave` é idempotente por conjunto/versão/aluno/semestre/total.
- Backup novo e antigo preservam `recuperacao` e `recuperacaoLancamentos`; restaurar backup sem proveniência mantém a nota numérica e não inventa histórico. Nenhum lançamento grava `bimestres`, atividades regulares, outros alunos ou notas manuais diferentes sem confirmação.

## RN-73 — Correções
professores/{uid}/correcoes/{idUnico}: schemaVersion 2; alunoId, turmaId, turmaNome/studentClass, anoLetivo, bimestre, loginAluno/loginKey; originalText; result; scoreData; totalScore (null parcial); assessmentMode, competencias; anulada/motivo; status rascunho|revisado|publicado|arquivado; createdAt/updatedAt/publishedAt; revisoes com versão anterior, autor e data. Legados não são reescritos ao carregar. Vínculo existente do Diário preservado; módulo redação não remove nem altera contexto existente incompatível.

Novas redações RN-73 também registram `rubricaVersao`, `rubricaFonte` e `rubricaHomologada:false`. A referência é para conferência docente; schemaVersion não equivale a homologação da edição oficial. `historico` armazena versões anteriores com autor/data, e `revision` protege atualização concorrente.
