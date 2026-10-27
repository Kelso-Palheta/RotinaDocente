# Implementação RN-73

Autorização: implementar sugestões da auditoria de Redação Corrigida.

1. Atualizar specs e criar testes novos (sem alterar existentes); executar vermelho.
2. Domínio/contratos e APIs: scores validados, parcial/anulação, extração por página, propriedade/publicação e projeção no Portal.
3. Histórico: retirar migração/claim global/exclusão destrutiva, filtros e métricas, revisão manual/publicação/arquivo e versões; evolução e PDF.
4. Criação: persistência compartilhada somente leitura, ID único, IDs de contexto, texto original e rascunho por conta; preservar resultados, salvar/repetir sem IA, publicação explícita.
5. Integrar, revisar specs e código; executar suíte completa, lint e build. Corrigir regressões sem modificar testes existentes.
6. Documentar guia/validação e relatar limites. Sem commit/push/deploy automático nesta solicitação.

Arquivos principais: frontend/src/app/redacao/**, lib/redacao/**, dominio/redacao/**, aplicacao/redacao/**, app/api/corrigir e app/api/aluno; testes novos em tests/.
