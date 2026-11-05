# Revisão ENEM — editar sala

Em “Retomar uma sala”, oferecer “Editar sala” para a sala do próprio professor em fase de espera. Reutilizar o formulário de preparação preenchido com a configuração atual. Permitir editar título, turmas, temas, seleção e ordem das questões, tempo padrão e tempos individuais. Salvar na mesma sala: código, link, dono, data de criação e participantes permanecem. Após início, a configuração fica bloqueada. Se já houver participantes na espera, permitir editar os demais campos, mantendo turmas e lista de alunos congeladas.

## Contrato
- GET /api/revisao/salas/{codigo}/edicao: somente docente proprietário. Retorna seleção, versão da sala e permissão de editar turmas; sem nomes de participantes, gabaritos ou conteúdo privado das questões.
- POST na mesma rota: recebe seleção e revisão esperada. Transação valida dono, fase de espera, revisão e participantes antes de qualquer escrita. Concorrência ou sala iniciada: 409; seleção inválida: 422. Na interface, preservar rascunho e oferecer recarregar após conflito; jamais sobrescrever automaticamente.
- Reutilizar validação da criação: turmas ativas, limite do roster, aulas/questões aprovadas, vínculo temático, quantidade e duração. A operação preserva o contrato da versão da sala; salas legadas aceitam os campos aplicáveis, sem migração implícita.
- Guardar conteúdos e rodadas selecionados com os mesmos limites da criação. Material que não mudou deve conservar sua versão congelada; validar aprovações e compatibilidade antes de aceitar alterações de conteúdo. Atualizar seleção e publicação de espera na mesma transação, sem expor respostas. Incrementar revisão uma vez. Não alterar recibos, ranking nem sessão do aluno.
- A entrada de aluno e a alteração de turmas devem competir pela mesma versão transacional, garantindo que uma matrícula recém-admitida não seja removida pela edição concorrente.

## Verificação
- ED-01: formulário com valores reais; editar e reabrir com mesmo código/link e nova configuração.
- ED-02: proprietário apenas; aluno e outro docente rejeitados. Nenhum material privado exposto.
- ED-03: início concorrente, versão antiga e troca de turma após entrada bloqueados; título/tempo ainda editáveis na espera.
- ED-04: rejeitar questões incompatíveis, tempos inválidos e turma arquivada; preservar histórico, projeção e fluxo legado.
