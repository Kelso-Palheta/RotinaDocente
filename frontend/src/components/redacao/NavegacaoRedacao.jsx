import Link from 'next/link';
import { ArrowLeft, BookOpen, ChartNoAxesCombined, PenLine } from 'lucide-react';

export function NavegacaoRedacao({ pagina, onNova, ocupado = false }) {
  const itens = [
    { id: 'correcao', href: '/redacao', nome: 'Nova redação', Icone: PenLine },
    { id: 'historico', href: '/redacao/desempenho', nome: 'Histórico e evolução', Icone: ChartNoAxesCombined },
    { id: 'criterios', href: '/redacao/criterios', nome: 'Critérios ENEM', Icone: BookOpen },
  ];
  return (
    <aside className="arte-menu-redacao">
      <Link href="/" className="arte-menu-voltar"><ArrowLeft size={16} aria-hidden="true" /> Voltar ao Hub</Link>
      <p className="arte-menu-marca">Redação Corrigida</p>
      <nav aria-label="Navegação da Redação" className="arte-menu-itens">
        {itens.map(({ id, href, nome, Icone }) => {
          const conteudo = <><Icone size={17} aria-hidden="true" /> {nome}</>;
          if (id === 'correcao' && onNova) {
            return <button key={id} type="button" disabled={ocupado} onClick={onNova}
              aria-current="page" className="arte-menu-item">{conteudo}</button>;
          }
          return <Link key={id} href={href} aria-current={pagina === id ? 'page' : undefined}
            className="arte-menu-item">{conteudo}</Link>;
        })}
      </nav>
    </aside>
  );
}
