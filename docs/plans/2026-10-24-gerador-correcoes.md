# Correções do Gerador de Atividades — plano

**Objetivo:** corrigir os defeitos da auditoria de 24/10 preservando atividades, entregas e notas. Banco de questões e novas exportações ficam fora desta correção.

**Arquitetura:** domínio puro para validação/projeção; infraestrutura para acesso e persistência; hooks para orquestração; componentes/rotas para apresentação. Reutilizar fila segura do Diário. Novos links têm segredo aleatório; links legados exigem sessão e vínculo verificado.

**Stack:** Next.js, React, Firebase, Vitest/Testing Library.

1. Especificar RN-69 e testes de acesso, editor, notas e ciclo de vida.
2. Criar testes novos, observar falhas antes de implementar cada grupo.
3. Acesso: validar token emitido/revogável e vínculo, projeção pública mínima, entrega transacional sem sobrescrever correção. Adequar cliente e preservar leitura de entregas legadas.
4. Editor: aguardar gravação, ID estável, prazo local consistente, gabarito/escala válidos, bloqueio durante extração, contexto inicial; pontuação da geração e imagens na correção.
5. Notas: similaridade informativa; contexto/erros explícitos; identidade do professor; sincronização/publicação explícitas no módulo, mantendo compatibilidade dos componentes legados.
6. Ciclo: persistência segura do Diário, criação recuperável, reconciliação de vínculos, bloqueio de edição estrutural com entregas, arquivamento preservando histórico.
7. Interface: ano/arquivo, contexto, restauração conectada, resumo e repetição; documentar.
8. Validar suíte completa, build e lint. Não alterar testes existentes, operar banco real ou fazer commit/push nesta tarefa.
