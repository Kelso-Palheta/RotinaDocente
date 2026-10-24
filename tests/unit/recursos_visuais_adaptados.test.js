import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prepararRecursosVisuais, possuiVisualV2 } from '../../frontend/src/infraestrutura/adaptacoes/recursosVisuais';
import { assinaturaVisual, imagemAprovada, gerarDesenhoExato } from '../../frontend/src/dominio/adaptacoes/qualidadeVisual';
import { AtividadeAdaptadaRepository } from '../../frontend/src/infraestrutura/adaptacoes/AtividadeAdaptadaRepository';
import { QuestaoAdaptadaRepository } from '../../frontend/src/infraestrutura/adaptacoes/QuestaoAdaptadaRepository';
import { ProvaAdaptadaRepository } from '../../frontend/src/infraestrutura/adaptacoes/ProvaAdaptadaRepository';
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6KZkAAAAASUVORK5CYII=';
const questao=()=>({id:'q1',enunciado:'Conte',imagemUrl:png,apoioVisualDescricao:'Uma figura',visual:{versao:2,metadados:{width:1200,height:1200,mime:'image/png'},original:{imagemUrl:png},historico:[{imagemUrl:png}]}});
beforeEach(()=>{const m=new Map();global.localStorage={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};});
describe('RN72 recursos visuais',()=>{
 it('externaliza original, histórico e resultado uma vez sem mutar e mantém aprovação válida',async()=>{
 const q=questao();q.visual.aprovacao={professorId:'u',assinatura:assinaturaVisual(q)};
 const enviar=vi.fn(async({caminho})=>`https://firebasestorage.googleapis.com/${caminho}`);
 const data=await prepararRecursosVisuais('u',{questoes:[q]},{enviar});
 const salvo=data.questoes[0];expect(enviar).toHaveBeenCalledTimes(1);expect(enviar.mock.calls[0][0].caminho).toMatch(/^professores\/u\/imagens-adaptadas\/[a-f0-9]{64}\.png$/);
 expect(salvo.visual.original.imagemUrl).toBe(salvo.imagemUrl);expect(salvo.visual.historico[0].imagemUrl).toBe(salvo.imagemUrl);expect(imagemAprovada(salvo)).toBe(true);expect(q.imagemUrl).toBe(png);
 });
 it('não restaura aprovação já invalidada',async()=>{const q=questao();q.visual.aprovacao={professorId:'u',assinatura:'antiga'};const salvo=await prepararRecursosVisuais('u',q,{enviar:async()=> 'https://example.org/a.png'});expect(imagemAprovada(salvo)).toBe(false);expect(salvo.visual.aprovacao).toBeNull();});
 it('só aceita SVG idêntico ao desenho determinístico do plano',async()=>{const plano={tipo:'contagem',quantidade:3};const desenho=gerarDesenhoExato(plano);const q={...questao(),imagemUrl:desenho.imagemUrl,planoVisual:plano};expect(possuiVisualV2(q)).toBe(true);const enviar=vi.fn(async()=> 'https://example.org/a.svg');await prepararRecursosVisuais('u',q,{enviar});expect(enviar).toHaveBeenCalledTimes(2);q.imagemUrl='data:image/svg+xml,'+encodeURIComponent('<svg><script>alert(1)</script></svg>');await expect(prepararRecursosVisuais('u',q,{enviar})).rejects.toThrow(/SVG/);});
 it('rejeita protocolo ativo, bytes inválidos e usuário ausente',async()=>{await expect(prepararRecursosVisuais('',questao(),{enviar:vi.fn()})).rejects.toThrow(/login|autentic/i);for(const imagemUrl of ['javascript:alert(1)','data:image/png;base64,aGVsbG8='])await expect(prepararRecursosVisuais('u',{...questao(),imagemUrl},{enviar:vi.fn()})).rejects.toThrow();});
 for(const [Repo,salvar,listar,envolver] of [[AtividadeAdaptadaRepository,'salvarAtividade','listarAtividades',q=>({id:'a',atividadeAdaptada:{questoes:[q]}})],[QuestaoAdaptadaRepository,'salvarQuestao','listarQuestoes',q=>q],[ProvaAdaptadaRepository,'salvarProva','listarProvas',q=>({id:'p',questoes:[q]})]]){
 it(`${Repo.name}: falha explícita e rascunho preservado apesar da nuvem vazia`,async()=>{const db={collection:()=>({doc:()=>({collection:()=>({doc:()=>({set:async()=>{throw Error('offline');}}),get:async()=>({docs:[]})})})})};const repo=new Repo({firestoreDb:db,recursosVisuais:{enviar:async()=> 'https://example.org/a.png'}});await expect(repo[salvar]('u',envolver(questao()))).rejects.toThrow(/rascunho|pendente/i);const lista=await repo[listar]('u');expect(lista).toHaveLength(1);expect(lista[0].sincronizacaoVisual.status).toBe('pendente');});
 }
});

describe('RN72 limites e confirmação de armazenamento',()=>{
 it('deduplica os mesmos pixels em questões concorrentes',async()=>{const enviar=vi.fn(async()=> 'https://example.org/unica.png');await prepararRecursosVisuais('u',{questoes:[questao(),{...questao(),id:'q2'}]},{enviar});expect(enviar).toHaveBeenCalledTimes(1);});
 it('não permite histórico ilimitado nem documento acima do limite do Firestore',async()=>{const q=questao();q.visual.historico=Array.from({length:9},()=>({imagemUrl:png}));await expect(prepararRecursosVisuais('u',q,{enviar:vi.fn()})).rejects.toThrow(/histórico/);await expect(prepararRecursosVisuais('u',{...questao(),enunciado:'x'.repeat(950000)},{enviar:async()=> 'https://example.org/a.png'})).rejects.toThrow(/grande/);});
 it('avisa explicitamente quando não pode preservar rascunho por quota',async()=>{global.localStorage.setItem=()=>{throw Error('quota');};const repo=new QuestaoAdaptadaRepository();await expect(repo.salvarQuestao('u',questao())).rejects.toThrow(/Espaço local insuficiente/);});
 it('grava referências e metadados na nuvem e confirma sincronização',async()=>{const set=vi.fn(async()=>{});const db={collection:()=>({doc:()=>({collection:()=>({doc:()=>({set})})})})};const repo=new QuestaoAdaptadaRepository({firestoreDb:db,recursosVisuais:{enviar:async()=> 'https://example.org/a.png'}});const q=await repo.salvarQuestao('u',questao());expect(set).toHaveBeenCalledTimes(1);expect(q.sincronizacaoVisual.status).toBe('sincronizado');expect(q.imagemUrl).toBe('https://example.org/a.png');expect(q.visual.metadados.sha256).toMatch(/^[a-f0-9]{64}$/);expect(JSON.stringify(set.mock.calls[0][0])).not.toContain('data:image');});
});
