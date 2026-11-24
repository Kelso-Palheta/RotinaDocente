import Link from 'next/link';
import { HubDocente } from '@/components/aula-gamificada/HubDocente';
export default function Page() { return <><aside className="arte-pagina p-5 text-[#25104A]"><Link href="/aula-gamificada" className="font-bold underline">← Aula Gamificada</Link><h1 className="mt-3 text-3xl font-black">Revisar sozinho · conteúdos dos alunos</h1><p className="mt-2">No Banco de Questões, abra uma questão revisada e escolha “Revisar sozinho · liberar para turmas”. Os alunos acessam os jogos pelo próprio Portal, com histórico individual.</p></aside><HubDocente /></>; }
