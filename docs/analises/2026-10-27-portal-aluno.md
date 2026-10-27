# Portal do Aluno — auditoria e proposta de organização

Data: 27/10/2026. Escopo: acesso, boletim, atividades, devolutivas e consulta de redações no código local. Esta entrega documenta sugestões; não altera o funcionamento do sistema. Nenhuma conta real foi acessada.

## Resultado e prioridades

O Portal já reúne notas, atividades e devolutivas, mas precisa tornar mais claros o contexto do aluno, o que está pendente e o que foi efetivamente publicado. Antes das melhorias visuais, há uma falha de autorização na consulta individual de redações que merece prioridade.

| Prioridade | Problema | Melhoria proposta |
|---|---|---|
| P0 | A rota de redação confirma o professor, mas não a propriedade da redação pelo aluno conectado | Conferir vínculo atual, identidade do aluno e autorização de publicação no servidor; negar consultas incompatíveis e retornar apenas campos públicos |
| P1 | Falhas de leitura do boletim retornam sucesso com dados vazios | Informar falha por seção, permitir tentar novamente e distinguir ausência de conteúdo de indisponibilidade |
| P1 | Critério ainda sem lançamento aparece como 0,00 quando outra nota já existe | Exibir traço/“Ainda não publicado”; preservar zero explicitamente lançado |
| P1 | Instruções de login divergem da regra real | Explicar primeiro nome + DDMM; apresentar regra especial apenas quando houver colisão; melhorar recuperação de acesso |
| P1 | Vínculos e seleção limitam contextos do mesmo professor | Representar professor, turma, aluno e ano letivo sem sobrescrever vínculos; oferecer seleção clara e migração compatível |
| P1 | Confirmação usa data atual no lugar da data serializada da entrega | Normalizar data no contrato e exibir o horário real do comprovante |
| P1 | Feedback de `multipla_escolha` omite resposta marcada e indicador de acerto | Normalizar os tipos aceitos e apresentar resposta, avaliação e comentário com consistência |
| P2 | Navegação exige percorrer vários blocos para descobrir tarefas | Criar resumo de ações e áreas separadas, preservando contexto e histórico |

## O que está bem encaminhado

- Sessão assinada, expiração e cookie HttpOnly; comparação de assinatura com proteção temporal.
- Boletim confere vínculo atual com professor, turma e aluno.
- Atividades públicas e entregas usam projeções de campos; gabarito e rubrica interna não fazem parte dessas projeções.
- Entrega valida questões, alternativas e contexto no servidor; transação preserva entrega anterior e impede duplicação.
- Atividades arquivadas com entrega continuam disponíveis no histórico.
- Cores dos totais bimestrais usam a regra compartilhada. Aprovação semestral de 25 pontos e anual de 50 pontos já está integrada, com tratamento de períodos incompletos.
- Formulário dispõe de leitura em voz, descrições e apoios; HTML é sanitizado.
- Exportação de boletim e apresentação de devolutivas já existem e devem ser preservadas.

Esses pontos resultam da leitura do código e dos testes selecionados, sem validação de dados reais em produção.

## Falhas reproduzidas

Arquivo de evidência: `evidencias-portal-aluno/reproducao.test.jsx`. As cinco verificações passam porque confirmam o comportamento incorreto atual; não são testes de aceite da solução. Usam componentes e rotas reais com serviços simulados.

1. Sessão do aluno A consulta o identificador de uma redação do aluno B vinculada ao mesmo professor e recebe HTTP 200 com o documento B. A rota não confere propriedade. Não houve exploração em produção; o cenário exige conhecer o identificador e demonstra ausência de autorização, independentemente da dificuldade de obter esse identificador.
2. Leituras de notas, atividades e demais coleções falham; boletim ainda responde `success: true` com dados vazios.
3. Com simulado publicado e atividade ainda sem nota, cartão apresenta `0,00` para a atividade ausente.
4. Questão `multipla_escolha` corrigida não apresenta resposta marcada nem indicador “Incorreta”.
5. Confirmação recebe data ISO de entrega antiga e ignora essa data, usando a data corrente.

## Outros achados de código e limites

### Acesso e contexto

A tela orienta usar dois primeiros nomes, enquanto o gerador usa primeiro nome e DDMM, reservando nomes adicionais para colisões. A seleção deduplica professores e o vínculo persistido é identificado pelo professor; isso limita múltiplas turmas/anos do mesmo aluno com o mesmo professor. A solução precisa revisar o contrato de vínculo e os consumidores, sem apenas alterar o seletor.

A página depende de `sessionStorage` para reconstruir o contexto, mesmo existindo cookie válido. Recomenda-se restaurar a sessão pelo servidor e tratar cache como apoio. Não foi identificado limitador de tentativas na rota de login analisada; proteção externa não foi auditada. O acesso previsível por nome e nascimento merece evolução para código privado/PIN e limitação de tentativas com transição assistida.

### Notas e publicação

Distinguir nota ausente, zero lançado e nota publicada. Mostrar data da última publicação e explicar que uma atividade corrigida pode aguardar sincronização e publicação no Diário. Não mudar a fórmula semestral já estabelecida. Exibir nome legível da turma, professor e ano, evitando identificadores internos como contexto principal.

### Atividades e devolutivas

Criar filtros de bimestre e situação. Entrega ainda aguardando correção precisa oferecer acesso ao comprovante e à própria resposta. Ausência de token deve gerar orientação, não apenas retirar o botão. Datas ausentes ou inválidas precisam de estado explícito, pois hoje podem deixar atividades fora das listas esperadas. Cancelar requisições antigas ao trocar contexto evita aplicar respostas atrasadas de outra seleção.

O formulário mantém rascunho apenas em memória. Propor salvamento privado por aluno/atividade, recuperação consciente e limpeza no logout. Imagens precisam de ampliação, carregamento e erro visíveis; se forem essenciais à questão, a indisponibilidade deve ser informada antes do envio. A persistência dessas imagens continua dependente da configuração pendente do módulo adaptado.

Expandir enunciado e mostrar resposta original junto ao feedback. O selo “Corrigida por IA” deve refletir o método real, inclusive correção manual ou revisão. Validar números e datas do contrato para suportar registros legados sem erro de renderização.

### Confiabilidade e escala

Tratar falhas parciais, permitir atualização e evitar título “Sem dados” quando houve erro. Revisar encerramento de sessão caso a requisição falhe. Paginar históricos e reduzir consultas individuais de tokens conforme volume real. Recomenda-se projeção explícita também para notas e redações; não foi demonstrada exposição de campos específicos desses documentos além do cenário de propriedade descrito.

## Organização proposta

1. Cabeçalho fixo de contexto: aluno, ano, turma e professor; trocar contexto sem repetir login quando autorizado.
2. Resumo “O que preciso fazer”: tarefas abertas, prazos próximos e novas devolutivas, com ação direta.
3. **Minhas atividades**: Pendentes, Entregues/aguardando correção e Corrigidas; filtro de bimestre e histórico encerrado.
4. **Notas e situação**: bimestres, semestres e anual; cores existentes, legenda, campos ausentes claros e última publicação.
5. **Devolutivas**: comentário por questão, resposta original, data e método da correção; indicar atualização disponível.
6. **Redações**: consulta autorizada por aluno, histórico e orientação de melhoria.

Evitar preencher a página inicial com todos os detalhes. As áreas devem permitir voltar ao resumo mantendo filtros e contexto. Novas informações familiares ou ocorrências exigem seleção explícita do conteúdo publicável.

## Plano de implementação e aceite

Antes de alterar `src/`, atualizar specs e criar testes de regressão novos conforme as regras do projeto. Preservar os testes existentes.

- Segurança: alunos distintos do mesmo professor não acessam redações entre si; vínculo removido e contexto incompatível são negados; acesso legítimo permanece funcional.
- Boletim: falha em uma seção não se transforma em ausência de notas; seções válidas continuam visíveis e a falha permite nova tentativa.
- Notas: ausente, zero explícito e valor positivo diferem visualmente; manter cores e aprovação 25/25/50, inclusive períodos incompletos.
- Contexto: dois vínculos ao mesmo professor em turmas/anos distintos permanecem selecionáveis, sem sobrescrita; sessão válida restaura contexto autorizado.
- Entrega: data real permanece após recarregar; histórico mostra comprovante; formulários não misturam rascunhos de alunos/contextos distintos.
- Feedback: tipos objetiva e multipla_escolha apresentam resposta e acerto; comentário manual/IA aparece coerente com método real.
- Interface: validar celular e computador, teclado, leitor de tela, imagens indisponíveis e ampliação; executar suíte completa e build após implementação.

## Validação desta auditoria

- 48 testes existentes passaram em 9 arquivos: login, sessão, privacidade do portal, devolutivas, histórico, cores e aprovação semestral.
- 5 reproduções adicionais confirmaram as falhas acima com dados sintéticos.
- Logs e instruções de reprodução estão em `evidencias-portal-aluno/`.
- Não houve alteração de código funcional, migração, publicação nem teste com contas reais nesta etapa.

## Pendência de retorno — Atividades Adaptadas

Precisamos voltar para terminar a configuração do armazenamento das imagens. O usuário escolheu manter o plano atual do Firebase; não há autorização para ativar Blaze. Supabase Storage e Vercel Blob foram alternativas discutidas, sem escolha de migração. Próximo passo: escolher armazenamento compatível com essa restrição, configurar permissões e validar salvamento/reabertura/exportação das imagens. Essa pendência não impede a auditoria dos outros módulos.

Próximo módulo da sequência: **Redação Corrigida**, após decisão sobre as sugestões deste Portal.
