# Planejamento → partida — plano de implementação

**Objetivo:** conectar plano docente persistente à geração de questões e preparação de jogos existentes.
**Arquitetura:** domínio de planos validado, armazenamento privado via serviço atual e mesma autenticação/HTTP. Interface cria/edita plano e preenche gerador/preparação; sala congela snapshot. Sem nova regra de notas.
**Tecnologias:** React/Next, Firestore adapter existente e Vitest.

1. Escrever novos testes de serviço/HTTP para isolamento, persistência, idempotência, revisão e snapshot; observar RED.
2. Implementar domínio e serviço de planos; integrar sala e HTTP sem alterar avaliação; testar GREEN.
3. Escrever testes UI de salvar/reabrir/plano→gerador→preparação. Implementar formulário privado, prefill por props e navegação com plano preservado.
4. Integrar referência de condução docente. Rodar testes focados, depois suíte isolada de alterações alheias, lint/build.
5. Capturar componentes reais com dados sintéticos em desktop/mobile. Revisão independente de persistência/isolamento e UI. Corrigir, validar, commit/push e verificar publicação.

Arquivos principais: novos dominio/aula-gamificada/planos.js, aplicacao/aula-gamificada/PlanejamentoService.js, componentes/aula-gamificada/PlanejarAula.jsx e testes novos; integração AulaGamificadaService.js, httpServidor.js, api.js, HubDocente.jsx, GeradorIAQuestoes.jsx, PrepararSala.jsx e SalaDocenteView.jsx.
