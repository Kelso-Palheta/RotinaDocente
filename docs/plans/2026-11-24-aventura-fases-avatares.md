# Aventura do Conhecimento — plano

**Objetivo:** ampliar a aventura para seis fases, tornar estrelas compreensíveis e oferecer oito personagens escolhidos pelo aluno.
**Arquitetura:** domínio puro define limites/avatares; aplicação valida e congela avatar/layout no snapshot V2; apresentação compartilha catálogo, seletor e renderer de sprites locais. Legado sem versão explícita mantém layout 2.
**Tecnologias:** React/Next.js, Canvas2D, SVG local, Vitest.

1. Testes RED para 6×3/24, estrela inicial/layout antigo, diversidade de arte e validação de avatares; componente de seleção e payload. Adaptar apenas expectativas antigas autorizadas dos limites.
2. Atualizar limites/geração de mundo versionada e validação da criação; persistir/projetar avatarId e layoutVersao com defaults compatíveis.
3. Criar oito SVGs originais, seletor acessível e renderização Canvas; integrar preparação e retomada sem alterar hitbox nem lifecycle do percurso.
4. Conferir física das seis fases, estrelas, ida/volta das questões, histórico, áudio/controles e segurança. Capturar telas desktop/mobile; suíte, lint/build; commit/push automático apenas com validações aprovadas.
