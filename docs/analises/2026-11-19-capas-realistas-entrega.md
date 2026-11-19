# Capas realistas — Aula Gamificada

## Entrega

As sete capas do catálogo e das miniaturas de preparação de sala passaram a usar imagens, preservando as URLs existentes, a proporção 16:9, os botões e as regras dos jogos.

| Jogo | Imagem e origem |
| --- | --- |
| Heróis | Vingadores: fotografia já fornecida no acervo `frontend/public/aula-gamificada/herois/image1.jpeg`. |
| Tabuleiro | Minecraft: cenário `frontend/public/aula-gamificada/tabuleiro/fundo-tabuleiro.jpg` e personagens `capa-personagens.png`, já presentes no projeto. |
| Quiz | Palco de competição com botões e cronômetro. |
| Memória | Cartas físicas com pares de fotografias. |
| Associação | Duas colunas de imagens conectadas aos pares correspondentes. |
| Ordenação | Sequência visual do crescimento de um girassol. |
| Equipes | Dois grupos de estudantes em uma disputa de quiz. |

As últimas cinco cenas foram geradas com o `image_gen` integrado; são ilustrações com aparência fotográfica, não fotografias documentais. Prompts completos, caminhos originais e arquivos finais: [manifesto](2026-11-19-capas-realistas-prompts.json).

Os arquivos WebP selecionados estão em `docs/evidencias/2026-11-19-capas-realistas/`. As capas públicas estão em `frontend/public/aula-gamificada/catalogo/`, com WebP incorporado aos SVGs para preservar os endereços e não depender de serviços externos. Cada capa tem menos de 500 KB. Os originais gerados permanecem preservados.

## Verificação visual

As sete capas foram abertas no Chrome e inspecionadas em pranchas de conferência desktop e celular: `docs/evidencias/2026-11-19-capas-realistas/catalogo-desktop.png` e `catalogo-mobile.png`. Essa prancha mostra os arquivos finais renderizados pelo navegador; não é uma captura da interface autenticada nem uma alteração do layout dos cards.

## Validações

- TDD: novo teste falhou nas sete capas vetoriais antigas; passou após a substituição.
- Testes direcionados: 9 aprovados, incluindo os botões e as miniaturas existentes.
- Suíte integral: 382 arquivos aprovados e 4 ignorados; 1.750 testes aprovados e 10 ignorados.
- Lint: zero erros e 18 avisos preexistentes.
- Build de produção: aprovado.
- Validação realizada em cópia de publicação que exclui alterações paralelas de revisão ENEM e autenticação.

Nenhum teste existente foi alterado. Nenhuma mudança de regras de pontuação, avaliação, áudio, participação ou persistência faz parte desta entrega.
