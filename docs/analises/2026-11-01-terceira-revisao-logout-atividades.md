# Terceira revisão independente — logout de Atividades (RN-83)

Data: 01/11/2026. Base: `2013388`. Resultado: logout ainda retido; nenhuma implementação ou teste recebido foi alterado nesta revisão.

## Evidência própria

- Cinco arquivos de logout recebidos: **18 testes aprovados**, exit 0. Incluem a reprodução anterior REV2-R83-01 e prevenção de chamadas duplicadas.
- Novo arquivo local `tests/unit/components/atividades/LogoutAtividadesRascunhoAlteradoRevisao.test.jsx`: **REV3-R83-01 falhou**, exit 1. Não foi alterado teste anterior para obter esse resultado.
- A reprodução usa página e guard reais, fila/autenticação/componentes filhos simulados. O filho representa a estrutura efetiva do `AtividadeForm.jsx`: marcador de rascunho no `<form>` e valor editável no `<textarea>` descendente.
- Logs ignorados: `tmp/revisao-final-logout-20261101-{direcionados,rascunho}.log`.
- Não foi repetida suíte completa/build nesta rodada: há bloqueio funcional reproduzido, portanto o código não está aprovado. Sem conta real, escrita Firebase ou logout real.
- Commit anterior dos Agentes `2013388`: status Vercel **success** consultado nesta revisão.

## P1 — confirmação anterior continua válida mesmo depois de editar os campos

`assinaturaPendenciasDom`, em `frontend/src/app/atividades/page.js`, lê os atributos e `el.value` somente dos elementos marcados. No formulário real, o marcador está no `<form>`, que não possui `value`. O texto está nos controles descendentes. Alterar esse texto não altera a assinatura.

Sequência reproduzida: fila em salvamento, formulário já modificado → professor confirma saída → espera começa → professor altera o texto do formulário → fila conclui. A assinatura permanece igual; `tentarSalvarESair` pula o guard e chama logout. A confirmação foi configurada para recusar um segundo descarte, mas ela nem é consultada.

A edição recém-aberta durante a espera já está protegida; **a edição de um formulário já confirmado permanece desprotegida**. Os testes anteriores usavam marcador no próprio textarea, escondendo a diferença entre essa estrutura e o formulário real. O ensaio não homologa a sequência com mouse na aplicação real nem comprova perda definitiva de dados; comprova a lacuna de revalidação do controlador sob edição concorrente.

## Prompt pronto para Antigravity

```text
Corrija REV3-R83-01 em /Users/kelsopalheta/Developer/RotinaDocente.
Leia AGENTS.md, specs/RULES.md, specs/PRD.md, specs/TESTS_SPEC.md e docs/analises/2026-11-01-terceira-revisao-logout-atividades.md.

A correção anterior passa nos 18 testes recebidos, mas assinaturaPendenciasDom() lê el.value do elemento marcado. AtividadeForm marca o form; seus valores ficam nos controles filhos. O professor pode confirmar sair, alterar esses controles durante aguardarSalvamento() e sofrer logout sem nova confirmação porque a assinatura permanece igual.

Novo teste local LogoutAtividadesRascunhoAlteradoRevisao.test.jsx (REV3-R83-01) reproduz essa estrutura e falha. Corrija a revalidação para reconhecer edição real nos controles descendentes, sem confiar só no marcador/valor do container. Mudança posterior à confirmação exige nova decisão cuja recusa preserve sessão e conteúdo. Sem alteração, preserve o comportamento recebido de evitar confirmação duplicada. Considere textarea, input, select e checkbox; não introduza serialização de dados sensíveis em logs.

Preserve integralmente TODOS os testes recebidos e de revisão. Não altere/remova testes para passar. Acrescente cobertura de controles descendentes conforme necessário. Escopo de produção: frontend/src/app/atividades/page.js. Não alterar contexto de autenticação, fila, Firebase, fórmulas, sincronização ou Agentes. Atualize specs pertinentes antes de implementar. Valide as reproduções, suíte completa, lint e build. Não usar conta real/chamada paga. Entregar para revisão, sem commit/push/deploy.
```

## Continuidade

A responsividade dos Agentes já foi publicada; análise funcional completa do módulo continua pendente. Ao final das tarefas, concluir armazenamento das imagens de Atividades Adaptadas mantendo o plano Firebase atual, sem ativar Blaze.
