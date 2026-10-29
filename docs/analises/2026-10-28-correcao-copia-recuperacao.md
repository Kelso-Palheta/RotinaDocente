# Correção RN-82 — cópia de recuperação entre turmas

## Resultado da implementação

Entrega do DeepSeek aproveitada e corrigida neste chat por autorização explícita do usuário, após limite gratuito no OpenCode. Os três bloqueios de `2026-10-28-revisao-copia-recuperacao.md` foram corrigidos sem alterar os testes recebidos nem os testes de reprodução.

- **Snapshot conferido:** criação nova preserva a versão do destino aberta na revisão. Mudança de semestre/versão gera `RECUPERACAO_COPIA_DESTINO_OBSOLETO`; o modal e o pai não renovam silenciosamente a versão. Semestre fica fixo no formulário da cópia.
- **Retry:** se o ID já está na composição do destino, o modal encaminha a operação ao caso de uso para verificar ID/contexto/conteúdo idênticos, antes de recusar saldo consumido pelo próprio commit. Uma atividade nova continua sujeita à versão/saldo/congelamento transacionais; cópia existente diferente não é sobrescrita.
- **Ajuste de pontos:** elegibilidade exige contexto válido e saldo positivo, sem exigir que a pontuação original já caiba. Aviso pede reduzir as questões; salvamento continua bloqueando excesso. A redução que fecha o saldo mostra aviso de liberação.
- **Prazo:** seleção inicial aceita data/hora brasileira ou ISO local estritamente válidas; data impossível não vira data padrão. A revisão usa seletor de data/hora, com largura completa em celular.
- **Conteúdo:** projeção por campos permitidos remove dados operacionais. Campos escalares não transportam objetos/arrays inesperados com metadados privados aninhados. IDs locais de questões/alternativas são preservados sem copiar o ID da atividade.
- **Interação:** foco permanece no diálogo de destino e na revisão; Escape respeita confirmação de descarte. Ações após desmontagem não fecham outro modal; pai confere conta/conjunto antes de atualizar resultado. Controles das questões quebram linha em tela estreita.

Sem alterações em fórmula 25/25/50, notas do Diário, endpoints de entrega, autorização ou regras Firestore, provedor de IA, armazenamento de imagens ou plano Firebase. A criação usa a infraestrutura transacional RN-81 existente.

## Evidências de validação

Última execução após todas as alterações de produção:

- `cd frontend && npm test`: **1.060 testes em 228 arquivos aprovados**, exit 0.
- Lint dos seis arquivos JS/JSX de produção da RN-82: **zero erros, dois avisos preexistentes de `<img>`**, exit 0.
- `NODE_USE_SYSTEM_CA=1 npm run build`: exit 0, compilação e geração de páginas concluídas.
- `git diff --check`: sem erros. Testes desde a base: somente arquivos novos.
- Logs locais ignorados em `tmp/rn82-entrega-*.log`.

Testes novos desta correção/revisão, sem modificar anteriores:

| Arquivo | Evidência |
|---|---|
| `CopiarRecuperacaoRevisao.test.jsx` | Três bloqueios originalmente vermelhos agora verdes |
| `CopiarRecuperacaoAjustes.test.jsx` | Prazo inválido/brasileiro e revisão com saldo menor |
| `CopiarRecuperacaoContexto.test.jsx` | Semestre fixo, seletor, aviso e ausência de prazo sem padrão inventado |
| `CopiarRecuperacaoTeclado.test.jsx` | Foco circular e Escape sem descarte silencioso |
| `copiar_recuperacao_projecao_segura.test.js` | Objetos/arrays inesperados não levam metadados nem referências |

Também preservados os quatro arquivos de teste da implementação recebida. Diferença em `tests/` desde a base versionada: somente adições. Os logs RED foram mantidos localmente para as reproduções, prazo, contexto, teclado e projeção; não são evidência de falha atual após correção.

## Ensaio visual

Componentes reais `CopiarRecuperacaoModal` e `AtividadeForm` e caso de uso renderizados em navegador local com CSS real; repositório em memória, conta/turmas/alunos/figuras fictícios. A primeira cópia de 4 manteve montagem; a segunda de 6 fechou 10 no destino. Semestre e alunos do destino distintos da origem, figura e rubrica preservadas. Inspeção em 390×844 e 1440×1000, rolagem interna e Shift+Tab nos dois diálogos. [Capturas e limites](../evidencias/2026-10-28-copia-recuperacao/README.md).

Esse ensaio não acessou produção ou Firebase real, não gerou imagem nem consumiu IA. Testes de infraestrutura usam banco sintético. Não houve leitor de tela nem estresse simultâneo em Firestore real nesta rodada. A cópia de atividades adaptadas individualizadas permanece fora do fluxo; formatos indisponíveis exigem revisão docente, sem promessa de anonimização automática. Os cinco achados anteriores de PDF/apresentação RN-81 continuam pendentes e separados.

Guia atualizado: `docs/guias/recuperacao-semestral.md`. Deploy só pode ser considerado confirmado após status do provedor; commit/push não equivale à homologação real da versão publicada.
