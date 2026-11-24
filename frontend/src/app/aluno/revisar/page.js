import { NavegacaoAulaGamificada } from '@/components/aula-gamificada/NavegacaoAulaGamificada';
import { RevisaoAutonoma } from '@/components/revisao-autonoma/RevisaoAutonoma';
export const metadata = { title: 'Revisar sozinho | Aula Gamificada' };
export default function Page() { return <><NavegacaoAulaGamificada aluno ativa="solo" /><RevisaoAutonoma /></>; }
