# Antigravity — identidade vibrante do aulão

Projeto `/Users/kelsopalheta/Developer/RotinaDocente`. Usuário aprovou direção de cores intensas e animações chamativas, rejeitando visual discreto atual. Leia AGENTS.md, specs/REVISAO_AO_VIVO_SPEC.md, specs/REVISAO_VISUAL_VIBRANTE_SPEC.md e docs/analises/2026-11-04-revisao-entregas-aulao.md. Referência visual conceitual na pasta indicada pela spec.

Sua frente exclusiva agora: atualizar visual/movimento de `frontend/src/components/revisao/PainelAluno.jsx`, `PainelProfessor.jsx`, `TelaProjecao.jsx`; pode criar auxiliares NOVOS `RevisaoTema.jsx` e `revisaoTema.module.css` na mesma pasta. Pode criar testes `tests/unit/components/revisao/RevisaoVisualVibrante.test.jsx`, `tests/unit/revisao_visual_contraste.test.js`, relatório `docs/analises/2026-11-04-revisao-visual-vibrante.md` e evidências em `docs/evidencias/2026-11-04-revisao-visual-vibrante/`.

ChatGPT está corrigindo PrepararAulao/RevisarQuestao e domínio. NÃO toque nesses arquivos, no helper `revisaoUtils.jsx`, no hook `useCronometroRevisao.js`, specs, acervo, testes existentes, CSS global, package/lockfiles, rotas, autenticação, notas ou transporte. Não faça commit/push/deploy/build. Nunca sobrescreva correções de relógio, imagens, conexão e acessibilidade recebidas na revisão.

Implemente uma interface real inspirada em festival de Arte + game show: violeta/ciano/amarelo/coral/lima, alternativas contrastantes e legíveis, grandes momentos de mudança de etapa, feedback e ranking. Efeitos de resposta só quando status confirmado; nada de gabarito/pontuação antecipados. Não usar a imagem conceitual como uma captura de interface nem substituir obra real por arte gerada.

Preservar todos os contratos e interações. Movimento depende da fase e de estado recebido; cronômetro não pode mudar por animação ou atraso de callback. Não inventar contagem de abertura sem horário fornecido. Suportar movimento reduzido automaticamente e limpar efeitos. Sem áudio automático, nova dependência ou centena de partículas por participante. Em listas grandes, animar poucos elementos/lotes e manter altura limitada.

TDD RED→GREEN para comportamento novo. Rodar `cd frontend && npx vitest run ../tests/unit/components/revisao` e os novos testes de contraste; lint apenas arquivos alterados. Se algum teste legado falhar, corrigir implementação; se houver conflito real de contrato, relatar sem editar teste ou esconder cor/informação para burlar auditoria. A exceção de identidade do novo módulo está documentada; tokens semânticos são locais, sem modificar marca global ou notas.

Validar visualmente componentes REAIS em 360/1440/1920px, com estilos reais, erro/reconexão/confirmado/feedback/ranking e dados sintéticos. Não recriar HTML parecido para screenshots. Entregar diff, resultado dos testes e limitações precisas. Se faltar tempo, priorizar aluno/projeção completos, declarar o restante e não alegar etapa concluída.
