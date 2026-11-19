# Avaliação gamificada — segunda revisão

Data: 19/11/2026. **Ainda não publicar.**

A revisão das correções anteriores aprovou **31 arquivos / 149 testes** na suíte focada, incluindo as sete regressões anteriores. Não foram alteradas expectativas de testes existentes nesta revisão.

Três casos adicionais, usando as interfaces públicas do serviço e a identificação SHA-256 aplicada em produção, reproduzem falhas. Arquivo: `tests/regression/aula_gamificada_avaliacao_producao.test.js`. Resultado: **3 falhas / 3 testes**. Os casos de finalização/revisão usam armazenamento transacional que proíbe leituras após escritas e somente confirma mudanças ao concluir.

## REV-AV-12 — filtro de aluno incompatível com produção

`AulaGamificadaService.listarAvaliacoes` identifica o aluno verificando `roster` por igualdade com alunoId ou sufixo `:alunoId`. Porém `runtimeServidor.js` injeta `idParticipante` com SHA-256 de `[turmaId, alunoId]`. Nenhum dos dois formatos comparados corresponde ao ID real.

Reprodução: sala com aluno `a1` da turma `t1`, roster com hash real. Listagem por `{turmaId:'t1', alunoId:'a1'}` devolve zero salas. Os testes entregues usam IDs `t1:a1` e não detectam isso.

Resolver com IDs estáveis através de `this.idParticipante(turmaId, alunoId)` para as turmas no escopo ou pelos documentos de participação, mantendo compatibilidade explícita com registros antigos. Não recorrer a nomes nem enfraquecer a proteção dos IDs. Cobrir aluno sem filtro de turma e mesmo alunoId local em turmas distintas.

## REV-AV-13 — sincronização não valida ano letivo atual

`sincronizarDiario` encontra turma por ID e valida máximo da coluna, mas não compara `anoLetivoTurma(turma)` com `sala.avaliacao.anoLetivo`. Uma sala congelada em 2026 lança nota numa turma que atualmente pertence a 2025 com o mesmo ID.

Usar `anoLetivoTurma`, normalizar legado da mesma forma que a criação, rejeitar divergência com erro 422 antes de qualquer gravação. Aplicar a validação tanto na prévia quanto na confirmação. Preservar outras turmas/bimestres, simulado e recuperação. Não inferir ano a partir da data.

## REV-AV-14 — versão revisada vaza antes de republicação

Sequência reproduzida:

1. Docente finaliza/publica nota 10. Portal resumo e relatório individual mostram 10.
2. Docente revisa para 6, com justificativa, sem acionar publicação novamente.
3. `minhasAvaliacoes` continua mostrando 10, mas `relatorioSala(aluno, codigo)` já mostra 6.

`relatorioSala` recalcula o resultado com `avalDoc.revisoesPorParticipante` atual e usa apenas o booleano `publicadoPortal` como autorização de publicação. A flag `pendenciasAtualizacao.portalPendente` não impede exibir a versão não publicada. Isso contradiz a separação entre revisão e disponibilização e gera divergência entre resumo e detalhe.

Persistir versão/snapshot publicado do resultado e devolutivas por estudante. Consulta discente deve usar somente essa versão; docente continua vendo a revisão atual. Republicar explicitamente deve atualizar resumo/detalhe e versão de modo consistente/idempotente. Ao republicar, resolver a pendência correspondente sem declarar Diário atualizado se não foi sincronizado. Preservar vínculo/autorização e os dados já publicados; tratar registros legados com limitação explícita quando não houver snapshot reproduzível.

## Validação e entrega

Preservar testes existentes e as três novas regressões; acrescentar casos complementares descritos acima, incluindo revisão → republicação e reenvio. Reexecutar suíte completa, lint e build após corrigir. Atualizar relatório com resultados efetivos e capturas de resumo/detalhe do aluno antes/depois da republicação. Não foi executada nova suíte completa/lint/build nesta revisão após reproduzir os três bloqueios; resultados declarados pela entrega anterior não validam a próxima versão.

Evitar alterações fora do escopo, especialmente `components/revisao/*` e `lib/auth-context.js`. **Sem commit/push até nova revisão neste chat.**
