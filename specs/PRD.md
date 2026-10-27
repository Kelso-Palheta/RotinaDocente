# 📄 Product Requirements Document (PRD) — Rotina Docente

## 1. Visão Geral do Produto
O **Rotina Docente** (*Toda a sua rotina letiva em 1 clique*) é o ecossistema de gestão e automação pedagógica desenhado para eliminar a sobrecarga operacional dos professores da Educação Básica e Ensino Médio, devolvendo até 15 horas de trabalho semanal e finais de semana livres.

---

## 2. Personas Principais
1. **Professor da Educação Básica / Ensino Médio:**
   - *Necessidade:* Lançar notas rapidamente, corrigir redações com critérios justos do ENEM, montar horários semanais e gerar simulados e atividades no padrão BNCC.
2. **Coordenador Pedagógico / Diretor:**
   - *Necessidade:* Padronização de critérios avaliativos e relatórios de acompanhamento de turmas.
3. **Aluno:**
   - *Necessidade:* Acesso transparente às suas notas publicadas e feedback detalhado das redações corrigidas via portal próprio.

---

## 3. Módulos do Sistema
1. **Diário Pedagógico (Gestão de Notas):**
   - Lançamento de notas por turma e bimestre (1º ao 4º).
   - Cálculo automático de médias ponderadas (Simulados + Atividades).
   - Publicação instantânea para o Portal do Aluno.
   - Configuração de necessidades/deficiências (PCD) por aluno no cadastro e na tabela de notas, com badges de identificação rápida (RN-43).
   - Backup e restauração local/Firestore.
2. **Redação Corrigida ENEM:**
   - Extração de texto via OCR de fotos ou documentos (PDF, DOCX, TXT).
   - Avaliação detalhada nas 5 competências do ENEM (0 a 200 pts cada).
   - Geração de devolutiva pedagógica e exportação em PDF formatado.
3. **Calendário Pedagógico:**
   - Configuração de grade horária semanal por turma e período letivo.
   - Integração com Meu Horário Escolar: carregar os horários cadastrados da turma, apresentar prévia e atualizar o calendário preservando conteúdos e aulas realizadas; manter vários horários no mesmo dia e permitir correspondência manual entre turmas quando necessário.
   - Importação de planos por arquivo ou texto com IA configurada pelo professor, revisão editável e escolha de adicionar ou substituir conteúdos pendentes.
   - Distribuição automática de planejamento em 1 clique (Auto-Schedule) com data inicial configurável.
   - Drag and Drop de tópicos para aulas com remanejamento automático.
   - Decisão interativa ao mudar status: Smart Shift (empurrar em cascata) ou Pular Conteúdo.
   - Monitoramento por conteúdos únicos (% concluído, agendado e pendente), biblioteca pesquisável e edição dos conteúdos vinculados.
   - Áreas Calendário, Conteúdos e Configurações; filtros de turma/ano/período; lista por data em telas estreitas.
   - Prévia antes de alterar horários, distribuir, remanejar ou limpar; proteção do histórico, pendências sem vaga e cadastro de reposição.
   - Registro de justificativa/restante, intervalos de recesso e PDF completo paginado.
4. **Gerador de Atividades & Questões:**
   - Criação de listas de exercícios e provas alinhadas à BNCC e descritores do SAEB/ENEM.
5. **Portal do Aluno:**
   - Consulta de notas bimestrais e pareceres pedagógicos com autenticação segura.
   - Indisponibilidade de uma seção é informada e repetível; nunca confundida com ausência de notas.
   - Nota não lançada é distinguida de zero lançado, com a fórmula e a aprovação vigentes preservadas.
   - Devolutiva objetiva e de múltipla escolha mostram resposta marcada e acerto; comprovante usa a data real da entrega.
6. **Agentes Pedagógicos (MVP):**
   - **Agente Ensino Médio:** Assistente conversacional especializado em ENEM, vestibulares, competências C1–C5 de redação e habilidades BNCC do Ensino Médio (`EM13...`). Atende professores do 1º ao 3º EM.
   - **Agente Fundamental II:** Assistente conversacional especializado em descritores SAEB, habilidades BNCC do Ensino Fundamental II (`EF06...` a `EF09...`) e avaliações diagnósticas estaduais. Atende professores do 6º ao 9º ano.
7. **Dashboard Analytics Pedagógico:**
   - Visualização integrada de indicadores de desempenho individual e por turma.
   - Gráficos de evolução bimestral, taxas de aprovação/recuperação e histograma de faixas de notas.
   - Painel de alerta preventivo para identificação precoce de estudantes em risco de retenção.
8. **Conexão de Inteligência Artificial & BYOK (Bring Your Own Key):**
   - Conexão e gerenciamento direto da chave de API do professor.
   - Suporte multi-provedor: Google Gemini, OpenAI, Anthropic, Maritaca AI e OpenRouter.
   - Autonomia total do professor no controle de custos e créditos em seu provedor preferido.
   - Validador em tempo real de latência e saldo da chave antes do salvamento.
   - Bloqueio estrito de requisições de IA quando não houver chave pessoal configurada.
9. **Atividades Adaptadas & Educação Inclusiva (DUA/PEI):**
   - Diferenciação pedagógica de atividades alinhadas ao Desenho Universal para a Aprendizagem (DUA) e LBI (Lei 13.146/2015).
   - Suporte a seleção multi-select de deficiências e neurodiversidades (TEA, DI, TDAH, Baixa Visão, Cegueira, Surdez, Motora, Dislexia, Discalculia, AH/SD, Epilepsia, Ansiedade, TOC, Transtornos de Conduta, Outras Condições).
   - Motor de harmonização não-conflitante para estudantes com múltiplas deficiências.
   - Banco de perfis de estudantes (PEI / PDI rápido) para reuso contínuo.
   - Bimodalidade de entrega: integração no módulo digital de atividades e módulo independente com exportação em PDF de alta acessibilidade para impressão.
   - Geração de Guia de Mediação Pedagógica para o professor regente e mediador do AEE.
   - Banco de Questões Adaptadas Individuais: armazenamento de itens atômicos com filtros por necessidade DUA, disciplina, ano escolar e tipo de questão.
   - Montador de Provas e Avaliações Ajustáveis: seleção de questões do banco, reordenação flexível, personalização de enunciados e vinculação direta a estudantes PEI.

---

### Correção de atividades e devolutivas (RN-65)
- Professor escolhe IA ou correção manual, com nota e comentário por questão; manual independe de chave de IA.
- Aluno consulta feedback no Portal e boletim PDF. Ficha 360º inclui o mesmo histórico pedagógico, restrito ao aluno/turma/professor.

## 4. Critérios de Sucesso e Métricas
- **Tempo de Correção de Redação:** < 20 segundos por texto.
- **Precisão de Cálculo de Médias:** 100% de exatidão aritmética conforme os critérios configurados pelo professor.
- **Disponibilidade Offline:** Tolerância a falhas de rede com sincronização local via `localStorage`.

### Aprovação por semestre (RN-67)
- Aluno com 25 pontos no primeiro semestre vê “Aprovado” nessa etapa, mesmo sem notas do segundo semestre; o ano permanece “Em andamento”. A mesma regra vale para o segundo semestre.
- Mapa, Portal e relatórios mostram situações independentes de S1, S2 e ano, com metas 25/25/50. Não altera notas lançadas, pesos ou recuperação.

### Diário Pedagógico — melhorias da auditoria (RN-68)
Implementar as recomendações da análise de 23/10/2026 no próprio Diário: persistência confiável com conflitos explícitos, critérios preservados/validados, frequência conectada ao calendário, backup revisável, ocorrências autorizadas na Ficha, ações e nomes claros, lançamento com teclado e colagem revisável, busca/filtros, publicação por período com prévia/resultados, visão geral, fechamento, linha do tempo, histórico/desfazer e organização por ano/arquivamento/promoção. Preservar notas e contratos legados compatíveis; não publicar nem enviar mensagens automaticamente.


### Correções do Gerador — RN-69
Aceite: impedir acesso/entrega por identidade não autorizada e vazamento de cadastros; manter entregas anteriores; remover penalidade automática; confirmar salvamento; corrigir fuso, gabarito, imagens e rubricas; preservar dados em falhas; usar persistência segura compartilhada; informar contexto, erros, arquivamento e estado de sincronização/publicação. Novas funcionalidades independentes propostas na auditoria não integram esta correção.


### Correção de falso conflito após publicação — RN-70
Publicar notas e registrar o resultado deve funcionar após serialização/releitura dos mapas do banco, mantendo proteção contra alterações reais em outra aba. Permitir repetir com segurança um conflito antigo causado apenas por ordem de chaves, preservando rascunhos e registros já publicados.


### Cabeçalho compacto do Diário — RN-71
Reduzir altura do cabeçalho da turma para liberar espaço à tabela de notas. Organizar título/abas e indicadores/ações em duas faixas flexíveis, mantendo leitura e acesso aos controles no desktop e celular.

## Imagens adaptadas com revisão — RN-72

Permitir criar, manter ou editar figuras a partir de referência preservada, com plano visual por questão, desenhos exatos por dados, validação técnica e revisão docente. Salvar a versão atual com histórico e garantir a mesma figura no banco, prova, impressão e Portal. Impedir distribuição de figuras obrigatórias pendentes e informar falhas sem reduzir silenciosamente a qualidade ou trocar provedor.

## RN-73 — Redação segura, revisável e com histórico
- Cada redação tem ID único, alunoId/turmaId/anoLetivo separados do login; salvar nova redação nunca substitui outra. Registros legados permanecem legíveis, sem migração/apagamento no carregamento.
- Abrir o módulo não grava turmas. Usar persistência compartilhada isolada por conta; não sobrescrever Diário por timestamp de cache.
- Consulta discente exige sessão, vínculo vigente e propriedade da redação, publicação e ausência de arquivamento. Projeção pública exclui campos internos; legado exige loginKey/login equivalente, nunca apenas professor.
- Correção usa BYOK/provedor escolhido (substitui exclusividade antiga da RN-06); Gemini chama Google. Avaliação completa valida cinco competências 0/40/80/120/160/200, soma estrita; parcial não inventa zeros nem total de 1000. Anulação explícita persiste motivo e zeros. JSON incompleto não é resultado válido.
- Correção IA e manual seguem revisão docente; rascunho, corrigido/revisado, publicado e arquivado têm estados explícitos. Revisões registram autor/data e versão anterior. Publicar exige confirmação; legado publicado mantém compatibilidade segura.
- Texto original, tema, motivadores, fonte, contexto e resultado permanecem em rascunho por conta; erro de salvamento permite repetir sem consumir IA. Falha de identificação encerra processamento. Requisições antigas não afetam outro contexto.
- Extração PDF é por página: preservar texto digital e transcrever páginas escaneadas, com limite e revisão. Correção direta não descarta imagem. Seleção de arquivo informa limites e progresso.
- Arquivar/restaurar não apaga vínculos de notas/atividades. Importação/migração legada é explícita, com backup/prévia, sem destruição ou associação automática por nome.
- Histórico e métricas usam os mesmos filtros de turma/ano/bimestre/aluno. Falha visível com repetição. Feedback e PDF usam contrato de notas/versão/data coerente. Evolução normaliza scoreData/totalScore, excluindo avaliações parciais ou inválidas.

## RN-74 — Simplificar Meu Horário Escolar
- Remover botão, modal e acionamento do Gerador Mágico do Meu Horário Escolar, por decisão do usuário. Não substituir por outro gerador.
- Preservar cadastro/edição manual, horários e intervalos personalizados, importação PDF/JSON, backup, impressão e integração com o Calendário. Horário Inteligente é módulo distinto e não integra esta remoção.
- Demais achados da auditoria de Meu Horário Escolar permanecem propostas, sem implementação automática.

## RN-76 — Meu Horário Escolar: conta isolada e salvamento verificável
- O cache local é isolado por conta; conta autenticada nunca lê a grade de outra conta, e a chave base não guarda aulas de conta autenticada.
- Rascunho legado é apenas detectado e só migra com confirmação explícita; descartar não apaga a grade da conta.
- Salvar informa onde gravou (`nuvem`, `local`, `pendente`, `falha`); falha não é anunciada como sincronizada e oferece nova tentativa.
- Conta nova começa vazia, sem grade de demonstração; a leitura estrita usada por Calendário e Diário permanece inalterada.
- Ao trocar de conta, a grade anterior não permanece editável durante o carregamento.
