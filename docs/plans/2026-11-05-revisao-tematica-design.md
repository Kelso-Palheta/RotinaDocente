# Revisão ao Vivo por conteúdo — design aprovado

Data: 05/11/2026. Aprovação: o usuário confirmou conteúdo explicativo completo antes das questões e acrescentou que selecionar um tema deve disponibilizar automaticamente somente questões desse conteúdo.

## Experiência

Preparação: escolher conteúdo(s) específicos → ler e conferir aula introdutória completa → escolher quantidade e questões compatíveis → configurar tempo padrão e exceções individuais → abrir sala. Apresentação: espera → todos os blocos introdutórios escolhidos, conduzidos pelo professor → desafio com questões → feedback A–E e ranking. A aula não é reapresentada entre questões. Introdução sem cronômetro obrigatório; cronômetro individual começa ao abrir cada pergunta.

Uma trilha organiza o catálogo, mas não autoriza questões sozinha. Por exemplo, História da Arte organiza aulas de Impressionismo e Surrealismo; escolher Surrealismo não torna questões sobre Impressionismo elegíveis. O vínculo explícito usa IDs e cobertura dos objetivos de aprendizagem; busca textual ou palavras-chave não constituem o vínculo pedagógico.

Quantidade é uma meta explícita e inteira de 1 a 20, preservando o teto já homologado. A interface mostra quantidade compatível e quantidade já revisada/apta. Selecionar acima das aptas impede criação, sem inserir outras matérias ou repetir questão. Escolha manual, reordenação e sugestão automática revisável. Alterar o conteúdo remove imediatamente seleções incompatíveis, informa quantas foram removidas e exige completar a meta novamente. Filtros secundários de ano/modalidade não mudam o contexto pedagógico nem apagam seleções ainda compatíveis.

## O que significa introdução completa

Cada aula específica deve ter objetivos verificáveis, contexto histórico/cultural, conceitos explicados em linguagem do Ensino Médio, leitura guiada de exemplos, comparações quando pertinentes, equívocos comuns, estratégias de interpretação ENEM e síntese. Texto original com referências consultáveis, imagens contextualizadas quando necessárias, autoria/legenda/alternativa textual e fontes/licença registradas. Não aceitar título com duas frases como aula completa. Conteúdos autorais não podem apenas copiar comentários do gabarito ou revelar a resolução de uma questão selecionada antes do desafio.

Planejar normalmente 6–12 blocos legíveis e 10–20 minutos de mediação por conteúdo; ampliar quando o assunto exigir. Esses números orientam a apresentação e não substituem a qualidade/cobertura. O professor confere a aula e as questões antes de usar. Nenhum agente simula revisão humana nem marca todo o acervo como aprovado. O banco atual é parcial, com 197 questões; itens fora do escopo ou sem cobertura recebem pendência/justificativa, nunca um vínculo inventado para completar contagem.

## Arquitetura

Dados novos privados em `content/revisao-enem/aulas/`; acervo de questões e seus hashes existentes ficam intactos. Classificação estável e verificável separa trilha, aula/conteúdo, objetivos e vínculos com questões. Catálogo retorna apenas metadados autorizados; corpo da aula e imagens via servidor autenticado. Questões, gabaritos e aulas não são importados por componentes clientes.

Novas salas têm `schemaVersion: 2`, conteúdos e questões congelados, duração por rodada e revisão monotônica. Salas legadas mantêm o comportamento antigo. O servidor revalida IDs, compatibilidade tema/questão, meta exata, conferência e hashes: não basta esconder questões no navegador. Aprovação da aula pertence ao UID e à versão JSON+imagens+vínculos relevantes; mudança de fonte ou de cobertura invalida aprovação. Revalidar acervo após a conferência e antes de criar, inclusive vínculos.

O estado público da introdução expõe somente o bloco atual e seus recursos autorizados, sem rodadas futuras/gabaritos. Comandos de avanço/retorno usam a revisão existente e permissões docentes. Alunos acompanham o mesmo bloco da projeção. A identidade, o transporte SSE, a idempotência, o prazo do servidor, a pontuação e o limite piloto de cem alunos permanecem.

## Divisão autorizada

- DeepSeek/OpenCode: inventário/classificação e conteúdo original pesquisado, contratos de dados e testes novos de acervo.
- Antigravity: componentes controlados e regressões novas da interface, usando fixtures sintéticas independentes do conteúdo em elaboração.
- ChatGPT: contrato, servidor/domínio e persistência crítica, adaptação dos controladores, integração, revisão independente e publicação após os portões completos.

Arquivos exclusivos nos prompts; agentes externos não editam specs compartilhadas, backend, testes existentes, regras Firebase ou configuração. Sem novas dependências, serviço pago, Blaze ou IA durante o aulão. Checkout atual será reutilizado por preferência expressa do projeto; nenhuma nova worktree necessária para este planejamento documental.
