import React,{StrictMode} from 'react';
import {render,screen,act,cleanup,fireEvent} from '@testing-library/react';
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({tokens:{access:'token-a'},callback:null,perfil:vi.fn(),saldo:vi.fn(),sair:vi.fn(),getDoc:vi.fn()}));
vi.mock('@/lib/firebase',()=>({auth:{},db:{}}));
vi.mock('../../../../frontend/node_modules/firebase/auth/dist/index.mjs',()=>({onAuthStateChanged:vi.fn((_,cb)=>{m.callback=cb;return vi.fn();}),signInWithPopup:vi.fn(),GoogleAuthProvider:vi.fn(),signInWithEmailAndPassword:vi.fn(),createUserWithEmailAndPassword:vi.fn(),signOut:()=>m.sair(),sendPasswordResetEmail:vi.fn()}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({doc:vi.fn(),getDoc:(...args)=>m.getDoc(...args),setDoc:vi.fn()}));
vi.mock('@/lib/api-client',()=>({api:{getTokens:()=>m.tokens,clearTokens:()=>{m.tokens={};},auth:{perfil:()=>m.perfil(),saldoCreditos:()=>m.saldo()}}}));
import {AuthProvider,useAuth} from '@/lib/auth-context';
const pendente=()=>{let resolver;const promise=new Promise(r=>{resolver=r;});return{promise,resolver};};
function Estado(){const a=useAuth();return <><output>{JSON.stringify({uid:a.user?.uid??null,nome:a.perfil?.nome??null,loading:a.loading})}</output><button onClick={a.logout}>Sair</button></>;}
const estado=()=>JSON.parse(screen.getByRole('status').textContent);
beforeEach(()=>{m.tokens={access:'token-a'};m.callback=null;m.perfil.mockReset();m.saldo.mockResolvedValue({saldo_disponivel:7});m.sair.mockResolvedValue();m.getDoc.mockResolvedValue({exists:()=>true,data:()=>({nome:'Firebase B'})});});
afterEach(cleanup);
it('aguarda o perfil Django quando o Firebase inicial não tem usuário',async()=>{
 const p=pendente();m.perfil.mockReturnValue(p.promise);render(<AuthProvider><Estado/></AuthProvider>);
 await act(async()=>{await m.callback(null);});expect(estado().loading).toBe(true);
 await act(async()=>{p.resolver({id:1,email:'a@teste.com',nome_completo:'Conta A'});});
 expect(estado()).toEqual({uid:'1',nome:'Conta A',loading:false});
});
it('não restaura o usuário de uma requisição anterior ao logout',async()=>{
 const p=pendente();m.perfil.mockReturnValue(p.promise);render(<AuthProvider><Estado/></AuthProvider>);
 fireEvent.click(screen.getByText('Sair'));await act(async()=>{p.resolver({id:1,email:'a@teste.com',nome_completo:'Conta A'});});
 expect(estado().uid).toBeNull();expect(estado().nome).toBeNull();
});
it('não sobrescreve a sessão Firebase atual com um perfil Django atrasado',async()=>{
 const p=pendente();m.perfil.mockReturnValue(p.promise);render(<AuthProvider><Estado/></AuthProvider>);
 await act(async()=>{await m.callback({uid:'firebase-b',email:'b@teste.com'});});
 await act(async()=>{p.resolver({id:1,email:'a@teste.com',nome_completo:'Conta A'});});
 expect(estado()).toEqual({uid:'firebase-b',nome:'Firebase B',loading:false});
});
it('reativa a inicialização no segundo setup do StrictMode',async()=>{
 const antigo=pendente(),atual=pendente();m.perfil.mockReturnValueOnce(antigo.promise).mockReturnValueOnce(atual.promise);
 render(<StrictMode><AuthProvider><Estado/></AuthProvider></StrictMode>);
 await act(async()=>{atual.resolver({id:2,email:'b@teste.com',nome_completo:'Conta B'});});
 await act(async()=>{antigo.resolver({id:1,email:'a@teste.com',nome_completo:'Conta A'});});
 expect(estado()).toEqual({uid:'2',nome:'Conta B',loading:false});
});
it('aceita renovação do access quando o refresh continua na mesma sessão',async()=>{
 m.tokens={access:'expirado',refresh:'refresh-a'};const p=pendente();m.perfil.mockReturnValue(p.promise);
 render(<AuthProvider><Estado/></AuthProvider>);m.tokens={access:'renovado',refresh:'refresh-a'};
 await act(async()=>{p.resolver({id:1,email:'a@teste.com',nome_completo:'Conta A'});});
 expect(estado()).toEqual({uid:'1',nome:'Conta A',loading:false});
});
it('aceita rotação dos dois JWTs para a mesma identidade Django',async()=>{
 const jwt=(id,exp)=>'e30.'+btoa(JSON.stringify({user_id:id,exp}))+'.assinatura';
 m.tokens={access:jwt(1,1),refresh:'refresh-antigo'};const p=pendente();m.perfil.mockReturnValue(p.promise);
 render(<AuthProvider><Estado/></AuthProvider>);m.tokens={access:jwt(1,2),refresh:'refresh-novo'};
 await act(async()=>{p.resolver({id:1,email:'a@teste.com',nome_completo:'Conta A'});});
 expect(estado().uid).toBe('1');
});
it('recusa resposta da conta anterior quando os tokens mudam para outro usuário',async()=>{
 const jwt=id=>'e30.'+btoa(JSON.stringify({user_id:id}))+'.assinatura';
 m.tokens={access:jwt(1),refresh:'refresh-a'};const p=pendente();m.perfil.mockReturnValue(p.promise);
 render(<AuthProvider><Estado/></AuthProvider>);m.tokens={access:jwt(2),refresh:'refresh-b'};
 await act(async()=>{p.resolver({id:1,email:'a@teste.com',nome_completo:'Conta A'});});
 expect(estado().uid).toBeNull();
});
