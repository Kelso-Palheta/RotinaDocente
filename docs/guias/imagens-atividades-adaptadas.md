# Imagens nas atividades adaptadas

## Escolher como produzir

Cada questão tem uma área de imagem. É possível enviar fotografia ou selecionar uma página de PDF como referência, mesmo se o PDF já tiver texto digital. A página é preservada inteira; não há detecção/recorte automático de cada figura. Confira se ela pertence à questão.

- **Criar nova imagem:** produção por Gemini a partir do plano visual.
- **Adaptar o original:** envia os pixels da referência ao Gemini, junto ao plano e aos dados que devem ser mantidos.
- **Manter original:** utiliza o recurso enviado, preservando sua procedência.
- **Desenhos exatos:** contagem com círculos, frações de partes iguais, gráficos de barras e geometria básica são desenhados por dados, sem gerar quantidades por IA. Confirme se essa representação atende ao objetivo da questão.

Informe o que deve aparecer, os elementos que não podem mudar, ajustes visuais e a largura final. Para gráficos, use uma linha por categoria: `Nome;valor`. Nomes longos são divididos em linhas ou rejeitados com explicação; não são truncados silenciosamente.

## Conferir e aprovar

A imagem produzida começa **Pendente de revisão**. Amplie a figura e confira conteúdo, quantidades, relações, legibilidade, adequação à idade e descrição acessível. A descrição deve corresponder à figura final e preservar a habilidade avaliada.

A conferência por IA é auxiliar e pode falhar. Ela não aprova a figura automaticamente. Se houver apontamentos, gere outra versão ou registre como os conferiu e resolveu. Para aprovar, marque a confirmação de revisão e escolha **Aprovar esta versão**.

Alterar imagem, referência, descrição, plano, enunciado ou gabarito invalida a aprovação. Reaproveitar para outro estudante ou transferir ao montador exige nova revisão. Histórico permite restaurar versões; restauração também exige aprovação.

O arquivo precisa ter formato e resolução válidos. A largura escolhida determina o cálculo de 300 DPI para imagens raster; uma ampliação artificial não corrige baixa nitidez. Desenhos vetoriais conservam sua composição ao redimensionar.

## Salvar, imprimir e publicar

Salvar atividade e questões recebe a versão atual da imagem, original e histórico. Recursos v2 ficam em armazenamento de imagens por conta; o documento guarda referências estáveis. Falha não deve ser confundida com confirmação da nuvem. Rascunhos têm estados pendentes e podem ser baixados para recuperação.

A impressão e publicação verificam figuras obrigatórias. Uma figura necessária sem imagem ou aprovação impede concluir a distribuição. A prévia da prova inclui as imagens. A impressão aguarda os arquivos carregarem.

A publicação exige estudante existente na turma selecionada e bimestre. Questões objetivas precisam de gabarito válido. Associação/verdadeiro-falso devem ter seu formato revisado para o canal digital; o editor permite escolher resposta escrita/oral preservando o texto das alternativas. A soma da avaliação precisa ser exatamente 10 pontos.

## Configuração e limites

- Geração/edição v2 e conferência visual usam a chave Google Gemini. Sem troca silenciosa para serviços de menor capacidade. O fluxo legado continua compatível com consumidores existentes e não recebe selo de qualidade v2.
- Arquivos PNG/JPEG/WebP até 7 MB; referências PDF até 15 MB; até oito versões anteriores por questão. O arquivo de imagem é validado; descrição por si só não comprova correção.
- Salvar recursos exige sessão Firebase correspondente à conta, bucket de Storage habilitado e regras `frontend/storage.rules` implantadas. Essas condições precisam ser verificadas na publicação; não foram alteradas em produção nesta implementação.
- Não houve homologação de geração real na chave do professor, impressão física ou acesso real do Portal às imagens armazenadas. Testes usam dados sintéticos e APIs simuladas.
- Não há garantia de perfeição de imagens geradas por IA. O sistema oferece controles, bloqueios e revisão docente; a conferência pedagógica continua necessária.
