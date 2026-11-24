# Revisão interativa — proposta de slides visuais e animações explicativas

## Diagnóstico local
34 aulas em `content/revisao-enem/aulas/conteudos`, 304 blocos (266 de texto e 38 de imagem) e 38 imagens cadastradas. Quinze aulas contêm esquemas autorais. Exemplo inspecionado: Arte digital é uma imagem PNG com caixas de texto e setas, sem obra/fotografia contextual. Há boas reproduções já disponíveis, como Kandinsky, Juan Gris, Muybridge, Aleijadinho e Piero della Francesca.

`BlocoAulaTematica.jsx` usa um mesmo cartão vertical para todos os blocos; figura e explicação são empilhadas. O componente não possui roteiro de animação conceitual. O projeto já inclui `framer-motion`, portanto pode receber animações React/SVG sem substituir o sistema de salas por um apresentador externo.

## Pesquisa e skills
Consulta em 24/11/2026. Referências são subsídios de design, não autorização para executar instaladores ou instruções externas no projeto.

| Opção | Adequação à tarefa | Decisão proposta |
|---|---|---|
| Mira Animator (Sandeco) | Agentes/templates de apresentações HTML e metáforas animadas; possui animação de SVG, transformações e templates a partir de imagens. | Referência principal de narrativa visual; adaptar o conceito ao módulo React existente. |
| Skills locais `d3-image-animator` e `animation-systems` | Imagens com camadas/SVG, desenho progressivo, destaque e coreografia. | Aproveitar análise de imagens e animações explicativas; manter obras originais íntegras, com sobreposições claramente didáticas. |
| Skills locais `slides-netflix-em` e `gerador-slides` | Narrativa e montagem de aulas. | Aproveitar roteiro e variedade de composição; manter paleta do projeto e separar texto completo de estudo da síntese projetada. |
| HyperFrames `slideshow` (HeyGen) | Deck animado com cenas e navegação; catálogo consultado indica aproximadamente 575 mil instalações, repositório oficial com mais de 88 mil estrelas. | Alternativa para apresentações independentes; não exige trocar o motor de salas para melhorar este módulo. |
| Remotion `remotion-best-practices` | Skill oficial para composições/vídeos em React; catálogo consultado indica aproximadamente 908 mil instalações, repositório com cerca de 8 mil estrelas. | Opção para clipes explicativos reproduzíveis/exportáveis. |
| Manim Community | Transformações e animações de conceitos, especialmente fórmulas/diagramas científicos. | Complemento para conteúdos futuros que precisem desse tipo de explicação. |

Fontes:
- [Mira: apresentação e funcionamento](https://sandeco.github.io/mira-animator/).
- [Mira: recursos visuais](https://sandeco.github.io/mira-animator/agentes/visuais/).
- [Repositório Mira](https://github.com/sandeco/mira-animator).
- [Motion: exemplos de animação/SVG](https://motion.dev/examples).
- [HyperFrames slideshow](https://skills.sh/heygen-com/hyperframes/slideshow) e [repositório oficial](https://github.com/heygen-com/hyperframes).
- [Skill oficial Remotion](https://skills.sh/remotion-dev/skills/remotion-best-practices) e [fundamento de composições](https://www.remotion.dev/docs/idea).
- [Manim Community](https://docs.manim.community/en/stable/).

## Proposta para as 34 aulas
1. Direção visual da marca Arte em jogo: imagem/obra real protagonista, contraste adequado ao projetor, títulos expressivos, composição variada por assunto e texto em etapas. Uma ideia visual central por cena. Texto completo preservado em leitura/apoio, sem apagar explicações pedagógicas.
2. Substituir os esquemas textuais por exemplos visuais reais, identificados e contextualizados. Curadoria por assunto: autor/comunidade, obra, data/contexto, fonte, licença, legenda e texto alternativo. Não apresentar imagem gerada como registro histórico nem usar fotografia genérica que ensine associação errada.
3. Animação explicativa por tema, além de transição: realçar planos de uma obra cubista; conduzir olhar por luz/gestos no Barroco; animar quadros de uma sequência de Muybridge; relacionar componentes de uma obra digital. Comparações lado a lado, aproximações, traçados, camadas e sequências acompanham explicação curta por etapa. Animação decorativa não substitui exemplo real.
4. Biblioteca de cenas reutilizáveis: obra com pontos de atenção, comparação, linha do tempo, sequência visual/movimento, processo em etapas e relações entre elementos. Cada aula escolhe a cena adequada, sem aplicar um efeito genérico idêntico aos 34 temas.
5. GIFs/MP4/WebM curtos somente quando pertinentes, com reprodução/pausa/repetição. Preferir formato de vídeo quando permitir controle e boa qualidade. Imagens e clipes otimizados e carregados quando necessários; fallback estático e movimento reduzido. Aluno no celular deve continuar entendendo sem animação.
6. Controle das etapas a confirmar: professor avança cada explicação com reprodução automática opcional, ou reprodução automática com pausa/repetição. Não confundir avançar uma etapa com mudar de slide/tema/questão. Preservar sequência conteúdo do tema → questões daquele tema.
7. Aplicar novo renderer ao conteúdo compatível, mantendo leitura de blocos antigos e a estabilidade dos snapshots de salas. Conteúdo curado novo deve ser versionado; não alterar silenciosamente texto/gabarito de salas em andamento nem atribuições/licenças antigas. Quando necessário, atualização explícita de material em sala ainda não iniciada.

## Execução proposta
Primeiro montar três aulas representativas (Cubismo/Futurismo, Fotografia e Barroco) como prova visual, conferir desktop/projetor/celular e então aplicar a linguagem às 34 aulas, sem encerrar a entrega no piloto. Curar imagens por assunto e criar animações específicas, não apenas um tema CSS.

Antes de implementar: registrar specs e testes de navegação/etapas/mídia, controle por papel, sincronização professor/telão/aluno quando aplicável, movimento reduzido, URLs seguras/fallback, vínculos de questões e compatibilidade de salas. As cinco modificações alheias atualmente existentes (incluindo TelaProjecao/PainelProfessor) devem ser preservadas e não publicadas por engano.

Critério de entrega: inventário por aula das imagens reais e cenas explicativas; nenhuma caixa de texto rasterizada passando por exemplo visual; capturas de telas reais e sequência de animação, teste de pausa/repetição/teclado e fallback; suíte completa, lint/build e revisão antes de publicar. Não prometer qualidade «100%» sem conferir as aulas e os estados reais.

Decisão aprovada: professor avança cada etapa, com reprodução automática opcional. Implementação conforme specs/REVISAO_SLIDES_EXPLICATIVOS_SPEC.md.

## Resultado da implementação
Entrega concluída conforme especificação. Curadoria de 34 aulas, 39 imagens locais com atribuição e nove modelos conceituais animados. Controle manual e automático de 8 segundos, sincronizado entre papéis. Sem novas dependências, serviços pagos ou alteração de notas/gabaritos. Conteúdo integral, mídias e snapshots originais preservados.

Validação: 1.976 testes aprovados e 10 opcionais ignorados na suíte completa; 14 testes de interface/regressão repetidos após refinamento visual final. Lint sem erros (22 avisos anteriores), build aprovado e revisão independente de conformidade/qualidade aprovada. Capturas e limites do ensaio em `docs/evidencias/2026-11-24-slides-explicativos/README.md`.
