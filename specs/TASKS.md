# 📋 Backlog e Esteira Operacional (TASKS)

## 🚀 Entregas Concluídas
- [x] **TASK-01:** Implementação do módulo Diário Pedagógico com publicação de notas.
- [x] **TASK-02:** Implementação do Corretor de Redações ENEM com IA.
- [x] **TASK-03:** Implementação do Calendário Pedagógico com Grade Semanal e Importação Inteligente.
- [x] **TASK-04:** Criação da Landing Page de Vendas oficial inspirada em `simuladoapp.com.br`.
- [x] **TASK-05:** Redesign Global de todas as telas internas unificando a identidade visual.
- [x] **TASK-06:** Setup do framework de governança Spec-Driven Development (`specs/`, `tests/`, `.devcontainer/`).
- [x] **TASK-07:** Implementação do Remanejamento em Cascata (Smart Shift), status interativos, visão semanal e exportação PDF no Calendário Pedagógico.
- [x] **TASK-08:** Gestão de Feriados e Recessos Escolares com importação de feriados nacionais e Smart Shift automático.
- [x] **TASK-09:** Redesign Global e Polimento do Portal do Aluno (`/aluno`, `/aluno/notas`, `/aluno/atividade`) com emissão de Boletim Escolar em PDF.
- [x] **TASK-10:** Exportação da Caderneta Escolar Oficial em PDF (Paisagem A4 com assinaturas) e Planilha Excel/CSV no Diário Pedagógico.
- [x] **TASK-11:** Hub de Agentes Pedagógicos MVP — 2 agentes conversacionais (Ensino Médio e Fundamental II) com chat persistente, API segura e design glassmorphism.
- [x] **TASK-12:** Dashboard Analytics Pedagógico (`/analytics`) — Métricas de rendimento (média geral, aprovação, radar de risco), gráficos Recharts (evolução bimestral, faixas de notas, comparativo multiturmas) e filtros interativos.
- [x] **TASK-13:** Calendário Pedagógico Flexível — Auto-Agendamento em 1 clique com data de partida selecionável (RN-19), Decisão Pedagógica interativa ao mudar status (Smart Shift vs Pular Tópico - RN-20), Edição/Exclusão manual de tópicos e Barra de Progresso Curricular.
- [x] **TASK-14:** Exportação de Relatórios Executivos Consolidados em PDF no Dashboard Analytics Pedagógico (`/analytics`) para a Coordenação e Direção Escolar.
- [x] **TASK-15:** Conexão de Inteligência Artificial & BYOK (Bring Your Own Key) — Integração de chaves pessoais dos professores (Google Gemini, OpenAI, Anthropic, Maritaca AI e OpenRouter), persistência híbrida Firestore/LocalStorage, bloqueio sem chave (sem fallback central), botão/modal de conexão no Dashboard e teste de latência em tempo real.

---

## 🎯 Próximas Entregas (Backlog)
- [x] **TASK-16:** Otimização do pipeline de OCR para PDFs manuscritos escaneados em lote.
- [x] **TASK-17:** Banco de Questões Adaptadas Individuais e Montador de Provas Ajustáveis com Vinculação PEI (RN-42).
- [x] **TASK-18:** Sincronização Meu Horário Escolar ↔ Calendário Pedagógico (RN-51).
- [x] **TASK-19:** Evolução Longitudinal e Diagnóstico de Competências ENEM (RN-52).
- [x] **TASK-20:** Leitor Imersivo Acessível com TTS e Limpeza Fonética no Portal do Aluno (RN-53).
- [x] **TASK-21:** Chamada Rápida e Controle de Infrequência Escolar - LDB Art. 24 (RN-54).
- [x] **TASK-22:** Telemetria Local de Consumo de IA e Estimativa de Tokens (RN-55).

---

## 🎯 Próximas Entregas (Backlog)
- [x] **TASK-23:** Tela Visual da Aba de Frequência Escolar & Chamada no Diário Pedagógico com Alerta LDB (RN-54 & RN-56 / UT-30).
- [x] **TASK-24:** Ficha Individual do Aluno 360º para Reunião de Pais e Conselho de Classe em PDF (RN-57 / UT-31).
- [x] **TASK-25:** Diário de Bordo e Registro Rápido de Ocorrências Pedagógicas da Turma (RN-58 / UT-32).
- [x] **TASK-26:** Publicação Online de Atividades Adaptadas no Portal do Aluno com Leitor Imersivo Acessível TTS e Dicas DUA (RN-59 / UT-33).
- [x] **TASK-27:** Importação Direta de Atividades Cadastradas da Turma no Gerador Adaptado DUA (RN-60 / UT-34).
- [x] **TASK-28:** Filtro Inclusivo de Estudantes com CID/Necessidades no Modal do Diário (RN-61 / UT-35).
- [x] **TASK-29:** Sigilo de Dados Médicos (LGPD/LBI) — Ocultação de CID no Portal e Toggle em Relatórios para Família vs Conselho (RN-62 / UT-36).







### RN-69 — Correções do Gerador (24/10/2026)
- [x] Acesso/entrega/Portal protegidos, dados mínimos, sessão privada e links por vínculo.
- [x] Editor confirmado, prazo preservado, escala/gabarito/imagens e recuperação de extração.
- [x] Persistência compartilhada com Diário, contexto, correção/sincronização explícitas, avisos de similaridade sem punição e arquivamento preservando feedback.
- [x] Suíte 690/690, emulador 5/5, build e lint verificados. Guia e evidências registrados.
- [ ] Publicar aplicativo e regras Firestore juntos quando solicitado; nenhum deploy ou commit/push executado nesta etapa.

## 27/10/2026 — RN-73 Redação Corrigida
- [x] Contratos de notas completas, parciais e anulação; rubrica interna rastreável, BYOK escolhido.
- [x] ID próprio por redação, versões, gravação transacional/idempotente, rascunhos privados e repetição de salvamento sem IA.
- [x] Remoção de migração/exclusão lateral; associação legada revisável com backup; arquivo reversível e vínculos preservados.
- [x] Autorização discente vigente e projeção; histórico publicado no Portal e falha explícita por seção de redações.
- [x] Correção/revisão manual, publicação confirmada, filtros/métricas/evolução e relatórios coerentes.
- [x] PDF misto por página, referência visual consistente e extração sem descarte da imagem.
- [x] Suíte completa: 805 testes em 167 arquivos, sem alterar testes preexistentes.
- [ ] Publicação desta versão (commit/push/deploy ainda não realizados nesta tarefa).
- [ ] Homologação pedagógica integral da cartilha 2026: download oficial indisponível durante conferência; sem alegação de certificação oficial.

## 27/10/2026 — RN-74 Meu Horário Escolar
- [x] Retirar interface/acionamento do Gerador Mágico, sem substituto.
- [x] Confirmar cadastro manual, importação e configuração preservados.
- [x] 806 testes/168 arquivos aprovados; build e lint do escopo aprovados.
- [ ] Demais propostas da auditoria aguardam autorização para implementação.

## 27/10/2026 — RN-75 Portal do Aluno (P1)
- [x] Especificar RN-75, contrato de `falhas` por seção e UT-44..UT-49 antes da implementação.
- [x] Domínio: interpretação de data de entrega e normalização de tipo objetivo.
- [x] Portal: comprovante, devolutiva de múltipla escolha, nota não lançada e instrução de acesso.
- [x] Boletim: falhas por seção com nova tentativa, preservando dados já lidos.
- [x] Suíte completa: 828 testes/174 arquivos (806 preservados + 22 novos); build exit 0; lint sem novos problemas; nenhum teste preexistente alterado.
- [ ] Homologação visual em celular/computador e leitor de tela continuam pendentes.

## 27/10/2026 — RN-76 Meu Horário Escolar (P0)
- [x] Especificar RN-76 e UT-50..UT-55 antes da implementação.
- [x] Cache local por conta; chave base apenas como índice sem aulas para conta autenticada.
- [x] `salvarGrade`/`carregarGrade` informam `persistencia` (`nuvem`, `local`, `pendente`, `falha`) sem esconder erro.
- [x] Estado inicial sem grade de demonstração e `somenteReal` estrito preservado para Calendário e Diário.
- [x] Rascunho legado detectado e migrado só com confirmação explícita; descarte sem apagar a conta.
- [x] Interface com rótulo de sincronização, nova tentativa e bloqueio de edição ao trocar de conta.
- [x] Suíte completa: 851 testes/177 arquivos (828 preservados + 23 novos); build exit 0; lint sem problemas.
- [ ] Homologação visual em celular/computador e leitor de tela continuam pendentes.
- [ ] Fila transacional/revisão de salvamento (P1 da auditoria) permanece proposta.
\n
## 27/10/2026 — Analytics e correções de preservação
- [x] RN-79: fonte autenticada, dataset comum, critérios, cobertura, filtros e visões semestrais/anuais.
- [x] RN-79: radar/pendências, acesso contextual ao Diário, prévia e PDF integral paginado.
- [x] RN-80: resultados atrasados por conta, rascunho pendente, preservação do legado e conflito revisável.
- [x] RN-80: Portal conserva seções válidas, sinaliza tokens e ignora pedidos antigos; avisos legados visíveis.
- [x] Verificação final: 902 testes/198 arquivos, lint sem alertas e build de produção aprovados. Publicação autorizada após validação.

## 27/10/2026 — Recuperação semestral (RN-81)
- [x] Terceira revisão de `67c6a1b`: concorrência/reservas corrigidas e 1.002 testes/build aprovados; corrigir liberação prematura de parcela de conjunto incompleto. Reproduções `recuperacao_rascunho_entrega.test.js` e `recuperacao_montagem_liberacao.test.js`; relatório/prompt de 28/10 em `docs/analises/2026-10-28-terceira-revisao-recuperacao-semestral.md`. Publicação retida para nova revisão independente.
- [x] Segunda revisão de `51abb4f` (28/10): corrigir quatro reproduções em `recuperacao_concorrencia_revisao.test.js`; relatório e prompt em `docs/analises/2026-10-28-segunda-revisao-recuperacao-semestral.md`. Os 984 testes recebidos, lint e build passam; publicação continua retida pelas falhas adicionais.
- [x] Corrigir os quatro P1 da segunda revisão: criação/edição de parcela em `runTransaction` com orçamento/versão autoritativos, congelamento `congelado` compartilhado com a transação de entrega, recusa de destinatários/contexto após entrega e cancelamento idempotente que só remove reservas do próprio conjunto.
- [x] Novos testes concorrentes sem alterar os existentes: `recuperacao_congelamento_ordem.test.js` (4), `recuperacao_locks_contexto.test.js` (6) e `recuperacao_congelamento_entrega.test.js` (4); os quatro `REV2-R81-01..04` passam sem edição.
- [x] Corrigir achados de `docs/analises/2026-10-27-revisao-recuperacao-semestral.md`: ano derivado/legado, snapshot integral da prévia, concorrência por locks e versão, composição congelada após entregas, histórico cumulativo, validação de destinatários/escala, abertura da correção e estado limpo na troca de conta.
- [x] Integrar atividade adaptada como parcela do conjunto (conjunto/semestre/ano/pontos) e usar rótulo de semestre no Portal, nas devolutivas e no PDF.
- [x] Novos testes sem alterar os existentes: `recuperacao_semestral_correcoes.test.js` (7), `recuperacao_adaptada_periodo.test.js` (5) e `recuperacao_conjuntos_seguros.test.js` (5). Os 7 testes da revisão passam sem edição.
- [x] Revisão técnica independente de `75f5dd6`: bloqueios reproduzidos corrigidos, 1.018 testes/219 arquivos, lint e build aprovados. Relatório final de 28/10 registrado; homologação real permanece separada.
- [x] Confirmar regra: uma ou várias atividades, soma total de 0 a 10; sem média automática.
- [x] Especificar isolamento, lançamento revisável em rec1/rec2 e preservação da fórmula 25/25/50.
- [x] Preparar plano e prompt delimitado para DeepSeek/OpenCode em `docs/plans/2026-10-27-recuperacao-semestral.md`.
- [x] Implementar domínio, criação/entrega/correção, lançamento versionado e backup com testes novos; cobertura parcial de R81-01..08.
- [ ] Homologar visualmente 390/1440 px, teclado/foco/leitor de tela e exportação real de PDF individual.
- [x] Publicação do código no Git: `75f5dd6` já estava em `origin/master` ao iniciar a revisão final. Deploy e homologação funcional ainda não confirmados; não marcar todos os aceites como concluídos.
- Evidência de 27/10/2026 (correções): **984 testes em 211 arquivos** aprovados; lint dos arquivos alterados sem erros (permanecem 2 avisos preexistentes de `<img>` em `AtividadeForm.jsx`); build de produção exit 0 com `NODE_USE_SYSTEM_CA=1`. Nenhuma fonte Google ou configuração de build foi alterada. Riscos residuais: locks legados sem atomicidade total, composição em `firebase-atividades` por re-leitura de versão (sem `runTransaction` por limitação do mock existente) e entregas antigas sem contexto tratadas como legado.
- Evidência de 28/10/2026 (segunda revisão): **1002 testes em 215 arquivos** aprovados; lint dos arquivos alterados com exit 0; build de produção exit 0 com `NODE_USE_SYSTEM_CA=1`. O caminho de recuperação agora usa `runTransaction`; o caminho regular permanece em lote. Riscos residuais: entregas anteriores ao marcador `congelado` dependem da consulta legada durante a janela de implantação; concorrência em Firestore real, homologação visual/teclado/leitor de tela, PDF real e publicação no Portal continuam pendentes. Nada foi publicado.
- Evidência de 28/10/2026 (terceira revisão): **1018 testes em 219 arquivos** aprovados; lint do escopo de produção sem erros; build de produção exit 0 com `NODE_USE_SYSTEM_CA=1`. Parcelas permanecem em `rascunho` até o conjunto fechar exatamente 10; a transação que fecha libera as irmãs; entrega, leitura e boletim usam o mesmo contrato. Legado sem `escalas` mantém o comportamento anterior. Riscos residuais: concorrência em Firestore real, homologação visual/teclado/leitor de tela, PDF real e publicação no Portal continuam pendentes. Nada foi publicado.

## Homologação real — 28/10/2026

Deploy Vercel e fluxo real com dados sintéticos confirmados: montagem 4+6, entrega, correção manual 3+5=8, lançamento rec1, publicação parcial e feedback no Portal/PDF. S1 20→32, S2=25, anual 45→57; repetição idempotente (revisão 4→4), aluno pendente e turma de controle preservados. Dados temporários removidos. Portal conferido em 390/1440 px e foco por Tab; leitor de tela, IA real, estresse concorrente e Analytics manual não verificados.

Homologação PDF/visual parcial: classificação bimestral divergente no boletim, sobreposição da turma na ficha, 100% de frequência sem registros, prazo ISO não interpretado no cartão e ações cortadas no professor em 390 px. Correções ainda pendentes; não marcar todos os aceites concluídos. Relatório, evidências e prompt DeepSeek: `docs/analises/2026-10-28-homologacao-real-recuperacao-semestral.md`. Nenhum código/teste alterado nesta rodada; 1.018 testes/lint/build referem-se à revisão técnica anterior.

## 28/10/2026 — Copiar recuperação para outra turma (RN-82)
- [x] Definir cópia individual revisável, isolamento e aceites R82-01..07; preparar plano/prompt DeepSeek.
- [ ] DeepSeek: implementar projeção de conteúdo, escolha de destino e criação independente com testes novos RED→GREEN.
- [ ] Revisão independente de contexto, tokens, persistência/concorrência; suíte/lint/build e homologação visual antes de publicação.
- [ ] Não misturar com os cinco ajustes de PDF/apresentação da homologação RN-81, que continuam pendentes.
Plano: `docs/plans/2026-10-28-copiar-recuperacao-outra-turma.md`. Nenhum código/teste alterado nesta especificação.

### Revisão independente RN-82 — 28/10/2026
- [x] Conferir entrega local do DeepSeek: 1.045 testes/223 arquivos recebidos, lint e build aprovados.
- [ ] Corrigir REV-R82-01..03 reproduzidos no novo `CopiarRecuperacaoRevisao.test.jsx` (3 falhas): versão/contexto conferidos ignorados, retry bloqueado após consumo do saldo e revisão impedida quando origem excede saldo ajustável.
- [ ] Atualizar guia e executar homologação visual sintética 390/1440 após correções.
Relatório e prompt: `docs/analises/2026-10-28-revisao-copia-recuperacao.md`. Código não aprovado para publicação; nenhum código/teste recebido alterado nesta revisão.
