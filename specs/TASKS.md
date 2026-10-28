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
- [x] Confirmar regra: uma ou várias atividades, soma total de 0 a 10; sem média automática.
- [x] Especificar isolamento, lançamento revisável em rec1/rec2 e preservação da fórmula 25/25/50.
- [x] Preparar plano e prompt delimitado para DeepSeek/OpenCode em `docs/plans/2026-10-27-recuperacao-semestral.md`.
- [x] Implementar domínio, criação/entrega/correção, lançamento versionado e backup com testes novos; cobertura parcial de R81-01..08.
- [ ] Revisar independentemente autorização, versão concorrente, dados legados e notas antes de liberar.
- [ ] Homologar visualmente 390/1440 px, teclado/foco/leitor de tela e exportação real de PDF individual.
- [ ] Publicar a implementação aprovada e marcar a funcionalidade como concluída.
- Evidência de 27/10/2026: **960 testes em 206 arquivos** aprovados, incluindo 58 novos da RN-81; lint do escopo sem erros (permanecem 2 avisos preexistentes de `<img>` em `AtividadeForm.jsx`); build de produção exit 0 com `NODE_USE_SYSTEM_CA=1`. Nenhum dado real foi gravado e a publicação funcional continua pendente de revisão independente.
