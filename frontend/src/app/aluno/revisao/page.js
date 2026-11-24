import { NavegacaoAulaGamificada } from '@/components/aula-gamificada/NavegacaoAulaGamificada';
import { IntegracaoAluno } from '@/components/revisao/IntegracaoAluno';
export const metadata = { title: 'Participar da revisão | Rotina Docente' };
export default function AlunoRevisaoPage() { return <><NavegacaoAulaGamificada aluno ativa="revisao" /><IntegracaoAluno /></>; }
