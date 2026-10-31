# Revisão independente — logout de Atividades (RN-83)

Data: 31/10/2026. Base: `00b6952`. Entrega recebida como alterações locais. **Resultado: publicação do código retida por proteção incompleta das pendências canônicas do Diário.** Produção e testes recebidos não foram alterados nesta revisão.

## Evidências executadas

- `cd frontend && npm test`: **1.093 testes em 237 arquivos aprovados**, exit 0, antes das novas reproduções. Inclui os seis cenários recebidos de logout, espera da promessa, recusa da confirmação, falha/retry e ausência de limpeza duplicada na página.
- Lint de `frontend/src/app/atividades/page.js`: exit 0, sem erros/avisos.
- `NODE_USE_SYSTEM_CA=1 npm run build`: exit 0.
- Arquivo independente novo `tests/unit/components/atividades/LogoutAtividadesPersistenciaRevisao.test.jsx`: **quatro cenários, quatro falhas**, exit 1. O guard `confirmarTrocaContexto` é real; persistência/autenticação/roteador são simulados. Nenhum teste recebido modificado/removido.
- Logs locais ignorados: `tmp/revisao-rn83-{testes,lint,build,reproducao}.log`.
- Não houve logout com conta real, sessão de navegador, nova escrita no Firestore ou deploy desta implementação.

## O que está correto no escopo examinado

A barra lateral chama `handleLogout`; ele usa `await logout()` e só depois navega por `router.replace('/')`. O erro é acessível e oferece repetição, sem alegar sucesso. A lógica considera que o contexto limpa `user` antes de o `signOut` resolver/rejeitar. A página não duplica limpeza de credenciais. Os testes recebidos representam esse comportamento, porém simulam o resultado do guard sem exercitar a ligação com o estado da fila.

## P1 — REV-R83-01: estado da fila não participa da proteção de saída

Caminho: `frontend/src/app/atividades/page.js`, `handleLogout` → `confirmarTrocaContexto()` → `logout()`.

O guard de `frontend/src/utils/diario/confirmarTrocaContexto.js` consulta apenas marcadores DOM de formulário (`data-diario-salvando`, `data-diario-rascunho`) e entradas inválidas. O estado canônico `persistencia.estado` não é passado ao guard nem representado por esses marcadores na página.

Assim, sem formulário aberto, mesmo quando o Diário está em `salvando`, `pendente`, `falha` ou `conflito`, clicar Sair chama o logout sem esperar a fila, bloquear a saída ou pedir decisão sobre as alterações. O teste deixa a confirmação configurada para recusa: ela nem é consultada nesses casos, e o logout é chamado uma vez.

A diferença importa porque o logout real em `frontend/src/lib/auth-context.js` limpa tokens e storages antes de retornar a promessa do Firebase. A fila guarda rascunhos e o cleanup do hook também tenta regravá-los; portanto, **não foi demonstrada perda definitiva de dados**. O problema comprovado é a saída sem conferir/esperar as pendências e sem a decisão do professor. Depender da ordem de limpeza, cleanup e conclusão da fila não substitui a proteção exigida pela RN-83.

## Aceite da correção

- Integrar o estado canônico à proteção, preservando também os marcadores de formulários e notas inválidas existentes.
- Durante salvamento, bloquear saída com aviso ou aguardar sua conclusão; não executar logout enquanto houver gravação em curso sem resolução segura.
- Para rascunho pendente/falha/conflito, não encerrar sem salvar/resolver ou obter confirmação explícita e esclarecida de descarte. Recusa mantém sessão e conteúdo.
- Só navegar após o logout realmente concluir; manter tratamento de erro/retry. Tratar falha anterior ao logout sem fingir que a sessão já foi encerrada.
- Não alterar o contexto de autenticação, a fila, a fórmula de notas, sincronização, regras Firestore ou limpar storages na página para satisfazer os testes.
- Preservar os seis testes recebidos e os quatro cenários da revisão. Acrescentar cobertura de salvamento que conclui, salvamento que falha e decisão de descarte/recusa, sem exigir nova chamada de IA.

## Prompt para OpenCode ou Antigravity

```text
Corrija RN-83 em /Users/kelsopalheta/Developer/RotinaDocente.
Leia AGENTS.md, specs/RULES.md, specs/PRD.md, specs/TESTS_SPEC.md e docs/analises/2026-10-31-revisao-logout-atividades.md.

Bloqueio: handleLogout em frontend/src/app/atividades/page.js consulta apenas o guard de formulários; ignora persistencia.estado. Sem formulário aberto, Sair chama logout mesmo em salvando/pendente/falha/conflito. O contexto real limpa tokens/storages antes de o Firebase concluir.

Preserve integralmente os testes existentes/recebidos, inclusive LogoutAtividades.test.jsx e o novo arquivo local LogoutAtividadesPersistenciaRevisao.test.jsx (quatro cenários vermelhos). Corrija produção, não os testes.

Faça o estado canônico participar da proteção: salvamento em curso deve bloquear ou aguardar conclusão segura; pendência/falha/conflito exige resolver/salvar ou decisão explícita de descarte, cuja recusa mantém sessão/rascunho. Preserve a confirmação de formulários/notas inválidas. Não baseie a segurança na ordem incidental de cleanup/storage. Aguarde logout antes de navegar; mantenha erro acessível e retry, distinguindo falha de salvamento de falha de logout.

Escopo preferencial: página de Atividades. Não mude auth-context, fila de persistência, notas/fórmulas, sincronização, regras Firebase ou armazenamento. Não limpar credenciais na página. Acrescente novos testes para salvamento concluído, falha e recusa/descarte, sem alterar anteriores. Execute reproduções, suíte completa, lint e build. Não use dados reais ou chamadas pagas. Entregue para revisão aqui, sem commit/push/deploy.
```

## Continuidade

O usuário informou assinatura do Antigravity como opção adicional. Esse mesmo escopo pode ser executado no OpenCode/DeepSeek ou no Antigravity; escolher um executor por vez no mesmo checkout. Os modelos disponíveis no Antigravity ainda não foram informados, portanto não há recomendação de modelo específico nem afirmação de superioridade. Não iniciar trabalhos externos automaticamente.

Após aprovar esta correção, retomar a análise de Agentes Pedagógicos IA. Manter lembrete de concluir armazenamento de imagens de Atividades Adaptadas ao final das tarefas, sem ativar Blaze.
