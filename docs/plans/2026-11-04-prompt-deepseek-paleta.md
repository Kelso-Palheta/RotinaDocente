# Prompt pronto — paleta geral petróleo e sálvia

```text
Implemente a identidade petróleo e sálvia no projeto RotinaDocente.

O usuário aprovou a paleta e esclareceu: não mudar layout significa preservar ESTRUTURA, fontes e dimensões. TODAS as cores da interface própria devem mudar, com exceção das NOTAS. Não limitar a mudança aos botões ou ao globals.css.

Leia AGENTS.md, frontend/AGENTS.md, specs/RULES.md, specs/PRD.md, specs/TESTS_SPEC.md, specs/PALETA_PETROLEO_SALVIA_SPEC.md e os três documentos docs/plans/2026-11-04-paleta-petroleo-salvia{,-design,-inventario}.md (expanda o nome: são três arquivos).

Trabalhe em checkout isolado da base publicada 17ade59, ou base posterior conferida. O checkout atual contém logout não aprovado; não copie, resete, sobrescreva ou publique essas alterações. Verifique se já existe checkout apropriado antes de criar outro. Identifique o caminho usado no relatório para revisão.

Paleta: ações #0F766E; hover #0B5F59; títulos/escuros #123C3A; fundo #F3F7F5; apoio #DAEBE5; realce suave #F3F8F5; secundário #4F6B63; discreto #566F65; borda #D5E3DC; branco #FFFFFF para superfície/texto de contraste.

Inclua landing/autenticação/Hub, Diário, Portal, Atividades/Adaptadas, Agentes, Calendário, Horário, Redação e Analytics: fundos, gradientes, menus, cards, botões, textos, bordas, sombras, ícones, estados e modais. Converter valores fixos, RGB e Tailwind além dos tokens. Preservar tamanhos, espaçamentos, fontes Manrope/Inter, posição, DOM funcional, fluxos, lógica e dados. Pode usar aliases dos tokens antigos para reduzir risco. Atualize somente o trecho visual RN-50 que fixa a antiga marca; a aprovação nova substitui esses valores.

EXCEÇÃO OBRIGATÓRIA: todas as cores que representam notas/classificação permanecem iguais — vermelho abaixo da média, azul aprovado, verde excelente e neutro sem nota; isso inclui números, resumos, gráficos/legendas e competências de redação. Zero lançado, limites, médias e 25/25/50 não mudam. Não fazer substituição cega de blue/green/red. Preservar fotos/imagens didáticas e cores personalizadas salvas pelo usuário; nenhuma migração. Nos exportadores, apenas cores decorativas de marca, sem mudar paginação/dimensões/dados/cores de nota.

TDD: acrescente tests/unit/paleta_petroleo_salvia.test.js conforme spec, com contrato/contraste de tokens, execute RED real antes da produção e depois GREEN. Não alterar/apagar/afrouxar nenhum teste existente. Execute testes das notas, suíte completa, lint dos alterados e build. Sem dependência nova, chamada paga, Firestore, deploy ou build concorrente.

Conferência visual dos módulos em 390/1440, antes/depois com mesma estrutura e conteúdo. Inclua notas de todas as faixas e estados de interface. Inventário inicial tem 97 arquivos com cores antigas; não é substituição cega nem cobertura total. Registre exceções remanescentes por semântica. Entregue relatório com caminho do checkout, arquivos/diff, comandos/saídas, evidências, limites e qualquer falha. Sem commit/push/deploy: revisão/publicação serão feitas neste chat.
```
