# Revisão temática Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensinar conteúdos completos antes do desafio, disponibilizando exclusivamente questões compatíveis com as aulas selecionadas.

**Architecture:** Acervo privado versionado de aulas/vínculos; domínio valida contexto e servidor congela seleção/conteúdo/prazos em salas v2. Componentes controlados consomem DTOs privados autorizados e preservam salas legadas.

**Tech Stack:** Next.js 16/React, Firebase Admin/Firestore/SSE e Vitest existentes; sem dependências ou serviço novo.

---

Design aprovado: `2026-11-05-revisao-tematica-design.md`. Contrato obrigatório: `specs/REVISAO_TEMATICA_SPEC.md`. Reutilizar checkout atual conforme preferência do usuário; entregas externas sem commit/push, integração/publicação centralizadas. Os dois pacotes externos podem avançar em paralelo, com fixtures sintéticas de UI e contrato fixo; nenhum arquivo de responsabilidade compartilhada deve ser editado por ambos.

## Task 1 — Acervo, classificação e aulas (DeepSeek)

**Criar:** `content/revisao-enem/aulas/{catalogo.json,vinculos.json,conteudos/*.json,imagens/*}`, `tests/contract/revisao_tematico_acervo.test.js`, `docs/analises/2026-11-05-revisao-tematica-acervo.md`.

1. Ler os 197 JSONs existentes (tema, enunciado, alternativas, gabarito e fontes), sem editá-los; mapear aulas específicas e lacunas.
2. Criar teste novo falho de integridade de IDs, mapa completo, objetivos, estrutura pedagógica, recursos e fontes antes dos dados.
3. Executar `cd frontend && npx vitest run ../tests/contract/revisao_tematico_acervo.test.js --maxWorkers=1`, registrar RED por ausência do novo acervo.
4. Criar catálogo e mapa; justificar semanticamente cada vínculo. Distinguir trilha de conteúdo. Marcar pendentes/fora de escopo sem forçar vínculos.
5. Pesquisar fontes primárias reais e redigir aulas originais completas por conteúdo, em lotes se necessário; manter todas em rascunho.
6. Conferir que cada objetivo vinculado é ensinado, imagens são legíveis e a introdução não revela respostas. Revisão manual registrada, não simulada por teste de comprimento.
7. Repetir teste novo e regressões antigas do acervo, sem alterá-las. Relatar cobertura, fontes, exceções e exemplos que precisam revisão docente.
8. Entregar arquivos/relatório sem commit/push. Prompt integral: `2026-11-05-prompt-deepseek-revisao-tematica.md`.

## Task 2 — Preparação e apresentação (Antigravity)

**Criar:** `frontend/src/components/revisao/{PrepararAulaoTematico,ConferirConteudoTematico,BlocoAulaTematica}.jsx` e testes novos em `tests/unit/components/revisao/Tematico*.test.jsx`.
**Modificar somente quando necessário:** `PainelProfessor.jsx`, `TelaProjecao.jsx`, `PainelAluno.jsx` na mesma pasta, com comportamento opcional baseado em `estado.aula`. Não alterar controladores, domínio ou transporte neste pacote.

1. Escrever novos testes falhos usando aulas/questões sintéticas: sem conteúdo não há questões; Surrealismo não oferece Cubismo; múltiplas aulas deduplicam.
2. Rodar `cd frontend && npx vitest run ../tests/unit/components/revisao/TematicoPreparacao.test.jsx --maxWorkers=1`, observar RED.
3. Implementar preparação controlada com trilha/aula específica, contador contextual, quantidade exata, revisão obrigatória, tempos e reordenação.
4. Cobrir troca de contexto removendo somente incompatíveis com aviso; filtros secundários preservam compatíveis. Itens fora do contexto nunca ficam selecionados invisivelmente. Quantidade insuficiente não mistura conteúdos.
5. Testar e implementar conferência controlada de aula com objetivos, blocos, fontes, imagens e três confirmações explícitas; sem gravação/IA.
6. Testar e implementar bloco temático sincronizado, avanço/retorno docente e abertura do desafio apenas ao final; aluno sem controle docente, sem resposta antecipada.
7. Repetir testes de UI anteriores intactos, contrato global de paleta e lint; verificar 360/1440/1920px e movimento reduzido.
8. Entregar diff/relatório sem commit/push. Prompt integral: `2026-11-05-prompt-antigravity-revisao-tematica.md`.

## Task 3 — Infraestrutura privada e domínio (ChatGPT, após contratos entregues)

**Criar:** `frontend/src/infraestrutura/revisao/acervoTematicoServidor.js`, `frontend/src/dominio/revisao/tematico.js`, testes novos `tests/{contract/revisao_tematico_servidor,integration/revisao_tematico_servico,unit/revisao_tematico}.test.js`.
**Modificar:** `RevisaoService.js`, `sala.js`, `httpServidor.js`, `runtimeServidor.js` exclusivamente nas pastas de revisão.

1. Confirmar os arquivos recebidos e testes existentes inalterados; revisão semântica da classificação antes de integrar.
2. Testar RED: aulas e vínculos desconhecidos, contexto adulterado, rascunho, hash antigo, quantidade incoerente e tempo inválido devem ser recusados.
3. Implementar leitura segura (JSON/imagens/mapeamento) com hash de integridade e metadata sem conteúdo privado no bundle cliente; novos endpoints sob autenticação existente.
4. Testar e implementar aprovação docente por UID/versão e criação transacional v2 com pacote congelado, protegendo limites Firestore antes da escrita.
5. Testar RED fluxo completo de introdução, estados sem futuras perguntas, CAS de blocos, retomada, prazos individuais e compatibilidade com salas antigas.
6. Implementar transições v2 e imagens somente do bloco autorizado; manter respostas/recibos/pontos e vínculos atuais intactos.
7. Executar testes dirigidos e regressões v1. Sem mudar tests existentes nem ampliar quotas/planos.

## Task 4 — Controladores e aceite integrado (ChatGPT)

**Modificar:** `IntegracaoPreparacao.jsx`, `IntegracaoDocente.jsx`, `IntegracaoAluno.jsx` e outros controladores de revisão somente se necessário; guia `docs/guias/revisao-ao-vivo.md`.
**Criar:** regressões novas de integração/controlador e relatório final.

1. Testes RED das rotas/controladores: escolher conteúdo carrega aula, muda contexto, revalida seleção e envia o DTO especificado; respostas atrasadas não substituem outro tema/conta.
2. Conectar componentes sem duplicar autoridade de domínio; backend rejeita manipulação mesmo que frontend seja burlado.
3. Fluxo sintético completo: docente confere aula e questões → seleciona tema/quantidade/tempo → aluno entra → todos veem sequência de conteúdo → questões somente no final → respostas, feedback A–E e ranking.
4. Revisão independente por domínio, erros/reconexão, segurança e qualidade do conteúdo. Nenhuma afirmação de revisão humana ou completude baseada apenas em testes verdes.
5. Executar suíte comum completa com `NODE_OPTIONS=--experimental-require-module`; cenários Firestore/SSE serialmente em emulador local; lint, build e `node scripts/verificar-bundle-revisao.mjs`.
6. Atualizar guia com comportamento real e ressalvas. Commit/push automático apenas após validação e preservação de arquivos alheios; conferir SHA/Ready e API privada no deploy.

## Portões

- Pacotes externos delimitados não autorizam editar arquivos exclusivos do outro agente ou publicar.
- Não publicar pacote parcial como funcionalidade concluída. Enquanto aulas/mapeamento/UI não chegam, a versão publicada atual continua intacta.
- Expansão de quantidade acima de 20 questões, capacidade acima de cem alunos, intercalar questões, personalização autoral de aulas e geração de conteúdo durante sessão ficam fora deste incremento.
