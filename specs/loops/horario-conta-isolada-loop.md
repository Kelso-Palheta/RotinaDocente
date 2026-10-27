# RN-76 — ciclo de implementação

## Perceber
A auditoria de Meu Horário Escolar comprovou que conta B recebia o cache da conta A e que falha de localStorage/Firestore ainda resolvia como sucesso. Evidências históricas em `docs/analises/evidencias-meu-horario/`.

## Decidir
Especificar antes de codar (RN-76, UT-50..UT-55). Separar armazenamento por conta, transformar falha silenciosa em estado explícito, manter `somenteReal` estrito e não migrar nada automaticamente. Nenhuma alteração em importação, backup, PDF ou integração com o Calendário.

## Agir
Testes novos escritos e observados falhando; nenhum teste preexistente alterado. A chave base passa a ser índice sem aulas; a migração de rascunho legado é oferecida com confirmação.

## Verificar
828 → **851 testes em 177 arquivos** aprovados: 828 preexistentes preservados e 23 novos (UT-50..UT-55). Build de produção exit 0. Lint dos arquivos alterados sem problemas. `git diff --check` limpo. O isolamento foi confirmado pela suíte nova: conta B não recebe a grade da conta A, a chave base fica sem aulas e falha de gravação aparece como `pendente`/`falha`, nunca como sincronizada.

## Limites
Migração de rascunho legado cobre a chave local, não cache de navegador antigo em outras máquinas. Revisão/fila transacional (P1 da auditoria) permanece proposta.
