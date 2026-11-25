# Módulo Planejamento — implementação

**Objetivo:** separar organização pedagógica da execução de jogos.
**Arquitetura:** ampliar contrato privado de planos de forma retrocompatível; novo módulo docente usa editor compartilhado e biblioteca de modelos. Aula Game recebe referência opcional por URL e relê plano autorizado. Jogos avulsos não mudam.
**Tecnologias:** React/Next, serviços/Firestore atuais, Vitest. Sem novas dependências.

1. Testes RED e domínio/backend para tipo, escala, contexto e barreira regular→sala.
2. Biblioteca autoral100/10 a partir do catálogo local, modelos por escala e testes de integridade.
3. Editor compartilhado para regular/gamificado e escalas, com contexto, seleção segura de modelo e impressão.
4. Módulo central autenticado, card principal e ligação privada para Aula Game; testes de UI/navegação.
5. Revisão, suíte isolada, lint/build, capturas desktop/mobile, commit/push/publicação.

Preservar alterações alheias e testes legados. Não adicionar novas rubricas nem condicionar jogos avulsos a planejamento.
