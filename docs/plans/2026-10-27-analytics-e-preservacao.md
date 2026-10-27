# Analytics e preservação — plano de implementação

Desenho aprovado: auditorias de Analytics e revisão das implementações recentes; autorização do usuário em 27/10/2026.

Objetivo: indicadores e relatórios coerentes, contexto isolado e preservação em falhas.
Arquitetura: domínio de Analytics produz DTO único; aplicação lê DiarioRepository sem efeitos de gravação; apresentação usa DTO em gráficos/tabelas/PDF. Correções posteriores preservam contratos existentes do Horário e Portal.
Stack: Next/React, Vitest, jsPDF, Recharts, Firebase existentes.

1. Registrar RN-79/RN-80 e novos testes em tests/unit/analytics_consistencia.test.js, tests/unit/components/analytics/AnalyticsSeguro.test.jsx e tests/unit/analytics_pdf.test.js. Executar e confirmar falhas antes do código.
2. Corrigir métricas e criar dominio/analytics/analise.js e hooks/analytics/useDadosAnalytics.js. Dataset inclui todos os alunos, situação, completude e critérios; testes cobrem notas/25/50/escala.
3. Reorganizar app/analytics/page.js e componentes de Analytics com filtros, cobertura, pendências, radar navegável e gráficos com tabelas acessíveis. Gerador PDF consome mesmo dataset, pagina texto completo. Validar testes dirigidos e UI.
4. Criar novos testes positivos baseados nas reproduções da revisão em tests/; confirmar Red. Corrigir HorarioRepository/HorarioApp e Portal; não alterar testes existentes.
5. Rodar suíte completa, lint dos arquivos alterados, build e conferir interface/PDF sintético. Documentar limites e guia. Commit/push somente após verificações necessárias. Não modificar evidências históricas para passarem como regressões.

Resultado: etapas implementadas, 902 testes/198 arquivos aprovados; testes preexistentes preservados. A leitura consultiva foi separada no caso de uso `frontend/src/aplicacao/analytics/consultarDiarioAnalytics.js`. Revisão independente resolveu um P1 adicional com duas regressões; build final aprovado e publicação autorizada.
