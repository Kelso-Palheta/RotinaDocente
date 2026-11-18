# Plano de execução — Aula Gamificada

Objetivo: entregar cinco modalidades para todas as disciplinas, com banco, geração IA por tema/material, dificuldades, sala docente, aluno e projeção.
Arquitetura: contrato em `specs/AULA_GAMIFICADA_SPEC.md`, camadas de domínio/aplicação/infraestrutura e páginas Next. Dependências reais de `frontend/package.json` e lockfile prevalecem sobre descrições antigas de versões. Aplicar AGENTS.md.

## Execução paralela sem disputa de arquivos

### DeepSeek — servidor, banco e geração IA

Arquivos exclusivos:
- `frontend/src/dominio/aula-gamificada/`
- `frontend/src/aplicacao/aula-gamificada/`
- `frontend/src/infraestrutura/aula-gamificada/`
- `frontend/src/app/api/aula-gamificada/`
- Novos testes `tests/unit/aula_gamificada_*.test.js`, `tests/integration/aula_gamificada_*.test.js`, `tests/contract/aula_gamificada_*.test.js`.
- `docs/analises/2026-11-18-aula-gamificada-servidor.md`.

1. Ler contrato e autenticação/transações reais da Revisão, sem modificar esses módulos.
2. Criar testes de contrato/negócio e observar RED.
3. Implementar modelos, validação, banco privado, revisão e geração BYOK. Manter contrato HTTP exatamente como especificado.
4. Implementar salas, participantes/equipes, estado público/privado, cinco modalidades e respostas idempotentes. Testar concorrência e prazo.
5. Rodar testes focados e lint. Registrar arquivos, comandos, resultados e pendências reais.
6. Entregar diff sem commit/push. Não tocar interface, documentação compartilhada, auth-context.js nem arquivos de Revisão com alterações locais.

### Antigravity — experiência e cinco jogos

Arquivos exclusivos:
- `frontend/src/app/aula-gamificada/` com página docente, `/sala/[codigo]` e `/projecao/[codigo]`.
- `frontend/src/app/aluno/aula-gamificada/` com acesso à sala e `/[codigo]`.
- `frontend/src/components/aula-gamificada/`, incluindo cliente HTTP próprio `api.js`.
- Entrada mínima em `frontend/src/config/modules.js`, `frontend/src/components/Dashboard.js` e navegação real do Portal para acesso ao novo módulo.
- Novos testes `tests/unit/components/aula-gamificada/`.
- `docs/analises/2026-11-18-aula-gamificada-interface.md` e capturas em `docs/evidencias/2026-11-18-aula-gamificada/`.

1. Ler contrato e tokens/componentes visuais atuais; seguir documentação Next local antes de implementar.
2. Criar testes de fluxo com HTTP simulado conforme contrato e observar RED.
3. Criar catálogo dos cinco modelos, banco com filtros, edição/revisão, formulário IA por tema/material e contagens fácil/médio/difícil. Extrair arquivos com utilitários existentes; solicitar revisão do texto antes de gerar. Bearer docente e headers BYOK são enviados apenas onde necessários, sem gravar chaves.
4. Preparar sala, associar turmas e equipes, selecionar questões revisadas compatíveis. Usar endpoints definidos, sem inventar serviços ou persistência local de produção.
5. Implementar cinco experiências de jogo, participação discente e controles/telão docente. Polling sem sobreposição, cancelamento no unmount, recuo e recuperação por estado durável. Não chamar IA durante partidas.
6. Reutilizar padrão de permissões existente do Aulão para visibilidade e acesso docente, sem conceder módulos a contas nem editar perfis. A API continua responsável pela autorização.
7. Validar acessibilidade/teclado, desktop/celular e dados sintéticos. Capturas de fixture devem ser identificadas como tal. Registrar o que foi integrado de verdade e o que aguarda servidor.
8. Entregar diff sem commit/push. Não tocar servidor, regras de banco, auth-context.js ou Revisão pendente. Não criar páginas demonstrativas com persistência simulada apresentadas como funcionalidade pronta.

## Revisão integrada — ChatGPT

Conferir contratos, autenticação, concorrência, isolamento, extração e conteúdos por disciplina. Resolver divergências entre entregas. Percorrer preparação → geração/revisão → sala → participação nos cinco jogos → feedback/ranking → reabertura, com registros sintéticos. Executar suíte completa, lint e build, revisar capturas e publicar somente após aceite técnico. Preservar trabalho anterior pendente no pódio e auth-context.js.

## Prompt DeepSeek

Implemente integralmente sua parte do plano `docs/plans/2026-11-18-aula-gamificada.md`, seção “DeepSeek — servidor, banco e geração IA”, seguindo `specs/AULA_GAMIFICADA_SPEC.md` e AGENTS.md. Antigravity trabalha simultaneamente na interface, portanto respeite a propriedade de arquivos e o contrato HTTP congelado. Testes RED antes do código, sem alterar testes existentes. Conclua banco, IA e servidor dos cinco jogos. Entregue diff e relatório com validações. Sem commit/push.

## Prompt Antigravity

Implemente integralmente sua parte do plano `docs/plans/2026-11-18-aula-gamificada.md`, seção “Antigravity — experiência e cinco jogos”, seguindo `specs/AULA_GAMIFICADA_SPEC.md` e AGENTS.md. DeepSeek trabalha simultaneamente no servidor, portanto respeite a propriedade de arquivos e o contrato HTTP congelado. Entregue catálogo, banco, geração por tema/material, dificuldades, cinco jogos, aluno e telão reais. Valide com testes e capturas sintéticas desktop/celular e descreva dependências de integração. Sem commit/push.
