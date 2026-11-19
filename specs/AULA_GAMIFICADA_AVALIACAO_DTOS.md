# Contratos e DTOs Concretos — Aula Gamificada Avaliativa

**Referência:** `specs/AULA_GAMIFICADA_AVALIACAO_SPEC.md`
**Data:** 2026-11-18

---

## 1. Relação com a Infraestrutura Real (Firestore Admin)

1. **Diário do Professor (`professores/{uid}/turmas/data`)**
   - Lido e gravado em transação via `DiarioRepository` (cliente) e `tx.get/tx.set` (Admin `FirestoreStore`).
   - Estrutura: `{ turmas: Turma[], revision: number, lastUpdated: number, schemaVersion: 2 }`.
   - Cada `Turma` contém `{ id, nome, ano, anoLetivo, arquivada, alunos: [{ id, nome, loginKey }], bimestres: { ['1'|'2'|'3'|'4']: { atividades: [{ id, nome, max }], notas: { [alunoId]: { [atvId]: number } } } } }`.
   - O ano letivo é extraído exclusivamente por `anoLetivoTurma(turma)` (`@/dominio/diario/evolucao`), preservando turmas sem ano explícito como `'legado'`.

2. **Atividades (`atividades/{activityId}`)**
   - Coleção global `atividades`, indexada por `professorId` e `turmaIds` (usada pelo Portal do Aluno em `/api/aluno/boletim` e pelo módulo `/atividades`).
   - Quando uma sala `avaliativa` é criada (`POST /salas`), cria-se um documento por `(turmaId, bimestre)` (ou vínculo estável `ag_${codigo}_${turmaId}`) com:
     - `origem: 'aula_gamificada'`
     - `salaCodigo: codigo`
     - `modalidade`
     - `professorId: uid`
     - `turmaIds: [turmaId]`
     - `bimestre: '1' | '2' | '3' | '4'`
     - `anoLetivo: string | number`
     - `titulo`, `disciplina`, `conteudo`, `notaMaxima`
     - `status: 'publicada'` somente após confirmação docente de publicação no Portal (`rascunho_gamificado` ou `aguardando_publicacao` antes disso, para não vazar notas não conferidas no `/api/aluno/boletim` antes da hora).

3. **Entregas (`entregas/{entregaId}`)**
   - Coleção global `entregas` (usada por `aplicarSincronizacaoAtividades` em `@/dominio/diario/sincronizacaoAtividades` e por `/api/aluno/boletim`).
   - ID determinístico: `ag_${codigo}_${turmaId}_${alunoId}` (reutiliza e evita duplicidade em reenvios).
   - Campos: `{ id, activityId, professorId, turmaId, alunoId, bimestre, origem: 'aula_gamificada', salaCodigo, status: 'corrigido' | 'revisado', notaFinal, notaRevisada, justificativaRevisao, aproveitamento, situacao, atualizadoEmMs }`.

4. **Salas e Índice Paginado (`aulaGamificadaSalas/{codigo}` e `aulaGamificadaDocentes/{uid}/salas/{codigo}`)**
   - `aulaGamificadaSalas/{codigo}` armazena o objeto congelado da sala, incluindo `finalidade: 'revisao' | 'avaliativa'` e `avaliacao` (configuração congelada + snapshot de finalização/revisões/sincronização).
   - `aulaGamificadaDocentes/{uid}/salas/{codigo}` mantém o resumo indexável para listagem paginada em `GET /avaliacoes` sem truncamento oculto em 30 itens.

---

## 2. DTOs dos Endpoints (`/api/aula-gamificada`)

### 2.1 Extensão de `POST /salas`
- Campos opcionais no corpo:
  - `finalidade?: 'revisao' | 'avaliativa'` (padrão `'revisao'`)
  - `avaliacao?: { tituloAtividade: string, disciplina: string, conteudo?: string, bimestre: '1'|'2'|'3'|'4', anoLetivo: string, valorMaximo: number, criterioHerois?: 'primeira_tentativa' | 'melhor_tentativa', colunaPorTurma?: Record<string, { atvId?: string, nomeColuna?: string }> }`
- Se `finalidade === 'avaliativa'`, todos os campos obrigatórios de `avaliacao` e compatibilidade de turmas/ano são validados antes de gravar, congelando os critérios na sala e criando os vínculos de atividade por turma/bimestre.

### 2.2 `GET /avaliacoes/contexto` (Docente)
- Retorna: `{ anos: Array<{ id: string, rotulo: string }>, turmas: Array<{ id, nome, anoLetivo, arquivada, bimestres: Record<string, { atividades: Array<{ id, nome, max }> }> }>, bimestres: ['1','2','3','4'] }`.

### 2.3 `GET /avaliacoes` (Docente — Histórico Paginado)
- Query params: `cursor?`, `limite?` (padrão `20`, máx `100`), `ano?`, `turmaId?`, `bimestre?`, `alunoId?`, `disciplina?`, `conteudo?`, `finalidade?`, `de?`, `ate?`.
- Retorna: `{ itens: ResumoSalaHistorico[], proximoCursor: string | null, totalFiltrado: number }`.

### 2.4 `GET /salas/{codigo}/relatorio` (Docente e Aluno autorizado)
- **DTO Docente:**
  - `{ sala, configuracaoCongelada, encerrada, resumoTurma: { totalElegiveis, presentes, ausentes, semOportunidade, pendentes, mediaAproveitamento, mediaNota, distribuicao }, alunos: RelatorioAlunoDTO[], auditoria: AuditEntry[], sincronizacao: SyncState }`.
- **DTO Aluno:**
  - Somente se disponibilizado pelo docente (`publicadoPortal === true`) e pertencente ao aluno autenticado: `{ sala, configuracaoCongelada, meuResultado: RelatorioAlunoDTO }`.

### 2.5 `POST /salas/{codigo}/avaliacao/revisar` e `POST /salas/{codigo}/avaliacao/finalizar` (Docente)
- `revisar`: `{ requestId, expectedRevision, alunoId, turmaId, notaRevisada, justificativa }` → registra nova versão auditada sem apagar `notaCalculada` nem versões anteriores.
- `finalizar`: `{ requestId, expectedRevision, zerarAusentes?: boolean, justificativaAusentes?: string, publicarPortal?: boolean }` → consolida relatório oficial congelado e entregas por turma.

### 2.6 `POST /salas/{codigo}/avaliacao/sincronizar` (Docente)
- Corpo: `{ requestId, expectedRevision, turmaIds?: string[], confirmarSobrescrita?: boolean, publicarPortal?: boolean }`.
- Em `dryRun: true` retorna prévia por turma/bimestre/coluna/aluno (`conflitos`, `incompatibilidadesEscala`, `alteracoes`).
- Em execução real: grava em transação no `professores/{uid}/turmas/data` (com checagem de `revision` do Diário), atualiza `entregas` e registra pendências recuperáveis se alguma etapa parcial falhar.

### 2.7 `GET /avaliacoes/minhas` (Discente)
- Autenticado via sessão do Portal do Aluno (`loginKey` + vínculo ativo).
- Retorna: `{ avaliacoes: Array<{ codigo, titulo, disciplina, conteudo, modalidade, bimestre, anoLetivo, valorMaximo, aproveitamento, notaFinal, situacao, publicadaEmMs }> }`.


## Persistência Escalável e Limites do Firestore (`REV-AV-15`)
- `aulaGamificadaSalas/{codigo}/avaliacao/estado`: armazena metadados de estado (`finalizada`, `publicadoPortal`, `versaoPublicada`, `publicadaEmMs`, `revisoesPorParticipante`, `auditoria`, `sincronizacao`, `pendenciasAtualizacao`), sem duplicar relatórios agregados de todos os estudantes.
- `aulaGamificadaSalas/{codigo}/avaliacaoVersoes/{versaoPublicada}`: armazena uma única cópia congelada da configuração da sala (`sala`, `configuracaoCongelada`) e dos textos-base por rodada (`questoesBase[rodada]`: `enunciado`, `respostaCorreta`, `explicacao`).
- `aulaGamificadaSalas/{codigo}/avaliacaoPublicados/{versaoPublicada}_{participanteId}`: armazena o resultado individual daquela versão publicada com `detalhesCompactos` (sem duplicar textos longos comuns das questões), reconstruindo `detalhesQuestoes` completos sob demanda em `relatorioSala`.
- `aulaGamificadaDocentes/{uid}/requisicoes/{chave}` (`rev_nota` e `fin_av`): persiste `compacto` (identificadores, `revision`, `versaoPublicada`, `revisoesPorParticipante`, `auditoria`, `zerarAusentes`, `sincronizacao`), reconstruindo a resposta exata da versão correspondente em reenvios idempotentes dentro do limite de `1 MiB` por documento.
