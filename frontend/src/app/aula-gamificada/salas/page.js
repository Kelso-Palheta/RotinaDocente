import { NavegacaoAulaGamificada } from '@/components/aula-gamificada/NavegacaoAulaGamificada';
import { HubDocente } from '@/components/aula-gamificada/HubDocente';
export const metadata = { title: 'Sala de jogos | Aula Gamificada' };
export default function Page() { return <><NavegacaoAulaGamificada ativa="salas" /><HubDocente /></>; }
