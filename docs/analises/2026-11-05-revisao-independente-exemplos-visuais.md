# Revisão independente dos exemplos visuais — 05/11/2026

## Entrega e inspeção

34 aulas com 38 recursos e 38 blocos de leitura guiada: 23 reproduções/registros e 15 esquemas autorais identificados. Arquivos de imagem somam aproximadamente 11,3 MB. Conteúdos, objetivos, catálogo, mapa de vínculos e questões originais continuam separados. Todos os conteúdos permanecem em rascunho, sem aprovação docente simulada.

Inspeção visual das 38 imagens em duas folhas de contato locais, com conferência de correspondência entre figura e identificação. Diagramas são mapas conceituais/esquemas, não reproduções atribuídas a artistas. A conferência factual por amostragem encontrou os problemas abaixo. Revisão técnica/visual não substitui a conferência pedagógica integral de cada aula pelo professor.

## Problemas corrigidos

1. **Identificação da Ceia:** a legenda colocava a obra de Ataíde na Igreja de São Francisco de Assis de Ouro Preto, sem data específica. Corrigida para *A Última Ceia*, 1828, Colégio do Caraça (MG); ajustado o comentário que inferia frequentadores de uma igreja a partir da localização errada. Fonte institucional: https://www.pbcm.org.br/documentos/221020-139B2r7tPJdtz.pdf .
2. **Obra e fotografia:** a imagem de Jonas de Aleijadinho estava declarada inteiramente em domínio público. A ficha distingue escultura e fotografia: esta é de **Martin Thurnherr, CC BY-SA 4.0**. Corrigidos crédito e licença, com links de autor, fonte e licença. O resumo `LicenseShortName` da API Commons dizia domínio público; a página completa registra a licença da fotografia. Não usar o resumo isolado para confundir esses direitos. Fonte: https://commons.wikimedia.org/wiki/File:Aleijadinho_Santuario_Jonas_01.jpg .
3. **Isadora Duncan:** preservada a identificação da gravura como John Sloan, 1915, corroborada pelo catálogo do MoMA; crédito distingue gravura e reprodução fotográfica arquivada na coleção Arnold Genthe/Library of Congress. Fonte de identificação: https://www.moma.org/collection/works/76370 ; origem do arquivo permanece a referência Commons entregue, sem trocar a imagem por reprodução do MoMA.
4. **Créditos descartados na apresentação:** DTO público do bloco não transportava `credito` nem links de atribuição. Agora expõe esses campos apenas para a imagem do bloco atual; legenda renderiza crédito e links HTTPS de fonte/autor/licença. Nada de caminho local, resposta ou imagem futura.
5. **Leitura de detalhes:** recurso de ampliação abre a própria imagem privada/autorizada em outra aba. Mantidos os limites de tamanho da aula; professor pode ampliar diagramas ou obras para examinar detalhes.

Os três cenários independentes novos de atribuição/legenda/renderização reproduziram RED antes das correções. Nenhum teste recebido foi modificado. Links e créditos foram consultados na API e nas páginas diretas Commons, respeitando a distinção acima. Não há parecer jurídico nem promessa de ausência de erro histórico.

## Validação

Suíte comum, cenários Firestore/SSE serializados em emulador, lint, build e inspeção do pacote serão confirmados antes da publicação. Evidências locais em `~/.codex/tmp/revisao-exemplos/`. Aulas alteradas/imagens otimizadas mudam o hash: a conferência anterior não libera automaticamente a versão nova. Pontuação, filtro por conteúdo e regras de notas permanecem inalterados.

Resultados finais: suíte comum **1.451 aprovados e dez condicionais**, grupo emulador **12 aprovados** (dez condicionais e dois comuns repetidos), regressão do verificador **dois aprovados**. Total: **1.463 cenários distintos validados**. Lint exit 0 (zero erros/onze avisos preexistentes), build exit 0. Pacote privado: 197 questões, 34 aulas, 398 arquivos; nenhuma credencial local ou texto privado de aula/ID de questão nos chunks clientes.

O verificador antigo confundiu o nome genérico de aula `fotografia`, presente no novo rótulo de atribuição, com vazamento. A regra agora verifica IDs específicos de questões e os textos privados reais de todos os blocos, também escapados; dois testes novos distinguem texto legítimo de exposição de material. Nenhuma regra de autenticação ou rastreamento de credenciais foi relaxada.
