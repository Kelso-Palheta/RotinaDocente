# Reutilizar planejamento regular como versão gamificada

## Escopo aprovado
Primeiro passo da integração do hub: partir de plano regular salvo, completo ou por etapas, sem recomeçar nem alterar o original. Criar do zero e jogo avulso seguem disponíveis. Integração opcional direta do jogo avulso e slides ficam fora desta entrega.

## Contrato
- Entrada em Planejamento: Reutilizar planejamento regular no card gamificado e ação Gamificar nos cards regulares de Meus planejamentos.
- Seletor lê planos privados da conta atual. Exibe contexto, etapas, seleção total/parcial e formato de destino. Formato padrão preserva escala do original; professor pode escolher aula ou outro formato. Aula exige10..240min e no máximo10 etapas selecionadas. Não inventar fatos/BNCC ou truncar conteúdos.
- Gerar rascunho por função pura `criarVersaoGamificada(origem,{etapaIds,escalaDestino,duracaoMinutos})`: tipo gamificado, Quiz/padrao, sem questões, sem ID/revisão/timestamps próprios. Preservar disciplina, série, conteúdo, objetivo, contexto, ano e turmas; etapas selecionadas mantêm ordem/textos, desenvolvimento vira jogo. Aula garante3..10etapas com abertura/fechamento quando necessário e soma exata de minutos. Períodos longos usam prazo. Conteúdo e objetivo derivados podem ter até3000 caracteres, sem truncamento.
- Rascunho inclui origem mínima `{planoId,revision,etapaIds}`. Ao confirmar **Criar versão gamificada**, UI usa POST/planos existente com requestId estável e salva novo plano privado. Não cria sala, questões ou notas. Turmas arquivadas são mostradas como não vinculáveis na adaptação; original não muda.
- `salvarPlano` valida origem na mesma transação, após recibo idempotente e antes das escritas: namespace do ator, tipo normal, revisão esperada e etapas existentes/únicas. Recibo repetido retorna mesma cópia, inclusive se original mudou depois.
- Servidor registra origem verificada `{planoId,revision,titulo,escala,etapaIds}`; título/escala enviados pelo cliente são ignorados. Índice pode guardar metadados compactos de origem. Edições posteriores preservam origem imutável sem exigir que original continue na mesma revisão. Não permitir atribuir/trocar origem em plano já existente sem origem; cópia sempre nova.
- Modal mantém opções e requestId em falha incerta, bloqueia edição até repetir; conflito de origem oferece reler versão atual explicitamente. Troca de conta cancela leitura e descarta resposta tardia. Selecione fontes sem descartar edição atual do editor.
- Editor e listagem mostram origem. Conteúdos longos aparecem integralmente. Gerador de questões mantém o plano como contexto visível e pede recorte de tema/objetivo se texto exceder seu contrato, sem enviar requisição incompatível automaticamente.

## Verificação
Novos testes RED para cópia completa/parcial, formatos e soma, ausência de ID compartilhado, texto/contexto preservado, original imutável, origem alheia/forjada/revisão/etapas, idempotência após mudança da fonte, edição independente e troca de conta. Testes UI de seleção, criação/reabertura, novo do zero preservado e origem visível. Sem alterar testes existentes. Suíte/lint/build, capturas desktop/mobile e revisão independente antes de commit/push autorizado.
