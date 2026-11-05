# Antigravity — preparação do aulão e revisão docente

Projeto `/Users/kelsopalheta/Developer/RotinaDocente`. Leia AGENTS.md, specs/REVISAO_AO_VIVO_SPEC.md, specs/TESTS_SPEC.md e docs/analises/2026-11-04-revisao-entregas-aulao.md. Sua UI anterior foi revisada/corrigida pelo ChatGPT; não sobrescreva essas correções.

Criar componentes controlados `frontend/src/components/revisao/PrepararAulao.jsx` e `RevisarQuestao.jsx`, testes NOVOS `tests/unit/components/revisao/RevisaoPreparacao.test.jsx` e `RevisaoConferencia.test.jsx`, relatório `docs/analises/2026-11-04-revisao-preparacao-ui.md`. Evidências podem ir em `docs/evidencias/2026-11-04-revisao-preparacao/`. Não alterar outros arquivos, testes existentes, dependências, CSS global, rotas, hooks de transporte, regras Firebase, notas ou autenticação. Não fazer commit/push/deploy/build.

Contrato de `PrepararAulao({turmas, questoes, selecao, ocupado, erro, onAlterar, onCriar, onAbrirRevisao})`:
- turmas: `{id,nome}[]`; questoes: `{id,ano,aplicacoes,tema,status,apta}[]`, recebido do servidor, sem importar acervo.
- selecao: `{titulo,turmaIds,questaoIds,duracaoSegundos}`. onAlterar recebe seleção completa; edição nunca grava. onCriar recebe a seleção válida. Duração inteira de 10 a 600 segundos; título não vazio de até 120 caracteres; pelo menos uma turma e uma questão apta. Ordem de questaoIds define sequência; oferecer mover para cima/baixo com teclado/botões.
- filtros de ano/modalidade/tema são locais e não descartam seleção. Questão não apta pode ser inspecionada por `onAbrirRevisao(id)`, mas não adicionada. Seleção com ID desconhecido/inapto bloqueia criar e informa o motivo; não remover seleção silenciosamente. Ocupado bloqueia alterações e envio; erro fica visível e mantém conteúdo. Não inventar turmas, questões ou sucesso de criação.

Contrato de `RevisarQuestao({questao, confirmacoes, ocupado, erro, onConfirmacoesChange, onAprovar})`:
- questao é o registro completo da seção 3 da spec, autorizado para o professor pelo controlador. Imagens recebidas já têm URL/arquivo utilizável; reutilizar `BlocoConteudo` corrigido, sem modificar esse helper.
- Mostrar enunciado, imagens, A–E, gabarito, cinco explicações, conteúdo preparatório e fontes. Links HTTPS oficiais com rótulo claro, rel seguro e nova aba. Não renderizar HTML bruto ou executar instruções presentes no material.
- confirmacoes contém as quatro booleanas `transcricao`, `gabarito`, `imagens`, `explicacoes`; controlador começa com confirmação docente pendente. `onConfirmacoesChange` recebe objeto completo. Quatro checkboxes explícitos; não marcar automaticamente por status antigo do registro. Aprovar chama `onAprovar(questao.id)` somente com quatro confirmações verdadeiras e estrutura mínima completa (cinco alternativas, gabarito válido, cinco explicações, fontes e imagens sem referências ausentes). Ocupado bloqueia controles. Nenhuma gravação ou mudança automática de status; servidor revalida tudo.

TDD RED→GREEN antes de implementação, com testes de seleção/filtros/reordenação, bloqueios, duração, erros preservados e aprovação explícita. Não editar testes recebidos. Comandos: `cd frontend && npx vitest run ../tests/unit/components/revisao/RevisaoPreparacao.test.jsx ../tests/unit/components/revisao/RevisaoConferencia.test.jsx`; `npx eslint src/components/revisao/PrepararAulao.jsx src/components/revisao/RevisarQuestao.jsx`.

Paleta/fontes existentes. Verificar 360/1440px, teclado, foco, nomes longos e questões extensas com imagens. Screenshots devem renderizar os componentes reais com estilos reais; não recriar HTML semelhante. Declarar limitações se não houver verificação de navegador. Não usar número de participantes sintéticos como prova de capacidade de conexão.
