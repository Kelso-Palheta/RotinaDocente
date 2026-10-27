# RN-73 — ciclo de implementação

## Perceber
Auditoria identificou perda de histórico por chave de aluno/migração automática, gravação lateral de turmas, autorização incompleta, notas inconsistentes, extração de PDF misto e relatórios divergentes. Evidências históricas em docs/analises/evidencias-redacao.

## Decidir
Especificações atualizadas antes da implementação. ID por redação, identidade/contexto separados; BYOK existente; domínio valida notas, infraestrutura grava em transação, UI separa correção/revisão/publicação. Registros existentes não são migrados ao abrir.

## Agir
Novos testes de regressão observados falhando antes das respectivas correções. Casos incluem cache do Diário, manual sem IA, reenvio só de gravação, troca de conta/aluno, referência visual, publicação após edição, associação com colisão global e PDF parcial. Testes preexistentes não modificados.

## Verificar
805 testes em 167 arquivos passaram após a versão final. Revisão independente não encontrou novos bloqueadores materiais. Logs e resumo em docs/analises/evidencias-redacao. Build de produção aprovado; lint do escopo sem erros, com dois avisos de imagens locais; git diff --check limpo. Nenhum serviço de IA pago ou dado real usado em testes; nenhum commit/push/deploy nesta tarefa.

## Limites
Homologação visual/pedagógica com materiais reais não simulada como concluída. Cartilha 2026 localizada no Inep, mas PDF retornou 502; rubrica interna versionada sem certificação de aderência integral. Armazenamento das imagens adaptadas continua pendente para o final das tarefas.
