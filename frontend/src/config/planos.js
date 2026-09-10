/**
 * Configuração Oficial de Planos e Entitlements de Módulos — Gestão Docente
 */

export const PLANOS_CONFIG = {
  // 🆓 Plano Gratuito / Freemium
  gratuito: {
    id: 'gratuito',
    nome: 'Degustação Grátis',
    tag: 'Gratuito',
    precoMensal: 0,
    precoAnual: 0,
    descricao: 'Para gerenciar notas, faltas e publicar boletins sem custos.',
    modulos: ['diario-planejamento', 'horario-escolar'],
    destaque: false,
  },

  // 🎓 Plano 1: Professor Geral (Essencial Hub)
  professor_geral: {
    id: 'professor_geral',
    nome: 'Professor Geral',
    tag: 'Mais Popular Docente',
    precoMensal: 14.90,
    precoAnual: 11.90,
    descricao: 'Acesso completo ao Hub Pedagógico (exceto módulo de redação).',
    modulos: [
      'diario-planejamento',
      'horario-escolar',
      'calendario-pedagogico',
      'gerador-atividades',
      'agente-linguagens',
      'analytics-pedagogico',
    ],
    destaque: true,
  },

  // ✍️ Plano Especialista: Redação ENEM (Opcional)
  especialista_redacao: {
    id: 'especialista_redacao',
    nome: 'Especialista Redação',
    tag: 'Língua Portuguesa',
    precoMensal: 19.90,
    precoAnual: 14.90,
    descricao: 'Focado em professores de redação e linguagens com OCR & IA.',
    modulos: ['diario-planejamento', 'horario-escolar', 'redacao-corretor'],
    destaque: false,
  },

  // ⭐ Plano 2: Hub Completo Pro
  hub_completo: {
    id: 'hub_completo',
    nome: 'Hub Completo Pro',
    tag: 'Suíte Total IA',
    precoMensal: 24.90,
    precoAnual: 19.90,
    descricao: 'Todos os módulos do Hub liberados, incluindo correção de redação ENEM.',
    modulos: [
      'diario-planejamento',
      'horario-escolar',
      'calendario-pedagogico',
      'gerador-atividades',
      'agente-linguagens',
      'analytics-pedagogico',
      'redacao-corretor',
      'horario-escolar-inteligente',
    ],
    destaque: false,
  },

  // 🚀 Plano 3: Combo Total (Hub Completo + SimuladoApp Básico)
  combo_total: {
    id: 'combo_total',
    nome: 'Combo Total Hub + SimuladoApp',
    tag: 'Solução Completa',
    precoMensal: 39.90,
    precoAnual: 29.90,
    descricao: 'Hub Completo + Plataforma de Simulados Online com ranking e correção TRI.',
    modulos: [
      'diario-planejamento',
      'horario-escolar',
      'calendario-pedagogico',
      'gerador-atividades',
      'agente-linguagens',
      'analytics-pedagogico',
      'redacao-corretor',
      'horario-escolar-inteligente',
      'simuladoapp_basico',
    ],
    destaque: false,
  },
};

/**
 * Verifica se um usuário possui permissão para acessar um determinado módulo.
 * @param {Object} perfil - Perfil do usuário logado
 * @param {string} moduloId - ID do módulo a ser verificado
 * @returns {boolean}
 */
export function verificarPermissaoModulo(perfil, moduloId) {
  // Diário Pedagógico é 100% gratuito para todos
  if (moduloId === 'diario-planejamento') return true;

  if (!perfil) return false;

  // Administrador ou plano com acesso total
  if (perfil.plano === 'combo_total' || perfil.plano === 'hub_completo' || perfil.isAdmin) {
    return true;
  }

  // Verifica se o array modulos_permitidos contém o ID ou '*'
  if (Array.isArray(perfil.modulos_permitidos)) {
    if (perfil.modulos_permitidos.includes('*') || perfil.modulos_permitidos.includes(moduloId)) {
      return true;
    }
  }

  // Verifica pelo plano associado
  if (perfil.plano && PLANOS_CONFIG[perfil.plano]) {
    return PLANOS_CONFIG[perfil.plano].modulos.includes(moduloId);
  }

  return false;
}
