import { NavegacaoAulaGamificada } from '@/components/aula-gamificada/NavegacaoAulaGamificada';
import { IntegracaoDocente } from '@/components/revisao/IntegracaoDocente';
export const metadata = { title: 'Revisão ao Vivo | Rotina Docente' };
export default function RevisaoPage() { return <><NavegacaoAulaGamificada ativa="revisao" /><IntegracaoDocente /></>; }
