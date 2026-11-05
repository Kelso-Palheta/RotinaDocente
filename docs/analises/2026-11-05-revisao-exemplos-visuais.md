# Revisão temática do ENEM — exemplos visuais comentados

**Data:** 05/11/2026
**Frente:** Arte — 34 aulas temáticas
**Escopo:** `content/revisao-enem/aulas/`
**Status:** entrega técnica concluída; aprovação pedagógica pendente.

## 1. Resultado

- 34 de 34 aulas com ao menos uma imagem local e um bloco de leitura guiada.
- 38 imagens: 23 obras/reproduções e 15 esquemas autorais.
- 4 aulas com duas imagens: `tradicao-academica`, `barroco-brasileiro`, `cubismo-futurismo` e `dada-surrealismo`.
- 38 arquivos no diretório, todos referenciados; nenhum órfão e nenhuma duplicata de hash.
- 304 blocos no total; nenhuma aula passa de 12 blocos.
- Todas as aulas permanecem com `status: "rascunho"` e sem campos de gabarito/resolução.

## 2. Método

1. Criação do teste `tests/contract/revisao_tematico_exemplos_visuais.test.js` antes da implementação.
2. RED inicial com 38 problemas: 32 aulas sem imagem e 6 pendências nas duas aulas que já tinham imagem (`impressionismo` e `fotografia`: resolução, crédito e pergunta de observação). O segundo teste também falhava porque havia apenas 2 arquivos no diretório de imagens, abaixo do mínimo de 34.
3. Seleção de obras com fonte específica, direitos verificados e legibilidade; quando não havia obra adequada, produção de esquema autoral.
4. Inspeção visual de todos os 38 arquivos: 23 obras (8 individualmente e 15 em folha de contato) e 15 esquemas (individualmente).
5. Inserção em quatro lotes de até oito aulas, com textos específicos, pergunta de observação e vínculo a objetivos existentes.
6. GREEN: teste novo e os quatro contratos existentes aprovados.

## 3. Validação técnica

Comando executado a partir de `frontend/`:

```bash
npx vitest run ../tests/contract/revisao_tematico_exemplos_visuais.test.js \
  ../tests/contract/revisao_tematico_acervo.test.js \
  ../tests/contract/revisao_tematico_servidor.test.js \
  ../tests/contract/revisao_tematico_integridade.test.js --maxWorkers=1
```

**Resultado:** 4 arquivos, 9 testes, todos aprovados (1,85 s).

O teste novo verifica: cobertura das 34 aulas; bloco de imagem com leitura de pelo menos 320 caracteres, pergunta e verbo de observação; arquivo local com MIME coerente, entre 5 KB e 7 MB e resolução mínima de 800×500; `alt` com pelo menos 40 caracteres, `legenda` com 25, `credito` com 3, `licenca` com 20 e `fonteUrl` HTTPS específica; ausência de reutilização de imagens de questão; ausência de órfãos; status `rascunho`; ausência de campos de gabarito.

## 4. Revisão visual

- Todas as imagens foram abertas e conferidas quanto a enquadramento, legibilidade, coerência com a legenda e adequação ao bloco.
- Os 15 esquemas foram revisados individualmente quanto a texto cortado, sobreposição, contraste e legibilidade em 1600×1000.
- Nas obras, a revisão confirmou: Piero della Francesca (apenas o painel de Battista Sforza), El Greco, Aleijadinho, Ataíde, Sisley, Munch, Kandinsky, Eckhout (mulher africana com criança), Juan Gris, Boccioni, cartaz do Cabaret Voltaire, Arcimboldo, Muybridge, xilogravura de Lucélia Borges, gravura de Anthonie de Winter após Callot, frevo em Olinda, gravura de John Sloan com Isadora Duncan, kalimba, Almeida Júnior, azulejos de São Luís, Chartres, Alvorada e Hasegawa.
- **Isadora Duncan:** a ficha da Commons/Library of Congress registra Genthe como fotógrafo, mas a imagem é assinada “John Sloan 1915” e é uma água-forte representando Duncan. A legenda adota John Sloan e a fonte é a reprodução da Library of Congress. A divergência fica registrada como risco de catalogação.
- **Eckhout:** a obra foi identificada como “Mulher africana com criança”, não como a mulher Tapuia do arquivo homônimo do Wikimedia Commons.
- **Teatro:** a gravura é de Anthonie de Winter a partir de Jacques Callot (1668–1707), não uma impressão original de Callot.
- **Cordel:** a xilogravura de Lucélia Borges é capa do cordel “Os Encantados tabajaras”, de Auritha Tabajara (2018), CC BY-SA 4.0.
- **Esquemas:** são autorais, não reproduzem obras e não atribuem padrões inventados a povos ou artistas; quando usam referência conceitual (Tate, Wikipédia, FUNAI), isso está declarado no crédito e na legenda.

## 5. Tabela aula a aula

| Aula | Imagem | Tipo | Blocos | Técnica | Visual | Pedagógica |
|---|---|---|---|---|---|---|
| `tradicao-academica`<br><small>Tradição acadêmica: Renascimento, Maneirismo, Neoclassicismo e Realismo</small> | `tradicao-academica-piero-duques.jpg`<br><small>Piero della Francesca, Retrato de Battista Sforza (painel do díptico dos duques de Urbino), c. 1467-1472, têmpera sobre madeira, Galleria degli Uffizi.</small> | Obra | 10 (2 imagens) | OK | Conferida (folha de contato) | Pendente |
| `tradicao-academica`<br><small>Tradição acadêmica: Renascimento, Maneirismo, Neoclassicismo e Realismo</small> | `tradicao-academica-el-greco-laocoonte.jpg`<br><small>El Greco, Laocoonte, c. 1610-1614, óleo sobre tela, National Gallery of Art, Washington.</small> | Obra | 10 (2 imagens) | OK | Conferida (folha de contato) | Pendente |
| `barroco-brasileiro`<br><small>Barroco e rococó no Brasil: fé, mineração e mãos locais</small> | `barroco-brasileiro-aleijadinho-jonas.jpg`<br><small>Aleijadinho e oficina, Profeta Jonas, 1800-1805, pedra-sabão, Santuário do Bom Jesus de Matosinhos, Congonhas (MG).</small> | Obra | 9 (2 imagens) | OK | Conferida (folha de contato) | Pendente |
| `barroco-brasileiro`<br><small>Barroco e rococó no Brasil: fé, mineração e mãos locais</small> | `barroco-brasileiro-ataide-ceia.jpg`<br><small>Manuel da Costa Ataíde, A Última Ceia, séculos XVIII-XIX, Igreja de São Francisco de Assis, Ouro Preto (MG).</small> | Obra | 9 (2 imagens) | OK | Conferida (folha de contato) | Pendente |
| `impressionismo`<br><small>Impressionismo: luz, instante e a pintura ao ar livre</small> | `impressionismo-sisley-estrada-versalhes.jpg`<br><small>Alfred Sisley, A estrada de Versalhes a Louveciennes, provavelmente 1879, óleo sobre tela, The Metropolitan Museum of Art.</small> | Obra | 7 (1 imagem) | OK | Conferida (folha de contato) | Pendente |
| `expressionismo-figurativismo`<br><small>Expressionismo e figuração: o corpo que resiste ao ideal</small> | `expressionismo-figurativismo-munch-o-grito.jpg`<br><small>Edvard Munch, O Grito, 1893, óleo, têmpera e pastel sobre cartão, Galeria Nacional da Noruega, Oslo.</small> | Obra | 9 (1 imagem) | OK | Conferida (folha de contato) | Pendente |
| `modernismo-brasileiro`<br><small>Modernismo brasileiro: ruptura, identidade e disputa cultural</small> | `modernismo-brasileiro-esquema-rupturas.png`<br><small>Esquema autoral sobre o modernismo brasileiro: linha do tempo de 1922 a 1930, com revistas, manifestos e disputas de identidade.</small> | Esquema autoral | 8 (1 imagem) | OK | Conferida (individual) | Pendente |
| `forma-abstracao`<br><small>Forma e abstração: da ruptura à experiência do espaço</small> | `forma-abstracao-kandinsky-composicao-vii.jpg`<br><small>Wassily Kandinsky, Composição VII, 1913, óleo sobre tela, Galeria Tretyakov, Moscou.</small> | Obra | 8 (1 imagem) | OK | Conferida (folha de contato) | Pendente |
| `imagem-colonizacao-retrato`<br><small>Imagem, colonização e retrato: quem tem direito a ser visto</small> | `imagem-colonizacao-retrato-eckhout-mulher-africana.jpg`<br><small>Albert Eckhout, Mulher africana com criança, 1641, óleo sobre tela, Nationalmuseet, Copenhague.</small> | Obra | 8 (1 imagem) | OK | Conferida (folha de contato) | Pendente |
| `cubismo-futurismo`<br><small>Cubismo e futurismo: espaço partido, tempo acelerado</small> | `cubismo-futurismo-juan-gris-janela.jpg`<br><small>Juan Gris, Natureza-morta diante de uma janela aberta, Place Ravignan, 1915, óleo sobre tela, Philadelphia Museum of Art.</small> | Obra | 10 (2 imagens) | OK | Conferida (folha de contato) | Pendente |
| `cubismo-futurismo`<br><small>Cubismo e futurismo: espaço partido, tempo acelerado</small> | `cubismo-futurismo-boccioni-futebol.jpg`<br><small>Umberto Boccioni, Dinamismo de um jogador de futebol, 1913, óleo sobre tela, Museum of Modern Art, Nova York.</small> | Obra | 10 (2 imagens) | OK | Conferida (folha de contato) | Pendente |
| `dada-surrealismo`<br><small>Dada e surrealismo: o acaso, o sonho e a crise da razão</small> | `dada-surrealismo-cabaret-voltaire-cartaz.jpg`<br><small>Marcel Słodki, cartaz do Cabaret Voltaire, 1916, linoleogravura, Zurique.</small> | Obra | 9 (2 imagens) | OK | Conferida (folha de contato) | Pendente |
| `dada-surrealismo`<br><small>Dada e surrealismo: o acaso, o sonho e a crise da razão</small> | `dada-surrealismo-esquema-procedimentos.png`<br><small>Esquema autoral sobre procedimentos surrealistas: escrita automática, cadáver esquisito, colagem, frottage e objeto surrealista.</small> | Esquema autoral | 9 (2 imagens) | OK | Conferida (individual) | Pendente |
| `pop-art-apropriacao`<br><small>Pop Art e apropriação: a arte olha para a vitrine</small> | `pop-art-apropriacao-arcimboldo-vertumno.jpg`<br><small>Giuseppe Arcimboldo, Rodolfo II como Vertumno, 1591, óleo sobre madeira, Castelo de Skokloster, Suécia.</small> | Obra | 10 (1 imagem) | OK | Conferida (folha de contato) | Pendente |
| `ready-made-conceitual`<br><small>Ready-made e arte conceitual: a ideia está no lugar do objeto</small> | `ready-made-conceitual-esquema-deslocamento.png`<br><small>Esquema autoral sobre o ready-made: objeto comum, deslocamento, contexto e ideia, com pergunta de observação ao final.</small> | Esquema autoral | 9 (1 imagem) | OK | Conferida (individual) | Pendente |
| `performance-participacao`<br><small>Performance e participação: o corpo, o tempo e o público</small> | `performance-participacao-esquema-circuito.png`<br><small>Esquema autoral sobre performance: corpo, ação, público e registro em circuito, com o tempo irrepetível no centro.</small> | Esquema autoral | 8 (1 imagem) | OK | Conferida (individual) | Pendente |
| `instalacao-materiais`<br><small>Instalação e materiais: organizar o espaço, provocar o corpo</small> | `instalacao-materiais-esquema-planta.png`<br><small>Esquema autoral sobre instalação: planta de sala, objetos, percurso do visitante e categorias de leitura espacial.</small> | Esquema autoral | 9 (1 imagem) | OK | Conferida (individual) | Pendente |
| `arte-digital-tecnologia`<br><small>Arte digital e tecnologia: autoria, acesso e novas linguagens</small> | `arte-digital-tecnologia-esquema-camadas.png`<br><small>Esquema autoral sobre arte digital: camadas de interface, código, rede, arquivo e IA, com questões de autoria e preservação.</small> | Esquema autoral | 9 (1 imagem) | OK | Conferida (individual) | Pendente |
| `arte-urbana-publica`<br><small>Arte urbana e espaço público: a cidade como suporte</small> | `arte-urbana-publica-esquema-muro.png`<br><small>Esquema autoral sobre arte urbana: muro com grafite, stencil, cartaz e pichação, e categorias de leitura do espaço público.</small> | Esquema autoral | 11 (1 imagem) | OK | Conferida (individual) | Pendente |
| `fotografia`<br><small>Fotografia: técnica, movimento e olhar</small> | `fotografia-muybridge-cavalos.jpg`<br><small>Eadweard Muybridge, Animal Locomotion, volume IX, cavalos, 1887, fotogravura, The Metropolitan Museum of Art.</small> | Obra | 8 (1 imagem) | OK | Conferida (folha de contato) | Pendente |
| `artes-graficas`<br><small>Artes gráficas: gravura, ilustração e narrativa visual</small> | `artes-graficas-xilogravura-lucelia-borges.jpg`<br><small>Lucélia Borges, xilogravura para o cordel Os Encantados tabajaras, de Auritha Tabajara, 2018, Sesc Folhetim.</small> | Obra | 11 (1 imagem) | OK | Conferida (folha de contato) | Pendente |
| `comunicacao-visual-audiovisual`<br><small>Comunicação visual e audiovisual: linguagem, design e recepção</small> | `comunicacao-visual-audiovisual-esquema-montagem.png`<br><small>Esquema autoral sobre linguagem audiovisual: tipos de plano, fora de campo, montagem e cadeia de produção.</small> | Esquema autoral | 8 (1 imagem) | OK | Conferida (individual) | Pendente |
| `teatro-dramaturgia`<br><small>Teatro e dramaturgia: texto, rubrica e encenação</small> | `teatro-dramaturgia-callot-commedia.jpg`<br><small>Anthonie de Winter, a partir de Jacques Callot, Fricasso, Mezzetino e Franca Trippa, série Personagens da commedia dell’arte, 1668-1707, gravura, Rijksmuseum.</small> | Obra | 8 (1 imagem) | OK | Conferida (folha de contato) | Pendente |
| `teatro-moderno-contemporaneo`<br><small>Teatro moderno e contemporâneo: rupturas, espaço e interculturalidade</small> | `teatro-moderno-contemporaneo-esquema-palcos.png`<br><small>Esquema autoral sobre teatro moderno: palco italiano, arena/rua e os efeitos da mudança espacial.</small> | Esquema autoral | 10 (1 imagem) | OK | Conferida (individual) | Pendente |
| `teatro-educacao`<br><small>Teatro e educação: jogos, improvisação e transformação</small> | `teatro-educacao-esquema-jogo.png`<br><small>Esquema autoral sobre teatro-educação: ciclo de jogo, improvisação, reflexão e cena, com princípios do processo.</small> | Esquema autoral | 8 (1 imagem) | OK | Conferida (individual) | Pendente |
| `dancas-populares`<br><small>Danças populares: comunidade, festa e patrimônio</small> | `dancas-populares-frevo-olinda.jpg`<br><small>Passistas de frevo durante o carnaval em Olinda (PE), 2009; foto: Prefeitura de Olinda.</small> | Obra | 9 (1 imagem) | OK | Conferida (individual) | Pendente |
| `danca-moderna-contemporanea`<br><small>Dança moderna e contemporânea: corpo, presença e hibridismo</small> | `danca-moderna-contemporanea-isadora-duncan.jpg`<br><small>John Sloan, Isadora Duncan, 1915, água-forte; reprodução fotográfica da Library of Congress.</small> | Obra | 8 (1 imagem) | OK | Conferida (individual) | Pendente |
| `matrizes-africanas-musica`<br><small>Matrizes africanas na música brasileira: ritmo, diáspora e invenção</small> | `matrizes-africanas-musica-kalimba.jpg`<br><small>Kalimba (lamelofone) com ressonador de cabaça, acervo do Museu Real da África Central, Tervuren.</small> | Obra | 8 (1 imagem) | OK | Conferida (individual) | Pendente |
| `musica-popular-regional`<br><small>Música popular regional: ritmos, instrumentos e circulação</small> | `musica-popular-regional-almeida-junior-violeiro.jpg`<br><small>Almeida Júnior, O Violeiro, 1899, óleo sobre tela, Pinacoteca do Estado de São Paulo.</small> | Obra | 11 (1 imagem) | OK | Conferida (individual) | Pendente |
| `musica-erudita-popular`<br><small>Música erudita e popular: hierarquias, arranjos e escuta</small> | `musica-erudita-popular-esquema-fronteira.png`<br><small>Esquema autoral sobre a fronteira entre música erudita e popular, com zona de contato e procedimentos partilhados.</small> | Esquema autoral | 11 (1 imagem) | OK | Conferida (individual) | Pendente |
| `rock-tropicalismo-festivais`<br><small>Rock, tropicalismo e festivais: a música como arena política</small> | `rock-tropicalismo-festivais-esquema-arena.png`<br><small>Esquema autoral sobre rock, tropicalismo e festivais: linha do tempo de 1965 a 1980 e faixas de contexto.</small> | Esquema autoral | 8 (1 imagem) | OK | Conferida (individual) | Pendente |
| `hip-hop-rap-slam`<br><small>Hip-hop, rap e slam: voz periférica e afirmação de identidade</small> | `hip-hop-rap-slam-esquema-quatro-elementos.png`<br><small>Esquema autoral sobre hip-hop: quatro elementos, periferia, cidade, slam e sampling.</small> | Esquema autoral | 9 (1 imagem) | OK | Conferida (individual) | Pendente |
| `culturas-populares-patrimonio`<br><small>Culturas populares e patrimônio: saberes, festas e mercado</small> | `culturas-populares-patrimonio-azulejos-sao-luis.jpg`<br><small>Azulejos do centro histórico de São Luís (MA), 2024; foto: Thuaia.</small> | Obra | 11 (1 imagem) | OK | Conferida (individual) | Pendente |
| `artes-indigenas`<br><small>Artes indígenas: grafismos, cosmologia e contemporaneidade</small> | `artes-indigenas-esquema-pluralidade.png`<br><small>Esquema autoral sobre artes indígenas: grafismo, cosmologia, corpo/objeto e contemporaneidade, sem reproduzir padrões específicos.</small> | Esquema autoral | 8 (1 imagem) | OK | Conferida (individual) | Pendente |
| `arte-afro-brasileira`<br><small>Arte afro-brasileira: memória, resistência e invenção</small> | `arte-afro-brasileira-esquema-matrizes.png`<br><small>Esquema autoral sobre arte afro-brasileira: matrizes, memória, resistência, invenção e suportes.</small> | Esquema autoral | 9 (1 imagem) | OK | Conferida (individual) | Pendente |
| `arte-sociedade-sistema`<br><small>Arte e sociedade: mercado, censura e função social</small> | `arte-sociedade-sistema-chartres-fachada.jpg`<br><small>Catedral de Chartres, fachada ocidental, França; foto: Dcconsta, 2013.</small> | Obra | 9 (1 imagem) | OK | Conferida (individual) | Pendente |
| `arquitetura-design`<br><small>Arquitetura e design: forma, estrutura e identidade</small> | `arquitetura-design-alvorada.jpg`<br><small>Palácio da Alvorada, Brasília (DF), projeto de Oscar Niemeyer; foto: Arne Müseler, 2022.</small> | Obra | 8 (1 imagem) | OK | Conferida (individual) | Pendente |
| `arte-asiatica`<br><small>Arte asiática: zen, porcelana e circulação global</small> | `arte-asiatica-hasegawa-pinheiros.jpg`<br><small>Hasegawa Tohaku, Floresta de pinheiros (tela esquerda), século XVI, nanquim sobre papel, Museu Nacional de Tóquio.</small> | Obra | 8 (1 imagem) | OK | Conferida (individual) | Pendente |

## 6. Inventário das 38 imagens

| Arquivo | Tipo | Licença | Fonte |
|---|---|---|---|
| `tradicao-academica-piero-duques.jpg` | Obra | Domínio público — obra de Piero della Francesca; reprodução em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Piero_della_Francesca_-_Portraits_of_the_Duke_and_Duchess_of_Urbino,_Federico_da_Montefeltro_and_Battista_Sforza_-_Google_Art_Project.jpg) |
| `tradicao-academica-el-greco-laocoonte.jpg` | Obra | Domínio público — obra de El Greco; reprodução em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:El_Greco_(Domenikos_Theotokopoulos)_-_Laoco%C3%B6n_-_Google_Art_Project.jpg) |
| `barroco-brasileiro-aleijadinho-jonas.jpg` | Obra | Domínio público — escultura e fotografia em domínio público, conforme Wikimedia Commons. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Aleijadinho_Santuario_Jonas_01.jpg) |
| `barroco-brasileiro-ataide-ceia.jpg` | Obra | Domínio público — pintura e fotografia em domínio público, conforme Wikimedia Commons. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ceia_mestre_ataide.JPG) |
| `impressionismo-sisley-estrada-versalhes.jpg` | Obra | Domínio público — The Met Open Access. | [The Met](https://www.metmuseum.org/art/collection/search/437685) |
| `expressionismo-figurativismo-munch-o-grito.jpg` | Obra | Domínio público — obra de Edvard Munch; reprodução em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Edvard_Munch,_1893,_The_Scream,_oil,_tempera_and_pastel_on_cardboard,_91_x_73_cm,_National_Gallery_of_Norway.jpg) |
| `modernismo-brasileiro-esquema-rupturas.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Wikipédia (referência conceitual)](https://pt.wikipedia.org/wiki/Semana_de_Arte_Moderna) |
| `forma-abstracao-kandinsky-composicao-vii.jpg` | Obra | Domínio público — obra de Wassily Kandinsky; reprodução em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Composition_VII_-_Wassily_Kandinsky,_GAC.jpg) |
| `imagem-colonizacao-retrato-eckhout-mulher-africana.jpg` | Obra | CC BY 4.0 — reprodução do Nationalmuseet via Wikimedia Commons; obra histórica em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:African_woman_and_child,_1641,_Albert_Eckhout.jpg) |
| `cubismo-futurismo-juan-gris-janela.jpg` | Obra | Domínio público — obra de Juan Gris; reprodução em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Juan_Gris_(Jos%C3%A9_Victoriano_Gonz%C3%A1lez_P%C3%A9rez),_Spanish_-_Still_Life_before_an_Open_Window,_Place_Ravignan_-_Google_Art_Project.jpg) |
| `cubismo-futurismo-boccioni-futebol.jpg` | Obra | Domínio público — obra de Umberto Boccioni; reprodução em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Umberto_boccioni-dynamism_of_a_soccer_player-1913.jpg) |
| `dada-surrealismo-cabaret-voltaire-cartaz.jpg` | Obra | Domínio público — cartaz de Marcel Słodki; reprodução em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:1916_Marcel_S%C5%82odki_Cabaret-Voltaire.jpg) |
| `dada-surrealismo-esquema-procedimentos.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Tate (referência conceitual)](https://www.tate.org.uk/art/art-terms/s/surrealism) |
| `pop-art-apropriacao-arcimboldo-vertumno.jpg` | Obra | Domínio público — obra de Giuseppe Arcimboldo; reprodução em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Giuseppe_Arcimboldo_-_Rudolf_II_of_Habsburg_as_Vertumnus_-_Google_Art_Project.jpg) |
| `ready-made-conceitual-esquema-deslocamento.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Tate (referência conceitual)](https://www.tate.org.uk/art/art-terms/r/readymade) |
| `performance-participacao-esquema-circuito.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Tate (referência conceitual)](https://www.tate.org.uk/art/art-terms/p/performance-art) |
| `instalacao-materiais-esquema-planta.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Tate (referência conceitual)](https://www.tate.org.uk/art/art-terms/i/installation-art) |
| `arte-digital-tecnologia-esquema-camadas.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Tate (referência conceitual)](https://www.tate.org.uk/art/art-terms/d/digital-art) |
| `arte-urbana-publica-esquema-muro.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Tate (referência conceitual)](https://www.tate.org.uk/art/art-terms/s/street-art) |
| `fotografia-muybridge-cavalos.jpg` | Obra | Domínio público — The Met Open Access. | [The Met](https://www.metmuseum.org/art/collection/search/266439) |
| `artes-graficas-xilogravura-lucelia-borges.jpg` | Obra | CC BY-SA 4.0 — xilogravura de Lucélia Borges, via Wikimedia Commons. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Xilogravura_Luc%C3%A9lia_Borges.webp) |
| `comunicacao-visual-audiovisual-esquema-montagem.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Wikipédia (referência conceitual)](https://pt.wikipedia.org/wiki/Montagem) |
| `teatro-dramaturgia-callot-commedia.jpg` | Obra | CC0 — imagem disponibilizada pelo Rijksmuseum em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Fricasso,_Mezzetino_en_Franca_Trippa_Fricasso_Metzetin_Franca_Trippa_(titel_op_object)_Personages_uit_de_commedia_dell%27arte_(serietitel),_RP-P-1903-A-24054EX.jpg) |
| `teatro-moderno-contemporaneo-esquema-palcos.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Wikipédia (referência conceitual)](https://pt.wikipedia.org/wiki/Teatro) |
| `teatro-educacao-esquema-jogo.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Wikipédia (referência conceitual)](https://pt.wikipedia.org/wiki/Teatro_do_Oprimido) |
| `dancas-populares-frevo-olinda.jpg` | Obra | CC BY 2.0 — foto da Prefeitura de Olinda, via Wikimedia Commons. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Frevo_dancers_-_Olinda,_Pernambuco,_Brazil.jpg) |
| `danca-moderna-contemporanea-isadora-duncan.jpg` | Obra | Domínio público — obra de John Sloan; reprodução da Library of Congress em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Isadora_Duncan,_1878-1927_LCCN2002715687.jpg) |
| `matrizes-africanas-musica-kalimba.jpg` | Obra | CC0 — foto de Daderot, via Wikimedia Commons; objeto de acervo museológico. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Kalimba_-_Royal_Museum_for_Central_Africa_-_DSC07093.JPG) |
| `musica-popular-regional-almeida-junior-violeiro.jpg` | Obra | Domínio público — obra de Almeida Júnior; reprodução em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Almeida_J%C3%BAnior_-_O_Violeiro_(1899).jpg) |
| `musica-erudita-popular-esquema-fronteira.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Wikipédia (referência conceitual)](https://pt.wikipedia.org/wiki/M%C3%BAsica_erudita) |
| `rock-tropicalismo-festivais-esquema-arena.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Wikipédia (referência conceitual)](https://pt.wikipedia.org/wiki/Tropicalismo) |
| `hip-hop-rap-slam-esquema-quatro-elementos.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Wikipédia (referência conceitual)](https://pt.wikipedia.org/wiki/Hip-hop) |
| `culturas-populares-patrimonio-azulejos-sao-luis.jpg` | Obra | CC BY-SA 4.0 — foto de Thuaia, via Wikimedia Commons. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Azulejos_no_Centro_Hist%C3%B3rico_de_S%C3%A3o_Lu%C3%ADs.jpg) |
| `artes-indigenas-esquema-pluralidade.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [FUNAI (referência conceitual)](https://www.gov.br/funai/pt-br/atuacao/povos-indigenas) |
| `arte-afro-brasileira-esquema-matrizes.png` | Esquema autoral | Esquema autoral original; uso educacional nesta plataforma. | [Wikipédia (referência conceitual)](https://pt.wikipedia.org/wiki/Cultura_afro-brasileira) |
| `arte-sociedade-sistema-chartres-fachada.jpg` | Obra | CC BY-SA 3.0 — foto de Dcconsta, via Wikimedia Commons. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Chartres_cathedral_(West_fa%C3%A7ade).jpg) |
| `arquitetura-design-alvorada.jpg` | Obra | CC BY-SA 3.0 DE — foto de Arne Müseler, via Wikimedia Commons. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Pal%C3%A1cio_da_Alvorada_brasilia.jpg) |
| `arte-asiatica-hasegawa-pinheiros.jpg` | Obra | Domínio público — obra de Hasegawa Tohaku; reprodução em domínio público. | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hasegawa_Tohaku_-_Pine_Trees_(Sh%C5%8Drin-zu_by%C5%8Dbu)_-_left_hand_screen.jpg) |

## 7. Riscos e pontos de atenção

- **Aprovação pedagógica:** o teste não avalia adequação curricular, nível de linguagem, precisão histórica ou sensibilidade. A revisão docente é obrigatória antes de publicar.
- **Isadora Duncan:** a ficha da fonte tem metadados inconsistentes (Genthe x Sloan). A legenda foi corrigida pela assinatura visível na obra; recomenda-se registrar a divergência no catálogo de fontes.
- **Eckhout:** a legenda e o `alt` descrevem a mulher africana com criança; não usar a imagem como “retrato Tapuia”.
- **Chartres e Alvorada:** as fotos mostram o monumento/edifício, mas não o canteiro de obras, os trabalhadores ou as cidades-satélites. O texto verbaliza essa ausência.
- **Frevo e azulejos:** são registros contemporâneos (2009 e 2024), não documentos coloniais; as legendas datam e creditam.
- **Kalimba:** o objeto de museu não tem povo/data específicos na ficha; o texto evita generalizar “a música africana”.
- **Almeida Júnior:** a pintura é uma cena rural idealizada do fim do século XIX; o texto diz que não é documento etnográfico.
- **Hasegawa:** a imagem é a tela esquerda do conjunto; a legenda explicita o recorte.
- **Piero:** a imagem é apenas o painel de Battista Sforza, não o díptico completo; a legenda explicita.

## 8. Aprovação pedagógica

| Camada | Situação | Responsável |
|---|---|---|
| Validação técnica | Aprovada | Teste automatizado |
| Revisão visual | Concluída | Equipe editorial |
| Aprovação pedagógica | **Pendente** | Professor(a) de Arte / revisão curricular |

Sugestões de revisão: verificar se cada imagem realmente ajuda o objetivo vinculado; ajustar o tom para o público do ENEM; conferir datas, autoria e terminologia; avaliar a sensibilidade das obras (Munch, Eckhout, Chartres, Alvorada) e a adequação ao contexto escolar.

## 9. Arquivos alterados

- 34 JSONs em `content/revisao-enem/aulas/conteudos/`.
- 38 arquivos em `content/revisao-enem/aulas/imagens/` (2 substituídos e 36 novos).
- `tests/contract/revisao_tematico_exemplos_visuais.test.js` (novo).
- `docs/analises/2026-11-05-revisao-exemplos-visuais.md` (este relatório).

Não houve alteração em `src/`, catálogo, objetivos, IDs, mapa de vínculos, questões, imagens originais, testes existentes, dependências, configurações, fontes compartilhadas ou `specs/`.

## 10. Estado final

- Nenhum commit, push ou deploy realizado.
- Suíte de contrato: 9/9 testes aprovados.
- Próximo passo: revisão pedagógica e, se aprovada, publicação.
