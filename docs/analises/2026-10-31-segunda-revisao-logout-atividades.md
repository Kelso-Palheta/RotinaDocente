# Segunda revisão independente — logout de Atividades (RN-83)

Data: 31/10/2026. Base: `7c623bc`. Resultado: código de logout retido; entrega responsiva de Agentes avaliada separadamente.

## Evidências

A entrega recebida aprovou 1.110 testes em 240 arquivos, lint e build. Os quatro cenários da primeira revisão agora passam: a fila canônica participa da proteção e o salvamento em curso é aguardado. Nenhum teste recebido foi alterado.

Nova reprodução independente: `tests/unit/components/atividades/LogoutAtividadesEdicaoDuranteEspera.test.jsx`, cenário REV2-R83-01. Resultado: uma falha. O guard de formulários é real; autenticação, fila e componente filho são simulados. Não houve sessão real nem escrita no Firebase.

## P1 — edição surgida durante a espera fica desprotegida

Em `frontend/src/app/atividades/page.js`, `handleLogout` consulta a confirmação uma vez; `tentarSalvarESair` aguarda o salvamento e chama `encerrarSessaoConfirmada`. Durante a espera a interface continua editável. Um formulário novo com `data-diario-rascunho="true"` pode surgir após a conferência inicial. Ao resolver a fila, o logout ocorre sem consultar esse novo rascunho. A reprodução configura recusa de descarte e mesmo assim observa uma chamada de logout.

O defeito comprovado é o encerramento sem proteger a nova edição. Não foi demonstrada perda definitiva de dados no Firebase. Bloquear edição durante a espera ou revalidar com segurança antes do logout são estratégias possíveis. Preservar formulário/conteúdo quando o professor recusar sair e também tratar tentativas repetidas de saída.

## Prompt pronto para Antigravity

```text
Corrija somente a pendência REV2-R83-01 no projeto /Users/kelsopalheta/Developer/RotinaDocente.
Leia AGENTS.md, specs/RULES.md, specs/PRD.md, specs/TESTS_SPEC.md e docs/analises/2026-10-31-segunda-revisao-logout-atividades.md.

O logout já aguarda a fila, mas deixa os formulários editáveis durante aguardarSalvamento(). Uma edição aberta nesse intervalo não passa novamente pelo guard e pode ser descartada. O teste novo LogoutAtividadesEdicaoDuranteEspera.test.jsx reproduz isso e está vermelho.

Corrija frontend/src/app/atividades/page.js: proteja toda a transição até o logout, bloqueando novas edições durante a espera ou revalidando o contexto antes de encerrar, sem janela que descarte novo rascunho. Recusa deve manter sessão e conteúdo. Preserve espera da fila, erros distintos, retry, confirmação de pendências/falha/conflito e navegação somente após logout concluído. Evite logout duplicado em cliques repetidos.

Não altere/remova testes existentes ou recebidos, inclusive os quatro arquivos LogoutAtividades*.test.jsx. Acrescente testes se necessário. Não altere auth-context, persistência, fórmulas/notas, Firebase, Agentes nem outros módulos. Atualize apenas specs pertinentes se necessário. Execute reprodução, suíte completa, lint e build. Não use dados reais/chamadas pagas. Entregue para revisão; sem commit/push/deploy.
```

## Publicação

O código e os testes locais de logout ficam fora do commit dos Agentes. A reprodução permanece local para o executor. O relatório registra o bloqueio, sem alegar que a árvore local completa está aprovada.
