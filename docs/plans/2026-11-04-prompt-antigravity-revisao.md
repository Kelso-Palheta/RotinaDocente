# Prompt — Antigravity / interfaces Revisão ao Vivo

Trabalhe em `/Users/kelsopalheta/Developer/RotinaDocente`. Leia `AGENTS.md`, `specs/PRD.md`, `specs/RULES.md`, seção Revisão ao Vivo de `specs/TESTS_SPEC.md`, `specs/REVISAO_AO_VIVO_SPEC.md` e `docs/plans/2026-11-04-revisao-ao-vivo.md`.

Sua frente exclusiva: componentes controlados do novo aulão. ChatGPT cuida de infraestrutura/autorização/integração; DeepSeek cuida de acervo. Não faça autenticação, fetch, WebSocket, banco, páginas, integração no Portal/Hub ou backend. Não modifique módulos existentes, specs, dependências, lockfiles, CSS global, notas ou testes existentes. Não faça commit/push/deploy nem build; outros agentes usam o mesmo checkout.

Pode criar SOMENTE:
- `frontend/src/components/revisao/PainelProfessor.jsx`, `TelaProjecao.jsx`, `PainelAluno.jsx` e auxiliares na mesma pasta;
- `tests/unit/components/revisao/RevisaoFluxo.test.jsx`, `RevisaoAluno.test.jsx`, `RevisaoProjecao.test.jsx`;
- `docs/analises/2026-11-04-revisao-ao-vivo-ui.md` e imagens de evidência em `docs/evidencias/2026-11-04-revisao-ao-vivo-ui/`.

Siga exatamente exports, props e DTO da seção 4 do contrato. Não invente props incompatíveis. Componentes recebem estado autorizado; nunca importam conteúdo com gabarito do acervo. Dados sintéticos só em testes. Não crie uma página pública de demonstração.

TDD: criar testes novos para RV-03/04/05/10, executar RED, implementar, executar GREEN. Comandos: `cd frontend && npx vitest run ../tests/unit/components/revisao`; `npx eslint src/components/revisao`. Não reduzir expectativas para passar. Não execute a suíte inteira/build enquanto outras frentes trabalham; coordenação fará a verificação final.

Professor controla etapas por callbacks; projeção mostra pergunta, timer, respondentes e distribuição A–E, sem ligar nome à alternativa. Feedback explica as cinco opções e destaca gabarito SOMENTE na fase feedback. Ranking deve renderizar o recebido, sem recalcular regra de notas/pontuação no componente.

Aluno: celular 360px, enunciado/imagem legíveis, alternativas com botão acessível, estado enviando distinto de confirmado. Sem conexão ou após prazo, desabilitar resposta. Retry preserva escolha. Erro visível com ação de repetição; nunca converter falha em sucesso. Timer é visual, ancorado no tempo do servidor; não decide aceitação. Cleanup correto em unmount/StrictMode. Não anunciar countdown a cada segundo a leitores de tela.

Manter paleta petróleo/sálvia e fontes existentes. Visual projetado legível a 1920px, painel docente 1440px. Teclado, foco, estados textuais, `role=alert` e `role=status`. Listas extensas não aumentam indefinidamente o cabeçalho; nomes longos e mais de 500 participantes não transbordam o layout. Contagens A–E visíveis numericamente; não depender só de cor.

Relatório final: arquivos, testes RED/GREEN, lint, estados implementados, evidência visual/teclado e limitações. Se não conseguir verificar navegador, declarar; jsdom não comprova layout. Entregar diff para ChatGPT revisar, sem publicar.
