# Avaliação gamificada — capacidade de persistência

Data: 19/11/2026. **REV-AV-12 a REV-AV-14 aprovadas; publicação ainda bloqueada por REV-AV-15.**

Validação independente: suíte focada existente **33 arquivos / 155 testes aprovados**, incluindo as regressões anteriores de identificação, ano e versão publicada. Não houve alteração de testes existentes nesta revisão.

## REV-AV-15 — relatório agregado excede limite do Firestore

O Firestore permite no máximo **1 MiB (1.048.576 bytes) por documento** e **10 MiB por requisição**: [documentação oficial de limites](https://firebase.google.com/docs/firestore/quotas). Esses são limites de capacidade, não uma configuração resolvida mudando o plano de cobrança.

O teste novo `tests/regression/aula_gamificada_avaliacao_limites_firestore.test.js` reproduz finalização de uma turma de **40 alunos**, com **20 questões**, cada uma com enunciado de **800 caracteres** e explicação de **800 caracteres**. São valores dentro dos limites existentes, sem nomes ou textos excepcionalmente grandes. Todos responderam, permitindo gerar devolutivas individuais completas.

Dois cenários falham:

| Operação | Documento excedido | Tamanho mínimo medido |
| --- | --- | --- |
| Finalizar sem publicar | `aulaGamificadaDocentes/prof-1/requisicoes/618ae019c9d236fd` | **1.288.236 bytes** |
| Finalizar e publicar | `aulaGamificadaSalas/AVCAP1/avaliacao/estado` | **1.288.207 bytes** |

A medição soma **somente bytes UTF-8 dos valores de strings**. Não inclui nomes dos campos, números nem outros custos do formato Firestore; portanto é um limite inferior conservador, não uma aproximação que possa acusar falha apenas por overhead de JSON. O teste usa armazenamento transacional com confirmação ao final e bloqueio de leituras após escritas. Não depende de chamar o Firebase real nem de credenciais.

### Causa

- `finalizarAvaliacao` grava o relatório completo no documento de idempotência (`resposta.relatorio`).
- Ao publicar, também copia todos os resultados individuais para `snapshotPublicado.porParticipante` em um único documento `avaliacao/estado`.
- Cada resultado individual repete enunciado/explicação/gabarito das questões. Esse conteúdo cresce com **alunos × questões × texto**.
- `revisarNotaAvaliacao` também persiste uma resposta com relatório completo; corrigir somente a publicação não resolve toda a família de operações.

### Correção requerida

1. Separar a persistência por entidades/versões com tamanho limitado. Evitar duplicar textos comuns em cada aluno e guardar todos os alunos num documento agregado. As questões já estão congeladas por conteúdo; referências imutáveis e dados individuais compactos podem preservar a reprodutibilidade da versão publicada.
2. Documentos de idempotência devem guardar identificadores/versões e resultado compacto; reconstruir a resposta exigida pelo contrato sem devolver silenciosamente outra versão numa repetição. Não gravar relatórios integrais da turma em cada requestId.
3. Manter atomicidade e a coerência entre resumo, detalhe, versão publicada e pendências. Se forem necessários lotes/etapas, usar estado recuperável e ativação de versão somente após completar os dados, sem expor publicação parcial. Considerar também os limites agregados de requisição/transação.
4. Preservar contratos, notas, explicações completas, PDF/CSV, privacidade por estudante e compatibilidade com snapshots já persistidos. Não truncar feedback, reduzir quantidade de alunos/questões ou aumentar plano como atalho para fazer o teste passar.
5. Preservar os dois novos testes e todos os anteriores. Acrescentar cobertura da revisão de nota com turma completa, reenvio de finalização/republicação e falha recuperável, além da leitura das versões publicadas antigas.

## Entrega esperada

Implementar somente esta correção e dependências necessárias. Atualizar documentação de persistência/DTOs e relatório. Reexecutar testes completos, lint e build, mantendo capturas anteriores válidas e acrescentando evidência do cenário de capacidade. Nesta revisão, não foi repetida a suíte completa/lint/build após identificar o bloqueio; o resultado focado acima não equivale a validação integral.

Preservar alterações alheias em `components/revisao/*`, `lib/auth-context.js` e arquivos de outras tarefas. **Sem commit/push até revisão neste chat.**
