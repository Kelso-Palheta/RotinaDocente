# Sequência dos módulos no Hub

Solicitação de 04/11/2026: exibir os nove módulos nesta sequência, em todas as larguras e independentemente do acesso do usuário:

1. Meu Horário Escolar
2. Dashboard Analytics
3. Diário Pedagógico
4. Calendário Pedagógico
5. Gerador de Atividades
6. Atividades Adaptadas (DUA)
7. Agentes Pedagógicos IA
8. Redação Corrigida
9. Horário Inteligente

Alterar somente a ordem do catálogo compartilhado `frontend/src/config/modules.js`. Preservar IDs, nomes oficiais, ícones, descrições, caminhos, permissões, layout e cores. Módulos sem acesso continuam visíveis/bloqueados na posição correspondente. Não agrupar módulos pelo acesso.

Aceite HUB-ORDEM-01: contrato de ordem dos nove IDs em `tests/unit/hub_ordem_modulos.test.js`, com RED antes de reorganizar o catálogo. Verificar no diff que os objetos permanecem idênticos; o Dashboard já percorre o catálogo sem ordenar/filtrar por acesso.
