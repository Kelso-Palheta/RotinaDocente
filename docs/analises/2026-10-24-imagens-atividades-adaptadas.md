# Imagens nas atividades adaptadas — análise aprofundada

Data: 24/10/2026. Complemento da auditoria de Atividades Adaptadas (DUA). Escopo: entrada de fotos/PDF, compreensão do material, planejamento visual, geração/edição, validação, acessibilidade, persistência, impressão e Portal.

**Conclusão:** o fluxo atual não assegura coerência pedagógica nem qualidade técnica das imagens. Ele gera ilustrações por descrição e verifica parte da disponibilidade. Não implementa adaptação visual fiel do material original, aprovação de qualidade ou revisão comparativa. Imagem bonita, imagem correta e imagem acessível são critérios diferentes.

**Atualização posterior:** implementação local autorizada e executada; detalhes em [guia de imagens](../guias/imagens-atividades-adaptadas.md). O diagnóstico e as reproduções abaixo registram o estado anterior. Homologação real e publicação permanecem etapas distintas.

A etapa original foi análise e proposta, sem mudança em código de produção. Não utiliza alunos reais ou credenciais, não gera imagens pagas e não publica nada. Não foram inspecionadas amostras reais produzidas na conta do professor; portanto não há base para avaliar a qualidade visual efetiva do modelo naquela conta.

## 1. Como funciona hoje

1. Foto/PDF entra pelo extrator de documentos. O resultado retido pelo formulário é texto e metadados, não uma coleção de figuras originais vinculadas às questões.
2. PDF com pelo menos 50 caracteres numa página usa a camada textual; imagens e diagramas daquela página não são necessariamente analisados por visão. Página com gráfico e texto suficiente pode perder o gráfico silenciosamente.
3. A IA textual gera questões, descrição de apoio e prompt em inglês.
4. O botão de imagem envia descrição/prompt, disciplina e categorias. Não envia os pixels da figura original, ano escolar, objetivo da questão, elementos invariantes nem o enunciado completo quando há descrição disponível.
5. A rota tenta modelos Google com a chave configurada ou OpenAI, conforme provedor. Em erro, o visualizador tenta outro serviço automaticamente.
6. A imagem aparece no estado local do visualizador. Não há verificador do conteúdo visual contra a questão.
7. Há caminhos distintos de salvar, imprimir e publicar; eles não compartilham uma representação confiável e única da imagem final.

Fontes locais: `frontend/src/utils/atividades/documentExtractor.js`; `frontend/src/infraestrutura/documentos/extracaoVisual.js:43`; `frontend/src/lib/redacao/ai-provider.js:141`; `frontend/src/components/adaptacoes/VisualizadorAtividadeAdaptada.jsx:130`; `frontend/src/app/api/adaptacoes/imagem/route.js:23`.

## 2. Seis defeitos comprovados por execução

[Evidências, testes e instruções de reprodução](evidencias-imagens-adaptadas/README.md). São reproduções controladas, não chamadas reais a modelos.

| Defeito observado | Causa rastreada | Efeito para o professor |
|---|---|---|
| A imagem gerada aparece, mas o callback de salvar recebe questão sem URL | Normalização copia as questões; geração muda a cópia e estado por índice; salvar recebe `resultado` original | Trabalho visual pode desaparecer ao reabrir ou não chegar ao Portal |
| Regerar imagem salva continua mostrando a antiga | `q.imagemUrl` original tem precedência sobre a URL nova guardada no estado | A interface pode aparentar ignorar a tentativa de melhoria |
| Prévia de impressão do montador não mostra imagem existente | Renderiza descrição, mas não há elemento de imagem nesse caminho | Prova pode sair sem a figura necessária para responder |
| Rota retorna sucesso para base64 de texto anunciado como PNG | Confia em `inlineData`, sem decodificar/verificar assinatura/formato/dimensões | Sucesso de transporte não comprova arquivo de imagem válido |
| Serviço alternativo usa prompt inglês e descarta descrição corretiva | Escolhe o primeiro texto disponível em vez de compor contexto; não recebe restrições completas | Pedido “três maçãs” pode voltar a usar descrição antiga “cinco maçãs”; perfil visual perde restrições |
| Verificador de carregamento aceita uma imagem simulada com 1×1 pixel | Só espera `onload`, sem dimensões ou qualidade mínima | Imagem carregável pode ser imprópria para leitura/impressão |

Fontes: `VisualizadorAtividadeAdaptada.jsx:98,196,308,664`; `ImagemPedagogicaBuilder.js`; `PainelMontadorProvas.jsx:252`; `api/adaptacoes/imagem/route.js:107`.

## 3. Falhas de concepção e riscos identificados no código

### Adaptação visual ainda não é edição do original

O endpoint usa apenas partes textuais na requisição Google. Mesmo fornecendo `imagemOriginal` ao corpo da rota, o campo não é encaminhado ao modelo, conforme reprodução. Extrair o texto de uma fotografia de página não preserva composição, relações espaciais, proporções ou figuras.

O fluxo precisa distinguir três ações reais: **manter a figura original**, **adaptar a figura original** e **criar uma nova ilustração**. Não apresentar recriação a partir de texto como preservação fiel.

### Coerência precisa de requisitos verificáveis

Não existe contrato por imagem contendo função na questão, objetos obrigatórios, quantidades, relações, detalhes que não podem mudar, idade/série, estilo, dados e critérios de aprovação. “Ilustração didática” é genérico demais para validar o resultado. Descrição e prompt inglês podem divergir; hoje são unidos sem resolução explícita do conflito no caminho principal.

Ausentes: comparação da figura efetivamente gerada com o enunciado, checagem de contagem, leitura de rótulos, revisão de fatos, proteção contra revelar a resposta e registro de revisão docente. A audiodescrição exibida é o pedido original, não uma descrição validada da imagem produzida.

### Acessibilidade não equivale a um estilo universal

- “Um único objeto central” pode destruir uma questão sobre três objetos ou relação entre personagens. “Poucos elementos” não pode remover informação essencial.
- “Sem texto” serve para ilustração sem rótulos; pode inviabilizar mapas, gráficos, partituras e diagramas. Rótulos exatos devem ser compostos por código com tipografia controlada quando necessários.
- “Children style” no serviço alternativo ignora o ano escolar e pode infantilizar materiais do Ensino Médio.
- Alto contraste na página não transforma automaticamente uma figura de baixo contraste; conferir o próprio arquivo, sem depender só de cor para indicar categorias.
- Categorias diagnósticas devem orientar opções de apoio, não impor preferências iguais para todos. O professor deve ajustar barreiras e estratégias individuais.
- Descrição textual extensa não deve ocupar indevidamente o lugar da figura nem antecipar o gabarito. Em contagem ou reconhecimento visual, acessibilidade pode exigir outro formato de tarefa que preserve a habilidade, definido pelo professor/AEE.

Para gráficos/mapas complexos, a W3C orienta descrição curta e representação textual detalhada das informações essenciais; um `alt` genérico não basta. [W3C — imagens complexas](https://www.w3.org/WAI/tutorials/images/complex/).

### Serviço alternativo e parâmetros de qualidade

O código tenta `gemini-3.1-flash-image`, `gemini-2.5-flash-image` e Imagen. A escolha de modelo de texto da conta não determina diretamente essa lista de imagens. Sem testar a conta, não se pode afirmar quais modelos estão disponíveis nela.

A chamada principal não solicita dimensão/proporção para os modelos Gemini de imagem. O caminho alternativo fixa 800×400 e pode recorrer a endpoint legado, modificando capacidade, proporção e estilo. O usuário não recebe uma confirmação clara dessa troca. A rota principal não tem cancelamento/timeout explícito por tentativa; no alternativo, duas tentativas de até 50 segundos podem ultrapassar o orçamento de rota declarado de 60 segundos.

O Google documenta edição com imagem de referência, controles de resolução/proporção e refinamento por iterações; recomenda não esperar perfeição no primeiro resultado. Isso sustenta a proposta de edição e revisão, sem garantir fidelidade absoluta. A compatibilidade deve ser validada para o modelo e a API escolhidos, sem copiar parâmetros de outra versão indiscriminadamente. [Documentação oficial de geração e edição](https://ai.google.dev/gemini-api/docs/image-generation).

Recomendação: no modo Google, continuar no provedor escolhido. Falha deve oferecer tentar novamente, escolher outro modelo autorizado ou substituir manualmente. Troca de provedor deve ser explícita; jamais reduzir silenciosamente o padrão de qualidade.

### Persistência e estabilidade

Guardar base64 de imagens grandes junto ao documento de atividade aumenta payload e pode atingir os limites de documento/armazenamento. Hoje não há, nesse fluxo, upload de recurso visual para armazenamento de objetos com identificação imutável, integridade e recuperação por versão. A URL legada do serviço alternativo é uma requisição externa de geração, não um recurso imutável sob controle da plataforma.

Propor armazenamento separado, referência estável e permissões por conta/vínculo. Limites de bytes, pixels, dimensões e número de imagens precisam valer no servidor. Registrar hash, tamanho, formato, provedor/modelo e revisão do conteúdo. Não armazenar chaves nem incluir nomes/diagnósticos desnecessários no recurso visual ou prompt.

### Regeneração, lote e impressão

Estado de imagem e erro usa índice da questão; mudanças de resultado ou ordenação exigem chave estável para impedir associação incorreta. “Gerar todas” não oferece cancelamento nem relatório individual de sucesso/reprovação. Há botões individuais que não são bloqueados por todas as condições de lote, com risco de requisições concorrentes e estado ambíguo.

Imprimir não aguarda necessariamente o carregamento de todos os recursos nem bloqueia figura obrigatória ausente. Desenho pode ser reduzido pela área disponível e pelo limite visual de altura. Precisam existir prévias digital, ampliada e de impressão, com teste de quebra de página, escala, rótulos e preservação da figura inteira.

## 4. Estratégia recomendada por tipo de imagem

| Caso | Método recomendado | Invariante essencial |
|---|---|---|
| Contagem de objetos e frações | Composição determinística com SVG/elementos verificados | Quantidade, agrupamento e proporção exatos |
| Gráficos e tabelas | Renderizar a partir de dados estruturados revisados | Valores, unidades, eixos, legenda e escala |
| Geometria, reta numérica, relações espaciais | Desenho por código com parâmetros | Ângulos, posições e medidas corretas |
| Mapas e anatomia | Fonte validada/licenciada; adaptar representação com revisão especializada | Limites, localização, relações e identificação |
| Obras de arte e fontes históricas | Preservar original com procedência e enquadramento; ampliar detalhes | Não inventar cores, traços, autoria ou elementos do objeto de estudo |
| Fotografia/figura de livro | Guardar original e permitir selecionar a região; edição contextual controlada | Manter os elementos relevantes e distinguir original de adaptação |
| Ilustração de contexto ou narrativa | IA com descrição estruturada e verificação visual | Ação, personagens, contexto e adequação à idade |
| Pictogramas e sequência de ações | Catálogo licenciado ou composição consistente | Símbolos compreensíveis, ordem e significado estáveis |

“Vetorial” escrito no prompt não torna PNG em SVG nem garante precisão geométrica. Para materiais exatos, separar composição determinística de ilustração generativa.

## 5. Fluxo proposto

1. **Entrada visual preservada:** manter original, página, região, procedência e associação à questão; análise visual complementar mesmo em PDF com texto quando há figura relevante.
2. **Escolha docente:** manter, adaptar ou criar. Explicar o que pode mudar e o que será preservado.
3. **Plano visual:** função pedagógica, objetivo, quantidade/elementos obrigatórios, relações, restrições, idade, apoios, proporção e tamanho final.
4. **Produção adequada:** código/dados para exatidão; IA para ilustração ou edição com pixels de referência.
5. **Validação técnica:** decodificação real, formato permitido, limites de bytes/pixels, dimensões e densidade efetiva no tamanho de impressão. Não aceitar arquivo corrompido ou minúsculo.
6. **Verificação de coerência:** comparar saída, original e plano visual. Verificador multimodal pode sinalizar problemas, mas sua pontuação não certifica correção. Contagens/dados exatos devem ser conferidos por método determinístico ou revisão humana.
7. **Revisão e ajuste:** comparação original/adaptada, ampliar imagem, corrigir instrução específica, manter versão anterior e inserir imagem própria quando necessário.
8. **Aprovação vinculada à versão:** edição do enunciado, perfil ou imagem invalida aprovação anterior. Alterações precisam de nova revisão.
9. **Salvar e distribuir:** usar a mesma versão aprovada em banco, prova, impressão e Portal; verificar integridade após reabrir.

Estados sugeridos: sem imagem → planejada → gerando → em validação → pendente de revisão → aprovada; alternativamente reprovada/erro/cancelada. Sem aprovação, pode salvar rascunho; figura obrigatória ausente/reprovada deve impedir publicar ou finalizar impressão.

## 6. Critérios mensuráveis de aceite propostos

São metas da futura implementação, não garantias já presentes.

- Nenhum sucesso para bytes inválidos ou imagem abaixo da dimensão mínima definida para o uso. Medir dimensão original, não CSS.
- Para impressão, calcular `DPI efetivo = pixels / (largura em cm / 2,54)`. Meta de projeto proposta: 300 DPI no tamanho final para desenhos raster nítidos; por exemplo, 10 cm exigem aproximadamente 1182 px de largura. Não transformar isso em regra universal de acessibilidade. Para SVG, conferir legibilidade e espessura na escala final.
- Não melhorar pontuação de qualidade apenas por ampliar artificialmente pixels. Nitidez, legibilidade e fidelidade continuam necessárias.
- Contagem/dados/estrutura de figuras exatas devem coincidir integralmente com a referência revisada. Um erro factual bloqueia mesmo se o acabamento visual for excelente.
- Nada essencial cortado, rótulos completos, resolução adequada e alternativas textuais correspondentes à figura final; testar em escala real de impressão e em preto e branco quando aplicável.
- Não trocar provedor/modelo ou usar versão degradada sem comunicar a escolha.
- Imagem salva e reaberta deve preservar hash e vínculo; arquivo entregue no Portal e na prova deve corresponder à versão aprovada.
- Regeneração substitui o recurso visível e mantém histórico; reordenação nunca move a imagem para outra questão; respostas atrasadas não sobrescrevem a versão atual.
- Aprovação humana explícita antes da distribuição, com identificação da versão. Nenhum selo “perfeita”, “100% correta” ou “validada” baseado somente em avaliação da IA.

## 7. Homologação visual necessária

Montar um conjunto sintético com originais e requisitos conhecidos; repetir gerações para medir variação, sem avaliar apenas a melhor amostra.

| Caso | Erro que deve reprovar |
|---|---|
| Exatamente 3 maçãs separadas | 2/4 maçãs, objetos fundidos ou elementos contáveis ambíguos |
| Fração 3/4 | Partes desiguais, cinco partes ou preenchimento incorreto |
| Gráfico com valores 2, 5 e 3 | Alturas, rótulos, escala ou unidades trocados |
| Posição à esquerda/direita | Espelhamento ou relação espacial invertida |
| Cena histórica | Objeto anacrônico que altera a interpretação |
| Obra de arte | Recriação apresentada como se fosse o original |
| Figura de livro com muito texto | Ignorar figura porque a página tem camada textual suficiente |
| Perfil com baixa visão | Detalhes ilegíveis no tamanho real, figura/fundo indistintos |
| Estudante do Ensino Médio | Infantilização sem justificativa pedagógica |
| Descrição acessível de gráfico | Texto que omite dados essenciais ou descreve outra versão da figura |
| Salvar/reabrir/publicar/imprimir | Imagem ausente, antiga, trocada ou diferente entre canais |
| Falha/timeout/repetição/lote | Troca silenciosa de serviço, duplicação, estado incorreto ou perda do resultado anterior |

Registrar por amostra: original, objetivo, plano, prompt, modelo, parâmetros, imagem de saída, metadados técnicos, falhas, edição e decisão docente. A taxa de acerto deve contar tentativas falhas e recusas; não existe taxa medida nesta auditoria.

## 8. Ordem de implementação recomendada

1. Corrigir salvamento, regeneração, associação por ID e renderização das imagens na prova.
2. Introduzir validação de arquivo/resolução, limites, armazenamento estável e estados explícitos de falha.
3. Preservar originais e separar manter/adaptar/criar; implantar plano visual e contrato por tipo de imagem.
4. Integrar edição Google com referência, escolha de qualidade compatível e composição determinística para dados exatos.
5. Introduzir verificação de coerência, descrição da saída real, revisão docente e bloqueio de distribuição de figuras pendentes.
6. Homologar com imagens reais representativas, impressão física e Portal; só então anunciar o novo padrão de qualidade.

Atualizar specs e acrescentar testes que falhem antes de cada correção; preservar testes existentes. Não substituir o fluxo de extração de nomes/notas nem alterar o gerador regular incidentalmente. Alterações no extrator compartilhado exigem regressões específicas desses consumidores.

## 9. Evidência e limite da conclusão

- **6 reproduções confirmadas**, em um arquivo isolado fora da suíte de produção.
- **32 testes existentes aprovados**, em cinco arquivos: imagens_apoio_visual, imagem_fallback, adaptacoes_api, adaptacoes_normalizacao e UploadVisual.
- Inspeção de fluxo de dados e pesquisa em fontes primárias Google/W3C.
- Sem geração real, auditoria visual de saídas do projeto, medição de custo, teste de carga, navegação real em produção ou garantia de qualidade estética/factual. Não foi feito build porque não houve alteração de implementação.

É possível garantir regras do sistema — preservar versões, bloquear arquivos inválidos, exigir revisão e evitar publicação de conteúdo pendente. Não é possível garantir que toda imagem produzida por IA seja perfeita; a qualidade deve ser demonstrada por validação técnica, coerência e revisão pedagógica.
