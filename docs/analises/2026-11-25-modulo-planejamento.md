# Módulo Planejamento independente

## Organização entregue

Card **Planejamento** no painel principal, com rota própria `/planejamento`. A tela organiza três áreas: Início, Meus planejamentos e Biblioteca de modelos.

Três caminhos permanecem independentes:

1. **Planejamento regular:** sem exigir jogo ou questões. Conteúdos, objetivos, etapas, contexto da turma, conhecimentos prévios, recursos, apoios, avaliação, habilidades informadas pelo professor e carga horária.
2. **Planejamento gamificado:** mesma base pedagógica, com escolha opcional de perguntas e preparação posterior de uma partida.
3. **Jogo avulso:** criação existente na Aula Gamificada sem planoId. Não passou a depender de planejamento.

Os formatos são aula, semanal, bimestral, semestral, anual, sequência didática e projeto. Planos de aula usam minutos; períodos longos usam prazos descritivos, sem tratar um ano ou semestre como aula de 50 minutos. Os modelos de período podem ser editados e ampliados até 24 etapas.

## Biblioteca e materiais

Cem referências em dez categorias, com busca, filtro e paginação. Foram incorporados títulos, fontes e sínteses autorais do catálogo já registrado na pasta de coleta, critérios compartilhados de qualidade e contexto pedagógico. Os modelos preenchem estruturas editáveis; não são cem aulas completas nem reprodução integral dos comandos originais.

Há também roteiros de Operação de Resgate, Desafio dos Guardiões e Jornada do Especialista, associados a experiências compatíveis existentes. A biblioteca inicia um rascunho; o professor contextualiza e revisa antes de salvar ou conduzir a aula. Não são inventadas habilidades oficiais da BNCC.

## Persistência e integração

Mesma infraestrutura privada de planos, sem cadastros duplicados. Preservados revisão, idempotência, limite por conta, autenticação e isolamento. Planos antigos sem tipo/escala continuam gamificados de aula.

Plano gamificado salvo pode abrir geração ou preparação na Aula Gamificada por referência privada. O destino relê o plano da conta atual; plano regular ou ID de outra conta não preenche uma partida. Resposta tardia após troca de conta é descartada.

O acesso rápido anterior continua usando editor e serviço compartilhados, com entrada para o módulo central. Salvar planejamento não publica atividades nem altera notas. Questões para revisão em casa continuam sendo liberadas pelos controles existentes.

## Edição e impressão

Navegação entre áreas solicita salvar ou descartar alterações antes de trocar. Falhas de envio e conflitos mantêm o tratamento seguro existente. Impressão/salvamento em PDF usa uma versão limpa com contexto e etapas, sem botões ou campos do editor.

## Evidências

Componentes reais, serviço real com armazenamento sintético em ambiente local isolado. Sem alunos reais ou chaves de IA. O percurso confirmou plano anual regular salvo sem modalidade, perguntas ou minutos fictícios; reabertura após recarga; impressão sem controles; biblioteca e interface móvel sem rolagem horizontal.

- [Início desktop](../evidencias/2026-11-25-modulo-planejamento/01-inicio-desktop.png)
- [Plano anual](../evidencias/2026-11-25-modulo-planejamento/02-regular-anual-desktop.png)
- [Etapas por período](../evidencias/2026-11-25-modulo-planejamento/03-periodos-anual-desktop.png)
- [Impressão limpa](../evidencias/2026-11-25-modulo-planejamento/04-impressao-limpa.png)
- [Regular no celular](../evidencias/2026-11-25-modulo-planejamento/05-regular-mobile.png)
- [Gamificado no celular](../evidencias/2026-11-25-modulo-planejamento/06-gamificado-mobile.png)
- [Biblioteca no celular](../evidencias/2026-11-25-modulo-planejamento/07-biblioteca-mobile.png)
- [Biblioteca desktop](../evidencias/2026-11-25-modulo-planejamento/08-biblioteca-desktop.png)

## Verificação

Suíte isolada: 2046 testes aprovados, dez opcionais ignorados; 435 arquivos aprovados e quatro opcionais ignorados. Revisão independente: 48 testes em nove arquivos, sem bloqueadores. Nenhum teste existente foi alterado. Rotas temporárias de evidências removidas antes do build final.

## Limites

Modelos e referências orientam o planejamento editável; esta entrega não gera automaticamente um documento completo por IA, calendário escolar ou novo motor de jogo. A infraestrutura de geração de questões, execução e avaliação permanece existente.

Verificação final: lint sem erros (22 avisos preexistentes) e build de produção aprovados. Acrescentado teste de regressão para criar novo planejamento e restaurar corretamente sua base ao descartar edições.
