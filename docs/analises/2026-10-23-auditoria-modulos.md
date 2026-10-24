# Auditoria sequencial dos módulos

Objetivo: verificar um módulo por entrega, apresentar o que funciona, falhas comprovadas/limites de validação, melhorias de uso e novas implementações. Análise não autoriza implementação automática.

| Ordem | Módulo | Estado |
|---|---|---|
| Referência | Calendário Pedagógico | Analisado; evolução implementada localmente em tarefa anterior |
| 1 | Diário Pedagógico | Auditoria e melhorias autorizadas implementadas localmente; guia `docs/guias/diario-pedagogico.md` |
| 2 | Gerador de Atividades | Auditado; correções implementadas localmente. Guia `docs/guias/gerador-atividades.md`; novas funcionalidades continuam propostas |
| 3 | Atividades Adaptadas (DUA) | Auditado; imagens RN-72 implementadas localmente com guia `docs/guias/imagens-atividades-adaptadas.md`; demais propostas da auditoria geral permanecem pendentes |
| 4 | Portal do Aluno | Próximo |
| 5 | Redação Corrigida | Pendente |
| 6 | Meu Horário Escolar | Pendente |
| 7 | Horário Inteligente | Pendente; distinto do Meu Horário Escolar |
| 8 | Dashboard Analytics | Pendente |
| 9 | Agentes Pedagógicos IA | Pendente |
| Transversal | Conexão de IA, permissões e integração entre módulos | Consolidar ao fim, sem repetir achados já registrados |

Cada etapa considera o código local atual e preserva alterações das tarefas anteriores. A situação publicada em produção pode ser diferente até commit/push/deploy.
