# Concluir revisão autônoma e primeiro jogo de plataforma 2D

Trabalhe em `/Users/kelsopalheta/Developer/RotinaDocente`.
O usuário autorizou IMPLEMENTAR, VALIDAR E PUBLICAR. Continue a implementação local existente; não recomece. Economize contexto: leia primeiro os arquivos abaixo, sem carregar documentos históricos inteiros.

## Fontes e estado
- Regras: AGENTS.md; `specs/REVISAO_AUTONOMA_PLATAFORMA_SPEC.md`.
- Plano: `docs/plans/2026-11-19-revisao-autonoma-plataforma.md`.
- Mapeamento: seção final de `specs/TESTS_SPEC.md`.
- Base atual: `3d0b01c` em `master`. A implementação desta etapa ainda NÃO foi commitada/publicada.
- O site já tem nove jogos ao vivo; preservar todos. A plataforma é um modo separado, sem mudar a quantidade do catálogo.

## Já existe localmente (inclui arquivos novos não rastreados)
- `frontend/src/dominio/revisao-autonoma/plataforma.js`: física pura, salto, plataformas, obstáculos, estrelas, portal e checkpoint.
- `frontend/src/aplicacao/revisao-autonoma/RevisaoAutonomaService.js`: publicação por turma, catálogo discente, sessões, resposta/avanço idempotentes, feedback, reforço dos erros e histórico.
- `frontend/src/infraestrutura/revisao-autonoma/httpServidor.js` e `frontend/src/app/api/revisao-autonoma/[...partes]/route.js`.
- `frontend/src/components/revisao-autonoma/`: `api.js`, `PublicacaoRevisao.jsx`, `Plataforma2D.jsx`, `RevisaoAutonoma.jsx`, `AcessoRevisaoAutonoma.jsx`.
- Página: `frontend/src/app/aluno/revisar/page.js`.
- Integrações: `frontend/src/app/aluno/notas/page.js`, `frontend/src/components/aula-gamificada/BancoQuestoes.jsx` e `HubDocente.jsx`.
- Testes: `tests/unit/revisao_autonoma_plataforma.test.js`, `tests/integration/revisao_autonoma.test.js`, `tests/contract/revisao_autonoma_http.test.js`, `tests/unit/components/aula-gamificada/RevisaoAutonomaUI.test.jsx`, `RevisaoLivreFluxo.test.jsx`.

## Requisitos essenciais
1. Aluno acessa pelo Portal, sem código de sala/professor online; escolhe disciplina, conteúdo/dificuldade e quantidade de fases. Primeiro jogo realmente jogável: movimento, salto, colisões, obstáculos, estrelas e portal.
2. Professor libera explicitamente questões REVISADAS de múltipla escolha para turmas próprias. Banco privado/rascunhos/abertas não são publicados automaticamente. Edição da questão retira a liberação; conferir isso no fluxo existente.
3. Cookie do Portal autentica aluno; Bearer existente autentica professor. Revalidar matrícula, turma não arquivada, existência do aluno e liberação. Nenhum login/chave de IA precisa aparecer no cliente. Reaproveitar infraestrutura; sem dependência nova ou cobrança.
4. Questões e gabaritos ficam privados no servidor; cliente recebe só a atual. Após responder, recebe correção e explicação. Próxima fase somente após leitura/ação explícita. Nada altera Diário/boletim, salas ou avaliação existente.
5. Retomar fase/feedback; histórico das últimas 50 revisões e nova tentativa dos erros. Acertos não se confundem com habilidade motora/estrelas. Modo acessível permite ir ao desafio.
6. Computador e celular, teclado/toque, pausa ao ocultar aba, movimento reduzido, reconexão e respostas tardias sem contaminar outra conta.

## Falhas já reproduzidas — corrigir IMPLEMENTAÇÃO
Log `/tmp/rd-livre-fluxo-red.log`:
- `RevisaoLivreFluxo.test.jsx`: radio é efetivamente bloqueado pelo fieldset, mas `.disabled` do input permanece false. Defina `disabled` explicitamente no radio conforme ocupado/pendente/feedback, mantendo também o fieldset; não enfraqueça o teste.
- Sessão expirada no POST deixa desafio/histórico anteriores visíveis. No tratamento de 401/403/404 e mudança de conta, invalidar geração/operação pendente e limpar conteúdo sensível de forma coerente. O teste exige sumir a questão antiga. Conferir também retorno tardio de operações e atualização tardia do histórico após troca de conta.
- `api.js` ainda não tem timeout explícito; impedir carregamento indefinido, preservar pedido/resposta para retry idempotente e liberar recursos ao desmontar.

Logs anteriores `/tmp/rd-livre-green3.log`: 12 testes novos passaram antes de acrescentar as duas regressões acima. Isso NÃO é validação final nem revisão de segurança concluída.

## Revisões necessárias
- Percorra o jogo de verdade. A geometria inicial pode deixar estrelas/plataformas opcionais inacessíveis em determinadas fases: salto máximo ~108 px, distâncias/elevacões precisam ser compatíveis. Ajustar mundo/física com testes e comprovar movimento, salto, colisão, checkpoint, coleta e chegada por teclado/toque. Não basta capturar o botão do modo acessível.
- Revisar privacidade e autorização de cada endpoint, submissões/avanços concorrentes, requestId reutilizado com outro payload, retirada de liberação, vínculo revogado e retomada após logout.
- Revisar consultas e escrita Firestore: todas as leituras antes de escritas; histórico/índices limitados; dados privados não expostos em HTML, respostas ou logs.
- Não presumir correção apenas pelos testes existentes; crie regressões para falhas concretas. Revisão independente anterior não foi concluída.

## Preservar trabalho alheio
NÃO alterar, reverter, incluir no commit ou publicar:
- `frontend/src/components/revisao/PainelAluno.jsx`
- `frontend/src/components/revisao/PainelProfessor.jsx`
- `frontend/src/components/revisao/PodioRevisao.jsx`
- `frontend/src/components/revisao/TelaProjecao.jsx`
- `frontend/src/lib/auth-context.js`
Também preserve outros arquivos não rastreados sem relação. NÃO usar `git add .`, reset/clean/stash indiscriminados ou restaurar arquivos compartilhados. `src` é symlink de `frontend/src`.

## Validação e publicação
1. Rodar testes direcionados com cwd `frontend`: `npm test -- --maxWorkers=4 revisao_autonoma RevisaoAutonomaUI RevisaoLivreFluxo`.
2. Capturas dos componentes reais com dados sintéticos desktop/celular e ensaio funcional de jogabilidade. Não usar contas reais, chaves de IA, dados de estudantes ou simulações apresentadas como ensaio real de turma.
3. Criar cópia publicável a partir de `git archive HEAD`, basename `RotinaDocente`, aplicando APENAS arquivos desta entrega; validar nela. No macOS, `cp -cR` pode clonar `frontend/node_modules`; usar ambiente local sem imprimir segredos. Alternativamente, isolamento equivalente seguro.
4. Suíte integral: `npm test -- --maxWorkers=6`; lint: `npm run lint`; build: `NODE_USE_SYSTEM_CA=1 npm run build`.
5. Não alterar/deletar testes para fazê-los passar. Nenhuma autorização para enfraquecer asserções. Corrigir implementação. Não adicionar a plataforma à lista dos nove jogos ao vivo, evitando alterações de expectativas de catálogo.
6. Relatório `docs/analises/2026-11-19-revisao-autonoma-entrega.md`: regras, arquivos, falhas corrigidas, resultados efetivamente observados, capturas e limitações. Atualizar `specs/TASKS.md` somente no escopo realmente entregue, mantendo melhorias futuras pendentes.
7. Com verificações aprovadas e escopo revisado, commit e push automáticos, autorizados pelo usuário. Não publicar com falhas conhecidas. Conferir deployment e acesso online em `https://rotinadocente.vercel.app/aluno/revisar`, sem expor dados privados.
8. Entregar resumo curto, hash, contagem real de testes, lint/build, URL e instrução: professor libera no Banco de Questões → Revisar sozinho; aluno acessa pelo Portal. Informar explicitamente qualquer bloqueio; não alegar entrega completa se ainda faltar validação.
