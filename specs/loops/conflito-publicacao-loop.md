# RN-70 — Conflito após publicação

## Perceber

Imagens: envio concluído para 35 alunos; falha ao registrar publicação e edição bloqueada. Código comparava serializações cuja ordem de propriedades pode diferir sem alteração acadêmica.

## Decidir

Comparar conteúdo de mapas sem depender da ordem das chaves. Preservar ordem de arrays, valores distintos, revisão, existência e origem. Não remover a proteção de concorrência nem limpar rascunhos.

## Agir

Novos testes de comparação, gravações sucessivas com leitura reordenada, recuperação segura de conflito e aviso de sessão anterior. Falhas observadas antes da implementação. Comparação pura reutilizada no repositório, fila e aviso. Repetição de conflito revalida base contra a nuvem antes de salvar.

## Verificar

26 testes direcionados aprovados; regressões anteriores preservadas. Suíte completa, build e lint executados ao final; resultado final abaixo.

## Limites

Sem leitura/gravação de dados reais, publicação no Portal ou deploy. Um conflito causado por mudança real continua bloqueado. A recuperação exige a versão corrigida do aplicativo; as notas já publicadas não precisam ser reenviadas para salvar o registro pendente.

Resultado final: **704 testes aprovados em 134 arquivos**, build de produção aprovado e lint dos quatro arquivos alterados sem erros ou avisos. Nenhum teste anterior foi alterado.
