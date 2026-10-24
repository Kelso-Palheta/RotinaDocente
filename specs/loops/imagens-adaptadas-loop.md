# RN-72 — Imagens adaptadas revisáveis

Data: 24/10/2026. Implementação local autorizada após análise aprofundada. Sem commit/push/deploy nesta tarefa.

## Perceber

Seis defeitos de imagens foram reproduzidos com dados sintéticos: salvamento desatualizado, regeneração mostrando versão antiga, prova sem figura, bytes inválidos tratados como imagem, perda de restrições no serviço alternativo e ausência de resolução mínima. Revisões adicionais encontraram concorrência, identidade, assinatura e histórico.

## Decidir

Separar manter/adaptar/criar, preservar referência selecionada, usar Gemini BYOK sem troca silenciosa e produzir desenhos exatos por dados. Validação técnica e revisão docente são controles distintos. Guardar recursos imutáveis por conta/SHA-256; manter estado pendente em falhas. Compatibilidade legada permanece separada da experiência v2.

## Agir

- Especificações RN-72, plano e guia atualizados antes/depois das respectivas fases.
- Testes novos falharam antes de cada correção relevante. Testes preexistentes não foram alterados.
- Domínio de qualidade/desenhos/assinaturas e identidade; API Google com referência e validação Sharp; parecer visual auxiliar; editor com original, histórico, revisão e aprovação; imagens no banco/prova/Portal; bloqueios e carregamento de impressão; rascunhos e isolamento por conta.
- Duas revisões independentes (especificação/qualidade) conferiram as correções dos achados e não identificaram bloqueadores remanescentes nesses pontos.

## Verificar

Suíte final: **753 testes aprovados em 151 arquivos**, incluindo regressões de outros módulos. Lint dos arquivos alterados: **zero erros**, três avisos de uso de img (recursos visuais dinâmicos originais/dados). Diff-check sem erros; nenhum teste preexistente editado.

Prévia do EditorVisualQuestao real renderizada com dados sintéticos e CSS de produção: conferida no navegador a 1280 px e a 375 px. Imagem carregada, sem rolagem horizontal no celular. Evidência: `docs/analises/evidencias-imagens-adaptadas/previa-editor.png`.

Build de produção passou em execuções anteriores; repetição após ajuste final encontrou cache interno inválido de fontes do Turbopack. Cache foi preservado em pasta temporária; a reconstrução limpa de produção terminou com sucesso (código de saída 0). Nenhuma alteração de aplicação foi necessária para resolver o cache.

## Limites de homologação

Não foram feitas gerações reais com a chave do professor, impressão física nem consulta de dados reais. Bucket Firebase Storage e regras precisam ser habilitados/implantados para salvar recursos v2; esse ambiente não foi alterado em produção. Referência PDF é página inteira selecionada pelo professor, não recorte automático. Não há garantia de perfeição ou certificação automática pela IA.
