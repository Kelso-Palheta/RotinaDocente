# Aula Gamificada unificada — plano de implementação

**Objetivo:** consolidar três áreas e oferecer todos os jogos em sala e em revisão individual.
**Arquitetura:** manter motores atuais; compor entradas únicas e adaptador de sessão autônoma schema 3 sobre domínio/componentes compartilhados. Plataforma em sala usa Quiz com apresentação de percurso; sessões V1/V2 não mudam.
**Tecnologias:** React/Next.js, Vitest, serviço transacional Firestore existente.

1. Criar regressões de navegação (docente/aluno), catálogo e nove modalidades autônomas; confirmar RED.
2. Criar `sessaoJogos.js` na aplicação, com projeção privada/ações e reuse de correção, memória, heróis, tabuleiro e natação; integrar ao serviço autônomo e ampliar publicação apenas a tipos objetivos revisados. Validar payload/revisão/idempotência e vínculo em cada ação. Confirmar GREEN e regressões V1/V2.
3. Adaptar revisão autônoma para escolha de jogo e quantidade; renderizar jogos existentes com estado de sala sintetizado no servidor e ações autônomas. Manter preparação e jogabilidade da plataforma. Testar retomada e feedback das modalidades.
4. Criar entrada única e três áreas para docentes/alunos; preservar URLs e acesso pelos cartões existentes. Acrescentar experiência plataforma na preparação/sala com flag validada, sem novo ID no catálogo legado. Testar ações reais e controle docente.
5. Revisar segurança/persistência e matriz completa; capturar desktop/mobile com dados sintéticos, suíte completa em cópia isolada, lint/build; publicar somente sem falhas conhecidas.

Execução neste chat autorizada pelo usuário; Antigravity indisponível. As cinco modificações alheias já presentes permanecem fora da entrega.
