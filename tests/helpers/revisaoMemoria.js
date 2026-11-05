export class RevisaoMemoria {
 constructor(){this.docs=new Map();this.fila=Promise.resolve();this.listeners=new Set();}
 async get(path){return structuredClone(this.docs.get(path)??null);}
 async list(path,filtros=[]){return this.listar(this.docs,path,filtros);}
 listar(docs,path,filtros){const prefix=path+'/';return [...docs].filter(([p,d])=>p.startsWith(prefix)&&!p.slice(prefix.length).includes('/')&&filtros.every(([k,op,v])=>op==='=='&&d[k]===v)).map(([p,d])=>({...structuredClone(d),id:p.slice(prefix.length)}));}
 async set(path,data){this.docs.set(path,structuredClone(data));this.notificar();}
 transaction(fn){const job=this.fila.then(async()=>{const docs=new Map(this.docs);const tx={get:async p=>structuredClone(docs.get(p)??null),list:async(p,f=[])=>this.listar(docs,p,f),set:(p,d)=>docs.set(p,structuredClone(d)),create:(p,d)=>{if(docs.has(p))throw Object.assign(Error('Existe'),{status:409});docs.set(p,structuredClone(d));},delete:p=>docs.delete(p)};const result=await fn(tx);this.docs=docs;this.notificar();return result;});this.fila=job.catch(()=>{});return job;}
 notificar(){for(const fn of this.listeners)queueMicrotask(fn);}
 listenDoc(path,next){let ativo=true;const fn=async()=>{if(ativo)next(await this.get(path));};this.listeners.add(fn);queueMicrotask(fn);return()=>{ativo=false;this.listeners.delete(fn);};}
 listenList(path,filtros,next){let ativo=true;const fn=async()=>{if(ativo)next(await this.list(path,filtros));};this.listeners.add(fn);queueMicrotask(fn);return()=>{ativo=false;this.listeners.delete(fn);};}
}
