# Plano de execução: anual integrado

Design solicitado e autorizado pelo usuário: anual como raiz, conteúdos selecionáveis em todos os formatos menores e vínculo opcional para jogos avulsos. Sem sincronização destrutiva; descendentes preservam snapshot de origem.

1. Especificar contrato em PLANEJAMENTO_ANUAL_INTEGRADO_SPEC.md e criar regressões RED para catálogo, aplicação e serviço privado.
2. Implementar domínio puro de seleção/aplicação e normalização do vínculo; verificar raiz/revisão/itens na transação existente, mantendo legado e idempotência.
3. Integrar seletor anual compartilhado no editor e derivações; preservar vínculo na gamificação e impressão; orientar ausência de anual; biblioteca mantém modelos e exige origem nos planos menores.
4. Adaptar somente testes autorizados de criação sem fonte; executar suíte, lint/build e capturas reais com dados sintéticos em cópia isolada.
5. Revisar diff, preservar alterações alheias, registrar relatório e publicar após validação.
