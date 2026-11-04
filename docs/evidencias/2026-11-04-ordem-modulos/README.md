# Sequência dos módulos — Hub

04/11/2026. `hub-1440.png`: componente Dashboard real com autenticação sintética, sem conta real ou escrita em banco. Ordem conferida visualmente e na árvore de acessibilidade: Meu Horário Escolar, Dashboard Analytics, Diário Pedagógico, Calendário Pedagógico, Gerador de Atividades, Atividades Adaptadas, Agentes Pedagógicos, Redação Corrigida, Horário Inteligente. Os módulos bloqueados da conta sintética mantêm sua posição; permissões não foram alteradas.

Contrato `specs/HUB_ORDEM_SPEC.md`; teste `tests/unit/hub_ordem_modulos.test.js` falhou na sequência anterior antes da alteração. Comparação dos objetos do catálogo, desconsiderando somente a posição: todos os dados idênticos. Nenhum teste anterior modificado. A mudança de produção limita-se à ordem do array; o layout responsivo existente percorre esse mesmo catálogo em qualquer largura.

Validação da árvore publicável isolada: 1.147 testes / 251 arquivos aprovados; lint do catálogo sem erros/avisos; build de produção aprovado. Mudanças locais ainda pendentes de logout permaneceram fora desta entrega.
