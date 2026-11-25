'use client';

import React, { useState } from 'react';
import catalogo from '../../../../content/revisao-enem/aulas/visuais.json';
import cenas from '../../../../content/revisao-enem/aulas/cenas.json';
import { TextoAnimado } from './TextoAnimado';
import { ConexoesDoBloco } from './ConexoesDoBloco';
import { criarEtapasExplicacao } from '@/dominio/revisao/apresentacao';
import { useEtapaExplicativa } from './useEtapaExplicativa';
import { ControlesExplicacao } from './ControlesExplicacao';
import { CenaExplicativa } from './CenaExplicativa';
import styles from './slidesExplicativos.module.css';

const urlSegura = (v, local = false) => {
  if (typeof v !== 'string') return false;
  if (local && (/^\/api\/revisao\//.test(v) || /^\/revisao\/visuais\/[a-z0-9._/-]+$/i.test(v))) return true;
  try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
};

function ImagemComentada({ imagem, titulo }) {
  const [erro, setErro] = useState(false);
  const src = imagem?.src || imagem?.url;
  return <figure className={styles.visual}>
    <div className={styles.artFrame}>
      {urlSegura(src, true) && !erro ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img className={styles.photo} src={src} alt={imagem.alt || titulo} loading="lazy" onError={() => setErro(true)} />
      ) : <p role="status" className={styles.failure}>Imagem indisponível. A explicação e o texto completo continuam disponíveis.</p>}
    </div>
    <figcaption className={styles.caption}>
      <strong>{imagem?.legenda || imagem?.alt || titulo}</strong>
      {(imagem?.credito || imagem?.licenca) && <details className={styles.credits}>
        <summary>Créditos e licença</summary>
        {imagem.credito && <span className="block">{imagem.credito}</span>}
        {imagem.alteracoes && <span className="block">{imagem.alteracoes}</span>}
        {imagem.licenca && <span className="block">{imagem.licenca}</span>}
      </details>}
      <span className={styles.links}>
        {urlSegura(imagem?.fonteUrl) && <a aria-label="Fonte da imagem" href={imagem.fonteUrl} target="_blank" rel="noopener noreferrer">Fonte</a>}
        {urlSegura(imagem?.autorUrl) && <a aria-label="Autor da fotografia" href={imagem.autorUrl} target="_blank" rel="noopener noreferrer">Autor</a>}
        {urlSegura(imagem?.licencaUrl) && <a aria-label="Licença de uso" href={imagem.licencaUrl} target="_blank" rel="noopener noreferrer">Licença</a>}
        {urlSegura(src, true) && !erro && <a aria-label="Ampliar imagem" href={src} target="_blank" rel="noopener noreferrer">Ampliar imagem ↗</a>}
      </span>
    </figcaption>
  </figure>;
}

function ApresentacaoBloco({ bloco, imagens, aula, tema }) {
  const baseVisual = catalogo.aulas[aula.conteudoId];
  const cena = cenas.aulas[aula.conteudoId]?.blocos?.[bloco.id];
  const visual = cena && baseVisual ? {
    ...baseVisual, tipoCena: cena.tipoCena,
    imagens: cena.imagemIds.map(id => baseVisual.imagens.find(i => i.id === id)).filter(Boolean),
  } : baseVisual;
  const legado = [...imagens, ...(bloco.imagens || [])].find(i => i.id === bloco.imagemId);
  const esquema = /esquema/.test(bloco.imagemId || '') || /esquema/.test(legado?.url || '');
  const originais = criarEtapasExplicacao(bloco.texto || '');
  // O número de passos continua compatível com o snapshot; o novo exemplo recebe leitura própria.
  const etapas = esquema && visual && !cena
    ? Array.from({ length: Math.max(1, originais.length) }, (_, i) => visual.pontos.slice(
      Math.floor(i * visual.pontos.length / Math.max(1, originais.length)),
      Math.floor((i + 1) * visual.pontos.length / Math.max(1, originais.length)),
    ).map(p => `${p.titulo}: ${p.texto}`).join(' '))
    : originais;
  if (!etapas.length) etapas.push('Observe o exemplo visual e converse sobre as escolhas do artista.');
  const emSala = Boolean(aula.bloco || aula.apresentacao);
  const [local, setLocal] = useState({ etapa: 0, automatica: false, etapaBase: 0, iniciadaEmMs: 0, agoraServidorMs: 0 });
  const apresentacao = aula.apresentacao || { ...local, totalEtapas: etapas.length, intervaloMs: 8000 };
  const etapa = Math.max(0, Math.min(etapas.length - 1, useEtapaExplicativa(apresentacao)));
  const imagem = cena ? visual?.imagens?.[0] : bloco.tipo === 'imagem' && legado && (!esquema || !visual) ? legado : visual?.imagens?.[0];
  const comparacao = visual?.tipoCena === 'comparacao' && visual.imagens.length > 1 && (cena || !legado);
  const indice = aula.indiceBloco !== undefined ? aula.indiceBloco + 1 : null;
  function controlar(acao) {
    const agora = Date.now();
    const proxima = acao === 'repetir_explicacao' ? 0 : acao === 'avancar_explicacao' ? Math.min(etapas.length-1, etapa+1) : acao === 'voltar_explicacao' ? Math.max(0, etapa-1) : etapa;
    setLocal({ etapa: proxima, etapaBase: proxima, automatica: acao === 'reproduzir_explicacao', iniciadaEmMs: agora, agoraServidorMs: agora });
  }
  return <article data-testid="bloco-aula-tematica" data-layout={cena?.layout} className={styles.slide}>
    <header className={styles.header}>
      <div>
        <span className={styles.eyebrow}>{aula.tituloConteudo || tema || 'Explorar · compreender · praticar'}</span>
        <h2>{bloco.titulo}</h2>
      </div>
      {indice !== null && aula.totalBlocos && <span data-testid="indicador-bloco-progresso" className={styles.badge}>Bloco {indice} de {aula.totalBlocos}</span>}
    </header>
    <div className={`${styles.body} ${!imagem ? styles.textOnly : ''}`}>
      {imagem && (comparacao ? <div className={styles.comparison}>{visual.imagens.slice(0,2).map(i=><ImagemComentada key={i.id} imagem={i} titulo={bloco.titulo}/>)}</div> : <ImagemComentada key={imagem.src || imagem.url} imagem={imagem} titulo={bloco.titulo}/>)}
      <div className={styles.discourse}>
        <div className={styles.progress} aria-hidden="true">{etapas.map((_,i)=><span key={i} className={i===etapa?styles.current:i<etapa?styles.done:''}/>)}</div>
        <span className={styles.stepNumber}>Passo {etapa+1} de {etapas.length} · {apresentacao.automatica ? 'Reprodução automática' : 'Leitura guiada'}</span>
        <p key={`${bloco.id}:${etapa}`} data-testid="etapa-explicativa" className={styles.explanation}>{cena ? <TextoAnimado texto={etapas[etapa]} destaques={cena.destaques}/> : etapas[etapa]}</p>
        {cena ? <ConexoesDoBloco cena={cena} textoEtapa={etapas[etapa]} textoApresentado={etapas.slice(0,etapa+1).join(" ")}/> : visual && <CenaExplicativa conteudoId={aula.conteudoId} tipo={visual.tipoCena} pontos={visual.pontos} etapa={etapa} totalEtapas={etapas.length}/>}
      </div>
    </div>
    <footer className={styles.footer}>
      {!emSala && <ControlesExplicacao apresentacao={apresentacao} onAcao={controlar}/>}
      {bloco.texto && (etapas.length > 1 || esquema) && <details className={styles.study}><summary>Texto completo para estudo</summary>{esquema && visual && <p>Texto original do acervo. A leitura guiada acima apresenta o novo exemplo visual.</p>}<p>{bloco.texto}</p>{esquema && urlSegura(legado?.url, true) && <a aria-label="Esquema original do acervo" href={legado.url} target="_blank" rel="noopener noreferrer">Esquema original do acervo ↗</a>}</details>}
    </footer>
  </article>;
}

export function BlocoAulaTematica({ bloco, imagens = [], aula = {}, tema = '' }) {
  if (!bloco) return null;
  return <ApresentacaoBloco key={`${aula.conteudoId || ''}:${bloco.id}`} bloco={bloco} imagens={imagens} aula={aula} tema={tema}/>;
}
export default BlocoAulaTematica;
