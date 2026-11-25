# Reutilizar regular como versão gamificada

## Uso

No módulo Planejamento, card gamificado → **Reutilizar planejamento regular**. Também há **Gamificar este planejamento** nos cards regulares de Meus planejamentos.

Professor escolhe fonte salva, todas ou algumas etapas, formato e duração quando for aula. **Criar versão gamificada** salva outro plano e abre o editor. Conteúdos, objetivos, contexto e ordem das etapas são preservados, sem cortar textos longos. Turmas indisponíveis não são vinculadas à cópia. O original permanece intacto.

Versão derivada tem identidade/revisão próprias e origem registrada. Pode ser editada e reaberta independentemente de alterações posteriores no original. Criar do zero e jogos avulsos seguem disponíveis; nenhum jogo ou questão nasce automaticamente desta ação.

## Verificação

2066 testes aprovados, dez opcionais ignorados; 442 arquivos aprovados e quatro opcionais ignorados. Lint sem erros (22 avisos preexistentes), build de produção aprovado e revisão independente sem bloqueadores. Regressão específica cobre adaptação de uma ou duas etapas de período longo para aula de 10 minutos, com minutos inteiros e soma exata.

O navegador percorreu o módulo real com serviço real e armazenamento sintético isolado: recorte anual→aula, cópia em 10 minutos, edição/reabertura, texto integral, ausência de duplicação e original sem qualquer mudança. Telas em desktop/celular sem rolagem horizontal. Rotas temporárias removidas antes do build; nenhum dado real ou chave de IA usado.

## Capturas

- [Escolha da fonte](../evidencias/2026-11-25-reutilizar-planejamento/01-selecionar-original-desktop.png)
- [Etapas e formato](../evidencias/2026-11-25-reutilizar-planejamento/02-recorte-e-formato-desktop.png)
- [Nova versão](../evidencias/2026-11-25-reutilizar-planejamento/03-versao-gamificada-desktop.png)
- [Original e cópia](../evidencias/2026-11-25-reutilizar-planejamento/04-original-e-versao-desktop.png)
- [Origem no celular](../evidencias/2026-11-25-reutilizar-planejamento/05-origem-mobile.png)
- [Original preservado](../evidencias/2026-11-25-reutilizar-planejamento/06-original-preservado-mobile.png)

## Limites

Integração opcional direta do jogo avulso, slides e novos recursos do hub ficam para etapas posteriores. Esta entrega conecta os planejamentos; não publica atividades nem altera notas. O gerador de questões preserva o conteúdo extenso no plano e solicita um tema menor, de até 300 caracteres, para gerar questões dentro do contrato atual.
