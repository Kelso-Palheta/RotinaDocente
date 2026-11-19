# Aula Gamificada — imagens no catálogo e formatos de disputa

Data: 19/11/2026. Solicitação: imagem própria em cada card e seleção de individual, duelo 1×1 ou disputa entre grupos, conforme compatibilidade do jogo. Confirmação do usuário: na criação deve ser possível escolher **respostas individuais por integrante** ou **uma resposta compartilhada pelo grupo**.

Ler `AGENTS.md`, `PRD.md`, `RULES.md`, `TESTS_SPEC.md`, `AULA_GAMIFICADA_SPEC.md`, `AULA_GAMIFICADA_HEROIS_TABULEIRO_SPEC.md`, `AULA_GAMIFICADA_AVALIACAO_SPEC.md` e DTOs avaliativos antes de implementar. Coordenar com `AULA_GAMIFICADA_IMERSAO_SPEC.md`, cuja implementação está em andamento.

## 1. Execução sem conflitar com a tarefa audiovisual

Esta especificação é uma **nova entrega**, não substitui o pacote audiovisual. Enquanto aquele pacote estiver em execução, adiantar somente artes e planejamento em arquivos novos e separados. Não iniciar outra execução que edite simultaneamente `SalaAlunoView`, `SalaDocenteView`, os jogos ou documentos compartilhados.

Após a entrega audiovisual, revisar seu estado e implementar esta tarefa sobre essa versão, preservando sons, cenas, dimensões e transições aprovados. Usar nome próprio para os assets do catálogo; não substituir arquivos de GIF/trilha em uso. Não fazer commit/push antes da revisão neste chat.

## 2. Cards com imagens — catálogo e preparação

- Os **sete jogos** recebem capa local própria e coerente, exibida no catálogo. O seletor de modalidade em Preparar Sala usa miniatura da mesma arte. Manter nome/descrição em texto acessível, sem exigir leitura dentro da imagem.
- Estilo consistente com Arte em Jogo: roxo, ciano, amarelo, rosa e lima; composição alegre, contraste claro e ilustrações distintas, adequadas a qualquer disciplina.
- Cenas: Quiz com alternativas/cronômetro; Memória com cartas/pares; Associação com conexões entre colunas; Ordenação com peças em sequência; Equipes com grupos em arena/troféu; Heróis com aventura em quadrinhos; Tabuleiro com percurso/peões.
- Usar imagens ou ilustrações vetoriais completas, não apenas ampliar emoji nem repetir a mesma arte mudando a cor. Assets originais locais ou recortes adequados do material já existente. Registrar dimensões/origem; não inventar caminhos ou carregar imagens externas em tempo de uso.
- **Atualização de 19/11/2026 solicitada após publicação:** substituir o desenho simplificado das sete capas por imagens de aparência realista/cinematográfica. Heróis deve apresentar os Vingadores/Marvel; Tabuleiro deve apresentar Minecraft; demais capas devem representar visualmente a mecânica de cada jogo com cenas fotográficas ou renderização realista. Preservar os endereços e a proporção das capas existentes, incluindo as miniaturas da preparação, sem alterar regras, botões ou formatos. Imagens geradas devem ser identificadas no inventário como geradas, sem alegar que são fotografias oficiais. Usar versões locais otimizadas, sem download de mídia durante o uso.
- Padronizar proporção de capa (por exemplo, 16:9), imagem nítida em desktop/celular, foco no assunto principal, dimensões reservadas e carregamento leve. Evitar salto do layout, cortes de personagens ou reprodução simultânea de sete GIFs no catálogo.
- Preservar ações Preparar sala, Gerar IA e Manual, inclusive modalidade escolhida e fluxo de questões aprovadas. Não tornar o card inteiro um alvo ambíguo que dispare ação ao clicar numa preferência.
- Informar formatos de disputa compatíveis por badges/chips, sem confundir tipo de questão, formato de participação e finalidade avaliativa.
- Atualizar textos antigos como “Sem alterar notas”: a finalidade pode ser Revisão ou Avaliativa. Explicar que notas somente são lançadas pelo fluxo explícito de avaliação/sincronização.

## 3. Modelo explícito de participação

Separar conceitos:

- `modalidade`: mecânica já existente (`quiz`, `memoria`, `associacao`, `ordenacao`, `equipes`, `herois`, `tabuleiro`).
- `formatoParticipacao`: `individual`, `duelo` ou `grupos`.
- `modoRespostaGrupo`: `individual` (cada integrante responde) ou `compartilhada` (uma resposta/progresso do grupo), aplicável somente a grupos.
- `finalidade`: revisão ou avaliativa, preservada do sistema atual.

O formato Individual mantém o jogo por aluno e o ranking individual da turma; não significa limitar a sala a um único aluno. Duelo significa **exatamente dois adversários individuais**, não duas equipes de dois alunos. Grupos significa duas ou mais equipes concorrentes.

### Compatibilidade inicial a implementar e validar no servidor

| Jogo | Individual | Duelo 1×1 | Grupos |
| --- | --- | --- | --- |
| Quiz | Sim | Sim | Sim, ambos os modos de resposta |
| Memória | Sim | Sim | Sim, ambos os modos de resposta |
| Associação | Sim | Sim | Sim, ambos os modos de resposta |
| Ordenação | Sim | Sim | Sim, ambos os modos de resposta |
| Heróis | Sim | Sim | Sim, ambos os modos de resposta |
| Equipes | Não | Não | Sim, ambos os modos de resposta |
| Tabuleiro | Não | Sim: dois peões, um aluno por adversário | Sim: manter duas a quatro equipes |

Manter os sete IDs para não romper catálogo, links e salas antigas. Equipes continua sendo o atalho para o quiz coletivo; não remover nem transformar silenciosamente a modalidade. Tabuleiro preserva sua mecânica de turnos, percurso e avanço. A interface não oferece um modo antes de o servidor suportar seu comportamento completo.

## 4. Preparar Sala

1. Escolher modalidade (com imagem) e formato de disputa compatível. O botão do card pode pré-selecionar o formato; o resumo mantém a escolha.
2. Selecionar turma(s) e participantes efetivos. No duelo, escolher dois alunos distintos do roster autorizado e mostrar seus nomes lado a lado. Não transformar os demais alunos da turma em ausentes avaliados com zero.
3. Em grupos, informar nomes, integrantes e o modo de resposta. Permitir distribuição automática equilibrada e ajuste manual antes do início. Mostrar quantidades e impedir alunos duplicados, grupo vazio ou integrantes de outra turma/conta.
4. Em resposta compartilhada, definir representante autenticado de cada grupo. Mostrar claramente quem pode enviar; outros integrantes acompanham. Permitir alteração auditável do representante pelo professor, sem reiniciar tentativas, prazo ou pontuação.
5. Mostrar prévia da regra do jogo e do placar, quantidade de adversários/grupos, forma de resposta e eventual critério avaliativo. Criar sala continua sendo confirmação explícita.

Congelar composição, regras e destinatários no começo conforme contratos vigentes. Reconexão não redistribui times. Trocar modalidade/formato antes de criar deve preservar questões ainda compatíveis e informar seleções incompatíveis, sem perda silenciosa.

## 5. Regras de respostas e pontuação

### Individual e duelo

Preservar a regra individual de cada jogo, sem introduzir bônus por velocidade. Duelo reaproveita os dois participantes autorizados e mostra confronto/placar dos dois, mantendo critérios de empate vigentes. Em Memória, cada adversário tem seu próprio progresso; não vazar posições/cartas do oponente. Em Tabuleiro, cada adversário é representado por um grupo técnico de um integrante, mantendo turnos e regras de avanço.

### Grupos — cada integrante responde

Cada aluno envia sua própria resposta/progresso, preservando evidência individual. A pontuação coletiva é a soma dos pontos individuais, como na modalidade Equipes atual. Mostrar composição e total; oferecer distribuição equilibrada e deixar o professor ciente de tamanhos diferentes na prévia. Não mudar silenciosamente soma para média nem igualar notas individuais ao placar do grupo.

Em Memória, cada integrante tem um tabuleiro/progresso privado; o time agrega os resultados. Associação/Ordenação agregam proporções individuais pelo sistema de pontos existente. Heróis preserva as duas tentativas de cada aluno. No Tabuleiro, só integrantes da equipe da vez respondem; manter maioria estrita entre respondentes e a regra vigente de avanço/ausência de resposta.

### Grupos — resposta compartilhada

- Um registro lógico por grupo/rodada e uma autoria de envio identificada. O servidor deriva a equipe do ator/representante autorizado; não aceita equipe arbitrária enviada pelo cliente.
- Quiz/Equipes: uma alternativa do grupo. Associação/Ordenação: uma solução do grupo. Memória: um progresso compartilhado conduzido pelo representante, refletido aos integrantes autorizados sem revelar cartas fechadas. Heróis: até duas tentativas **do grupo**, não duas por integrante. Tabuleiro: apenas o representante da equipe da vez envia; a resposta única define o avanço pela dificuldade segundo a regra existente de uma/dois casas, sem aplicar maioria de respostas inexistentes.
- Reenvio idempotente não conta de novo; envio simultâneo ou troca de representante não cria respostas/tentativas extras. Prazo e estado continuam sendo autoridade do servidor.
- Registrar resposta recebida, autoria, membros elegíveis e contexto da versão. Não fabricar uma resposta individual por aluno para contornar os relatórios.

## 6. Avaliação, relatórios e publicação

- Preservar todos os mecanismos de ano/turma/bimestre, prévia do Diário, escala, revisão auditada, versões publicadas, idempotência e persistência limitada já aprovados.
- Em grupos com respostas individuais, a nota de cada aluno continua derivada de seu aproveitamento individual; mostrar também indicadores da equipe.
- Em resposta compartilhada, o resultado é explicitamente **coletivo**. Para atividade avaliativa, exigir escolha visível na criação: usar apenas o relatório coletivo (sem lançamento individual automático) ou atribuir a mesma nota coletiva aos integrantes presentes/confirmados, identificada como avaliação coletiva. Nunca inferir presença somente por estar cadastrado no grupo.
- Presenças podem ser confirmadas pelo professor de forma registrada quando o grupo usa um só aparelho. Ausentes/sem oportunidade não recebem nota por herança automática. O representante não autentica os demais alunos nem ganha permissão para acessar relatórios pessoais.
- Relatório mostra modalidade, formato, modo de resposta, grupo/adversário, composição congelada, autoria, oportunidades, critério individual/coletivo, resultado, versão e pendências. Aluno acessa apenas o que o vínculo e publicação permitem.
- Não duplicar notas, respostas ou atividades para simular disputa. Não somar placar do grupo na nota individual sem o critério coletivo explícito. Exportações devem informar a origem coletiva quando aplicável.

## 7. Compatibilidade e arquitetura

Adicionar metadados de compatibilidade no domínio e expô-los pelo catálogo/API. Não depender apenas de opções escondidas no cliente. Validar criação e todas as respostas no servidor.

Salas sem os campos novos mantêm comportamento original: Quiz/Memória/Associação/Ordenação/Heróis individuais; Equipes e Tabuleiro coletivos com respostas individuais. Não reclassificar partidas antigas, redistribuir alunos ou recalcular notas antigas.

Preservar contratos existentes com campos opcionais e defaults documentados; não alterar testes antigos para forçar aprovação. Modelar regras puras em domínio, orquestração no serviço e persistência nos adaptadores existentes. Não colocar autoridade de notas/equipes nos componentes de animação.

Pontos principais: `dominio/aula-gamificada/modalidades.js`, regras de sala/pontuação/avaliação, `AulaGamificadaService`, contrato HTTP, catálogo, preparação, telas docente/discente, relatório e assets novos em `public/aula-gamificada/catalogo/`.

## 8. Aceite e entrega

Mapear cobertura em `TESTS_SPEC.md`, escrever testes antes da implementação e preservar regressões anteriores. Cobrir:

- Sete capas distintas no catálogo e miniaturas na preparação, caminhos válidos, desktop/celular, teclado e alternativas de imagem.
- Matriz completa de compatibilidade, validação também via API e preservação de salas antigas.
- Duelo: exatamente dois alunos distintos, mesma identificação SHA-256 usada em produção, acesso negado a terceiro e nenhuma nota automática para alunos não selecionados.
- Grupos: ambos os modos de resposta; distribuição/membros válidos; representante e troca; concorrência/idempotência/prazo; progresso compartilhado de Memória sem vazamento de cartas.
- Heróis: tentativas corretas por aluno/grupo; Tabuleiro: turno, resposta única vs maioria, avanço único e ranking por casas/pontos.
- Critérios avaliativos individuais/coletivos, presença explícita, ausentes/sem oportunidade, revisão, relatório/PDF/CSV, escala/ano e publicação versionada.
- Trilhas/cenas/transições do pacote audiovisual continuam funcionando, sem duplicar efeitos por atualização de grupos.

Entregar relatório, capturas desktop/celular, demonstração de duelo e dos dois modos de grupo, suíte completa, lint e build. **Sem commit/push até revisão neste chat.**
