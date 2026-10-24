'use client';
import {useState,useMemo,useEffect,useCallback,useRef} from 'react';
import {useAuth} from '@/lib/auth-context';
import {CalendarioRepository} from '@/infraestrutura/calendario/CalendarioRepository';

export function useCalendarioPedagogico(anoLetivo=new Date().getFullYear(),turmaId=null){
  const {user}=useAuth();
  const uid=user?.uid;
  const repo=useMemo(()=>uid?new CalendarioRepository(uid):null,[uid]);
  const chave=`${user?.uid||''}:${turmaId||''}:${anoLetivo}`;
  const [resultado,setResultado]=useState(null);
  const [versao,setVersao]=useState(0);
  const [salvando,setSalvando]=useState(false);
  const gravando=useRef(false);
  useEffect(()=>{
    if(!repo||!turmaId)return;
    let ativo=true;
    repo.carregar(turmaId,Number(anoLetivo)).then(estado=>{if(ativo)setResultado({chave,estado,error:null});}).catch(error=>{if(ativo)setResultado({chave,estado:null,error:error.message});});
    return ()=>{ativo=false;};
  },[repo,turmaId,anoLetivo,chave,versao]);
  const estado=resultado?.chave===chave?resultado.estado:null;
  const error=resultado?.chave===chave?resultado.error:null;
  const aplicar=useCallback(async mudancas=>{
    if(!repo||!estado)throw new Error('Aguarde o carregamento do calendário.');
    if(gravando.current)throw new Error('Aguarde a gravação em andamento.');
    gravando.current=true;setSalvando(true);
    try{
      const novo=await repo.salvar(estado,mudancas);
      setResultado(prev=>prev?.chave===chave?{chave,estado:novo,error:null}:prev);
      return novo;
    }finally{gravando.current=false;setSalvando(false);}
  },[repo,estado,chave]);
  const salvarPlanejamento=useCallback(async(tid,topicos)=>{
    if(!repo)throw new Error('Entre na sua conta.');
    const atual=await repo.carregar(tid,Number(anoLetivo));
    return repo.salvar(atual,{planejamento:{topicos:topicos||[]}});
  },[repo,anoLetivo]);
  return {estado,error,loading:Boolean(repo&&turmaId&&resultado?.chave!==chave),salvando,aplicar,recarregar:()=>setVersao(v=>v+1),salvarPlanejamento,carregarEstado:repo?.carregar.bind(repo)};
}
