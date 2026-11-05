# Revisão independente — visual vibrante do aulão

Entrega do Antigravity em 04/11; revisão e consolidação em 05/11/2026.

## Resultado e correções

Identidade Festival de Arte preservada exclusivamente nos três painéis controlados. Sem mudança em autenticação, transporte, cronômetro, acervo, notas, rotas, dependências ou estilos globais.

- Restaurados os exports padrão de PainelAluno e TelaProjecao, removidos na entrega apesar da exigência de preservar a API pública.
- Código ausente volta a `------`; o telão não anuncia uma sala fictícia `ARTE42`.
- Ranking do aluno destaca a posição recebida, incluindo empates, em vez de colorir os três primeiros índices da lista.
- Movimento reduzido abrange descendentes e pseudo-elementos, incluindo ping/pulse/spin utilitários e transições. A regra original alcançava somente três classes locais.
- Entrada de etapa conectada ao conteúdo do aluno e do telão, por sala/rodada/fase; atualizações do cronômetro não remontam a etapa nem reiniciam a animação. Pop de confirmação permanece exclusivo ao recibo confirmado. Retirada interpolação de sombra do pop: movimento usa transform.
- Dois avisos coral sobre coral translúcido falhavam no contraste composto: cerca de 2,95:1 no telão e 3,44:1 no aluno. Alterados para fundo coral sólido e texto escuro; calculadora independente cobre também transparências e hover.
- Ranking projetado com nome longo chegava a documento de 524px em viewport de 360px. Cabeçalho responsivo, flex com min-width:0 e nome truncável restauram largura de 360px, preservando pontos e posição. Código da sala ajustado para telas estreitas.

## Evidências e alcance

Quatro testes independentes de componente falharam antes das correções; um teste independente de contraste também reproduziu a falha. Depois, 92 testes de componentes/contraste aprovados em 15 arquivos. Testes recebidos do Antigravity permanecem byte a byte preservados, com SHA-256 registrado em `docs/evidencias/2026-11-04-revisao-visual-independente/testes-recebidos.sha256`.

Componentes React reais montados com Tailwind compilado em harness local temporário. Conferência própria em navegador: aluno/pergunta, aluno/ranking, aluno/feedback e projeção/ranking em 360px; professor/pergunta em 1440px; projeção/pergunta em 1920px. Largura do documento igual ao viewport nesses casos após correção; figura original do acervo carregada em pergunta. Capturas próprias do ranking projetado e feedback móvel estão na pasta de evidências independente. Capturas do agente são identificadas separadamente na pasta da entrega; não constituem nova evidência própria de todas as fases.

Fixture com 500 respondentes verifica apresentação e altura limitada da lista; **não é ensaio de rede, capacidade simultânea ou homologação do transporte**. Redução de movimento validada por regra CSS abrangente; não foi alterada a preferência do sistema do usuário. Nenhum dado real de aluno foi usado.

A entrega não implementa o movimento completo descrito na direção artística: CSS de confete está definido, porém não é montado; distribuição apresenta contagens, sem gráfico de barras ou coreografia de chegada em lotes. Não se declara concluída a integração de salas, Portal, ranking persistente ou transporte. Esses pontos continuam sujeitos aos portões RV-06 a RV-09 e à integração visual posterior.

## Publicação

A validação usa snapshot imutável do índice Git contendo apenas a entrega visual revisada e o acervo já publicado. Arquivos novos do DeepSeek, ainda em execução, ficam fora desse snapshot e do commit.

Validação final do snapshot: **1.270 testes em 273 arquivos aprovados**, lint dos quatro arquivos JSX sem erros/avisos e build webpack concluída (exit 0). A primeira tentativa de build encontrou ENOSPC; removidos apenas os diretórios `.next` das duas cópias temporárias criadas por esta revisão e repetida com sucesso. O webpack mantém o aviso preexistente de top-level await em `src/lib/firebase.js` (arquivo não alterado). Logs finais arquivados na pasta de evidências independente. Os nove arquivos de código/testes adicionados ou alterados foram comparados por conteúdo entre índice, snapshot e workspace.
