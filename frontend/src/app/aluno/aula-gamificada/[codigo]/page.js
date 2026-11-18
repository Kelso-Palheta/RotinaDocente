import { AcessoAlunoView } from '@/components/aula-gamificada/AcessoAlunoView';

export const metadata = {
  title: 'Sala — Aula Gamificada | Portal do Aluno',
};

export default async function AlunoAulaGamificadaCodigoPage({ params }) {
  const { codigo } = await params;
  return <AcessoAlunoView codigoInicial={codigo} />;
}
