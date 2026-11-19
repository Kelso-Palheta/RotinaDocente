# Revisão autônoma e plataforma 2D — plano

**Objetivo:** executar o desenho aprovado em `specs/REVISAO_AUTONOMA_PLATAFORMA_SPEC.md`.
**Arquitetura:** física pura e projeção no domínio; serviço transacional separado; autenticação/Firestore existentes; Canvas 2D no cliente. Conteúdo liberado explicitamente pelo docente, sem uso de credenciais de IA discente.
**Tecnologias:** React/Next.js, Canvas 2D, Firestore Admin, Vitest. Sem dependência nova.

1. Criar testes RED em `tests/unit/revisao_autonoma_plataforma.test.js` e `tests/integration/revisao_autonoma.test.js`.
2. Implementar física e serviço em `frontend/src/dominio/revisao-autonoma/plataforma.js` e `frontend/src/aplicacao/revisao-autonoma/RevisaoAutonomaService.js`; testar isolamento, snapshots privados, idempotência, feedback e histórico.
3. Criar adaptador HTTP/runtime e rota `frontend/src/app/api/revisao-autonoma/[...partes]/route.js`, reutilizando cookie e Bearer existentes; acrescentar testes de contrato.
4. Implementar `frontend/src/components/revisao-autonoma/` com publicação por turma, seleção discente, palco jogável e feedback/histórico. Integrar BancoQuestoes e entrada no Portal sem alterar salas existentes.
5. Capturar telas sintéticas desktop/celular e testar teclado/toque, física, colisões e retomada. Solicitar revisão independente de segurança/persistência.
6. Validar em cópia isolada que exclui mudanças paralelas de revisão ENEM/autenticação. Suíte completa, lint, build, diff e commit/push; conferir publicação.
