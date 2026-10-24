# Implementação — imagens adaptadas com revisão

Autorização: usuário aprovou todas as alterações do relatório de imagens. Executar nesta conversa, sem commit/push automático. Preservar consumidores existentes e testes.

## Contrato e tarefas

1. Domínio visual versionado: `versaoVisual: 2`, `planoVisual`, `visual` por questão (origem, metadados, histórico e aprovação por assinatura). Validação de distribuição de imagens obrigatórias, exatas e descrições. Desenho SVG determinístico para contagem/fração/gráfico/geometria, sem SVG arbitrário do usuário.
2. API de imagem v2: Google BYOK, referência real para editar, tamanho/proporção explícitos, timeout e validação de decodificação/dimensões. Sem fallback silencioso. Verificação multimodal separada sem aprovação automática. Chamadas legadas permanecem compatíveis, mas não certificam qualidade.
3. UI por questão: manter/adaptar/criar/upload, plano e descrição editáveis, comparar original/resultado, refazer, histórico, validar e aprovar/revogar. Cancelamento e lote com resumo. Estado imutável por ID; callbacks recebem documento atual. Contexto de estudante e série preservado.
4. Materiais originais: preservar foto/página selecionada de PDF em área própria do módulo; extração textual compartilhada inalterada. O professor associa recorte/página à questão e confere. Não sugerir detecção perfeita de figuras.
5. Recursos grandes em armazenamento de objetos autenticado e referência estável com hash; regras e falhas explícitas, sem sinalizar nuvem salva se upload falhar. Guardar rascunho por conta com aviso de quota.
6. Imagens e revisão em banco de questões, provas, impressão e Portal. Bloquear distribuição de figuras obrigatórias pendentes; aguardar decode antes de imprimir. Escala/resolução e descrição na prévia. Identidade do aluno e turma válidas ao publicar; soma exata das notas e dicas preservadas.
7. Testes novos antes do código; não editar testes existentes. Validar suíte completa, build, lint e prévia visual sintética. Documentar limitações de homologação real, armazenamento e modelos, sem alegar perfeição nem publicação em produção.

## Verificação

Testes de unidade do contrato e desenhos; API v2 com bytes inválidos, edição e erro sem troca de provedor; interface de geração/salvamento/regeração/revisão/impressão; regressões existentes de extratores e demais módulos; revisão de especificação e qualidade após execução.

## Revisões de integração

- Revisão de especificação identificou e corrigiu estado antigo no montador, plano de origem do histórico SVG, dados estruturados do gráfico, assinatura semântica independente da ordem de mapas, referência original e perfil.
- Revisão de qualidade identificou e corrigiu namespace de questões novas/clonadas, isolamento da árvore de edição por conta, identidade interna do aluno e restauração do plano da versão anterior.
- Testes novos reproduziram falhas antes das correções; nenhum teste preexistente foi editado. Evidências de auditoria anteriores em docs registram o estado anterior e não são critérios de aceite da implementação.
- A referência de PDF é página inteira selecionada explicitamente; figura exata pode ser enviada como imagem separada. Recorte automático não é anunciado.

## Verificação final de testes e interface

753 testes/151 arquivos aprovados. Lint: zero erros, três avisos de imagens dinâmicas. Diff-check limpo; testes preexistentes intactos. Prévia sintética do componente real conferida em 1280 e 375 px; sem rolagem horizontal no celular. Revisões de especificação e qualidade confirmaram correções dos achados reportados. Guia: `docs/guias/imagens-atividades-adaptadas.md`.

Build final de produção aprovado após reconstrução limpa do cache Turbopack; código de saída 0. O erro transitório de fontes foi resolvido sem alterar aplicação. Nenhuma gravação/publicação real foi feita.
