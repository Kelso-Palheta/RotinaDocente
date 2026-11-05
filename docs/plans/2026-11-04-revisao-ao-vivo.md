# Revisão ao Vivo — plano de implementação

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Entregar revisão de Arte/ENEM ao vivo com conteúdo, respostas seguras, projeção e feedback A–E, preservando o produto atual.

**Architecture:** Módulo independente com domínio puro, casos de uso e adaptadores autorizados no servidor. Interface controlada e acervo privado são entregas paralelas; transporte e armazenamento operacional só são escolhidos após ensaio de viabilidade.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, Firebase 12.15.0/Admin 14.4.0, Vitest 4.1.11, Tailwind 4; versões efetivas em frontend/package.json. Nenhuma nova dependência autorizada pelos pacotes externos.

## 1. Congelar contrato — ChatGPT

Arquivos: `specs/REVISAO_AO_VIVO_SPEC.md`, este plano, desenho e dois prompts adjacentes. Validar cobertura dos requisitos, paths exclusivos e contrato visual. Registrar decisões pendentes de transporte e pontuação sem transformá-las em funcionalidade concluída.

## 2. Acervo — DeepSeek

Arquivos: `content/revisao-enem/README.md`, `fontes.json`, `questoes/*.json`, `imagens/*`; `docs/analises/2026-11-04-acervo-arte-enem.md`; teste novo `tests/contract/revisao_acervo.test.js`.

1. Ler contrato e mapear 17 anos × 3 modalidades, justificando casos sem aplicação própria.
2. Escrever teste novo para formato, fontes, IDs, alternativas, caminhos de imagem e bloqueio de rascunhos. Usar fixtures sintéticas no próprio teste; não duplicar o banco real.
3. Executar `cd frontend && npx vitest run ../tests/contract/revisao_acervo.test.js` e registrar RED.
4. Catalogar primeiro lote real integralmente conferível; registrar ausências e continuar recorte completo. Não marcar como revisado texto/figura/feedback que não foi conferido.
5. Executar teste novamente (GREEN), conferir imagens e entregar relatório com contagem real e pendências. Não fazer commit.

## 3. Interfaces controladas — Antigravity

Arquivos: `frontend/src/components/revisao/PainelProfessor.jsx`, `TelaProjecao.jsx`, `PainelAluno.jsx` e auxiliares somente na mesma pasta; `tests/unit/components/revisao/RevisaoFluxo.test.jsx`, `RevisaoAluno.test.jsx`, `RevisaoProjecao.test.jsx`; `docs/analises/2026-11-04-revisao-ao-vivo-ui.md`.

1. Ler contrato; criar testes de transições visuais, ausência de gabarito antecipado, confirmação/retry e desconexão.
2. Executar `cd frontend && npx vitest run ../tests/unit/components/revisao` e registrar RED por ausência de componentes.
3. Implementar componentes mínimos com os exports/props exatos. Não criar API, hook de transporte nem página pública.
4. Reexecutar testes (GREEN); `npx eslint src/components/revisao`; conferir teclado, timer e limpeza de efeitos.
5. Evidenciar 360/1440/1920px com dados sintéticos. Se navegador de teste não estiver disponível, declarar limitação. Não alegar teste visual apenas pelo jsdom. Não fazer commit.

## 4. Ensaio técnico — ChatGPT

Antes de criar rotas de produção: verificar plano e suporte efetivo de transporte, estado externo, proteção de identidade e custos. Comparar opção realtime com infraestrutura atual e eventual alternativa sem contratação. Registrar decisão em `docs/analises/2026-11-04-revisao-ao-vivo-infra.md`, incluindo dependências/variáveis necessárias e bloqueios reais. Não usar credenciais em logs; não fazer teste de carga na produção.

Se nenhuma opção suportar os requisitos no plano autorizado, apresentar alternativa concreta e custo/configuração necessários; não publicar simulação como aula ao vivo. Ensaios não autorizam novas cobranças.

## 5. Domínio e casos de uso — ChatGPT

Arquivos previstos: `frontend/src/dominio/revisao/{sala,respostas,projecoes}.js`; `frontend/src/aplicacao/revisao/{RevisaoService,ports}.js`; novos testes `tests/unit/revisao_{sala,respostas,projecoes}.test.js` e `tests/integration/revisao_service.test.js`.

Para cada arquivo: escrever o teste RV correspondente, executar direcionado e registrar RED; implementar mínimo puro/injetável; repetir GREEN. Casos: transição ilegal, prazo exato, idempotência, duplicação concorrente, comando de rodada antiga, empate e DTO sem gabarito. A regra de pontuação deve ser confirmada antes do código correspondente.

## 6. Infra e rotas — ChatGPT

Paths reservados: `frontend/src/infraestrutura/revisao/`, `frontend/src/app/api/revisao/`, `frontend/src/hooks/revisao/`; testes novos `tests/contract/revisao_api.test.js` e `tests/integration/revisao_concorrencia.test.js`. Nomes finais dos adaptadores/rotas serão congelados no relatório do ensaio, antes do código.

Criar testes RED de sessão inválida, vínculo revogado, professor alheio, origem inválida, caminho adulterado, payload extra e vazamento. Implementar adaptadores conforme decisão técnica, testar transação concorrente em emulador/ambiente isolado; testes com repositório em memória não comprovam transações de banco real.

## 7. Integração e validação — ChatGPT

Paths reservados: `frontend/src/app/revisao/`, integração do Portal e catálogo do Hub somente após revisão das entregas. Preservar a ordem dos nove módulos; localização do novo acesso deve ser registrada antes da edição.

1. Rever diffs externos e fontes; preservar testes recebidos, criar regressões próprias para achados.
2. Integrar primeiro fluxo vertical real, login docente/discente e projeção; testar browser com duas sessões e reconexão.
3. Medir capacidade conforme RV-09, registrando transporte real, ambiente, duração, latência e limites. Não extrapolar resultado de mocks.
4. Rodar `cd frontend && npm test`; exigir suíte completa aprovada. Rodar lint dos arquivos alterados e `npm run build`, sem builds concorrentes.
5. Revisar `git diff --check`, arquivos não relacionados, segredos, conteúdo privado no bundle e logs. Nenhum teste existente pode ser alterado para passar.
6. Commit/push automático só da entrega revisada; verificar deploy. Reportar acervo real, capacidade medida e pendências separadamente. Não chamar entrega parcial de módulo completo.
