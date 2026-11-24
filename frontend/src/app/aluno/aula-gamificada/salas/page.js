import { NavegacaoAulaGamificada } from '@/components/aula-gamificada/NavegacaoAulaGamificada';
import { AcessoAlunoView } from '@/components/aula-gamificada/AcessoAlunoView';
export const metadata = { title: 'Sala de jogos | Portal do Aluno' };
export default function Page() { return <><NavegacaoAulaGamificada aluno ativa="salas" /><AcessoAlunoView /></>; }
