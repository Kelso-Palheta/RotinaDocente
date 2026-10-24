# Diário Pedagógico — RN-68

## Perceber
Auditoria aprovada identificou redefinição de critérios, limpeza ao carregar, chamada reaberta com quantidade errada, persistência sem confirmação, validação fraca de backup/números, ocorrências fora da Ficha e interface com alcances confusos.

## Decidir
Aplicar as recomendações no Diário, preservando contratos com os demais módulos e as alterações anteriores de calendário, feedback e aprovação semestral. Ano organiza a coleção canônica existente; sem mudança silenciosa de dados legados. Confirmar ações com prévias e promessas reais.

## Agir
Três frentes independentes (critérios/lançamento; frequência/Ficha; backup/exportação) integradas com fila transacional, contexto de ano, histórico/desfazer, visão geral e publicação por período. Revisão independente encontrou e reproduziu corridas de restauração/carregamento e callback atravessando conta; corrigidas no código com novos testes, sem alterar testes anteriores. Carga desmontada não altera cache de uma página posterior. Digest de publicação evita duplicar notas no documento.

## Verificar
Novos testes RED antes de cada implementação. Validação completa, build de produção, lint dos arquivos alterados e diff-check. Conferência visual de tela de notas, aprovação semestral, prévia de publicação e frequência com dados sintéticos; fixture temporária removida. PDFs sintéticos de Ficha com cinco páginas e relatório bimestral com dezesseis páginas inspecionados visualmente e sem caracteres fora dos limites. Nenhuma alteração de notas reais nem publicação em produção.

## Limites explícitos
Histórico local das últimas 20 alterações, não arquivo permanente entre dispositivos; cópia anterior local por conta; conflitos pedem baixar rascunho/recarregar e restaurar com revisão. Documento agregado canônico mantido por compatibilidade com atividades/calendário. Compartilhamento da Ficha não envia mensagens nem publica automaticamente.

Resultado final: **646 testes em 117 arquivos**, build de produção e diferenças sem erro de espaços aprovados. Lint sem erros; dois avisos preexistentes de imagens. A suíte completa passou com quatro workers, sem alterar timeout/asserções, após um timeout sob disputa de recursos com build na rodada preliminar.
