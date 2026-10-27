# Auditoria sequencial dos módulos

Objetivo: verificar um módulo por entrega, apresentar o que funciona, falhas comprovadas/limites de validação, melhorias de uso e novas implementações. Análise não autoriza implementação automática.

| Ordem | Módulo | Estado |
|---|---|---|
| Referência | Calendário Pedagógico | Analisado; evolução implementada localmente em tarefa anterior |
| 1 | Diário Pedagógico | Auditoria e melhorias autorizadas implementadas localmente; guia `docs/guias/diario-pedagogico.md` |
| 2 | Gerador de Atividades | Auditado; correções implementadas localmente. Guia `docs/guias/gerador-atividades.md`; novas funcionalidades continuam propostas |
| 3 | Atividades Adaptadas (DUA) | Auditado; imagens RN-72 implementadas localmente com guia `docs/guias/imagens-atividades-adaptadas.md`; demais propostas da auditoria geral permanecem pendentes |
| 4 | Portal do Aluno | Auditado em `2026-10-27-portal-aluno.md`; sugestões e falhas documentadas, sem implementação |
| 5 | Redação Corrigida | Auditoria e melhorias RN-73 implementadas localmente; guia `docs/guias/redacao-corrigida.md`; validação concluída; commit/push autorizados |
| 6 | Meu Horário Escolar | Próximo |
| 7 | Horário Inteligente | Pendente; distinto do Meu Horário Escolar |
| 8 | Dashboard Analytics | Pendente |
| 9 | Agentes Pedagógicos IA | Pendente |
| Transversal | Conexão de IA, permissões e integração entre módulos | Consolidar ao fim, sem repetir achados já registrados |

Cada etapa considera o código local atual e preserva alterações das tarefas anteriores. A situação publicada em produção pode ser diferente até commit/push/deploy.

## Pendência para retomada

**Atividades Adaptadas — armazenamento de imagens:** terminar configuração, respeitando decisão de manter o plano Firebase atual. Provedor alternativo ainda não escolhido; não ativar Blaze sem autorização. Ver auditoria do Portal de 27/10/2026 e guia de imagens adaptadas.

**Lembrete combinado:** ao final das nossas tarefas, retomar e concluir a configuração do armazenamento das imagens de Atividades Adaptadas. Lembrete por etapa, sem data ou horário agendado.

**Novo lembrete:** adicionar atividades de recuperação semestral.
