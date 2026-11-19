# Natação e Acerte ou Perde — plano de implementação

**Objetivo:** integrar os dois modelos PPTX analisados como jogos funcionais para todas as disciplinas.
**Arquitetura:** domínio puro para progresso/pontos e questão aberta; serviço transacional autoritativo; componentes de jogo compartilhados entre aluno e telão. Preservar permissões, grupos, relatórios e avaliação existentes.
**Tecnologias:** Next.js/React, Firestore, Vitest, imagens/trilhas locais dos materiais fornecidos.
**Fonte:** `specs/AULA_GAMIFICADA_NATACAO_ACERTE_SPEC.md`. A análise apresentada e aprovada pelo usuário constitui o desenho funcional.

1. RED: novos testes em `tests/unit/aula_gamificada_natacao_acerte.test.js`, `tests/integration/aula_gamificada_natacao_acerte.test.js` e `tests/unit/components/aula-gamificada/NatacaoAcerteUI.test.jsx`: catálogo, privacidade de resposta-modelo, pontos/progresso, idempotência e correção manual. Executar antes da implementação.
2. GREEN domínio: `frontend/src/dominio/aula-gamificada/{modalidades,questoes,geracao,sala,avaliacao}.js` e módulo puro `corrida.js`. Acrescentar modalidades e resposta aberta; preservar caminhos legados.
3. GREEN serviço: `frontend/src/aplicacao/aula-gamificada/AulaGamificadaService.js`: persistir configuração congelada, consolidar corrida, julgar resposta aberta e bloquear pendências antes do ranking/encerramento. Testar fluxo real de criação → resposta → feedback → relatório.
4. Interface: constantes, formulário/banco/gerador/preparação; componentes `JogoNatacao`, `JogoAcertePerde`, `CorrecaoAbertaDocente`; integrações `SalaAlunoView` e `SalaDocenteView`. Extrair e otimizar assets dos PPTX para pastas específicas; ampliar catálogo audiovisual sem repetir decisões de áudio.
5. Atualizar somente expectativas autorizadas de quantidade/lista de jogos. Reexecutar testes direcionados e suíte completa numa cópia de publicação sem alterações paralelas.
6. Validar capturas desktop/celular, lint e build; registrar entrega e limitações observadas; revisar diff; commit/push automático após aprovação das verificações e confirmar publicação.
