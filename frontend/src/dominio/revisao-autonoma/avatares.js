import { falha } from '@/dominio/aula-gamificada/comum';
export const AVATAR_PADRAO = 'luna';
export const AVATARES_AVENTURA = Object.freeze([
  { id:'leo', nome:'Léo', papel:'Explorador', perfil:'masculino', cor:'#FFB000' },
  { id:'lia', nome:'Lia', papel:'Exploradora', perfil:'feminino', cor:'#00DDEB' },
  { id:'kai', nome:'Kai', papel:'Guardião', perfil:'masculino', cor:'#B9EF00' },
  { id:'maya', nome:'Maya', papel:'Guardiã', perfil:'feminino', cor:'#FF2C9C' },
  { id:'caio', nome:'Caio', papel:'Astronauta', perfil:'masculino', cor:'#A978FF' },
  { id:'luna', nome:'Luna', papel:'Astronauta', perfil:'feminino', cor:'#00DDEB' },
  { id:'pixel', nome:'Pixel', papel:'Robô das ideias', perfil:'fantastico', cor:'#00DDEB' },
  { id:'faisca', nome:'Faísca', papel:'Raposa estelar', perfil:'fantastico', cor:'#FF9500' },
].map(a => Object.freeze({ ...a, imagem:`/aula-gamificada/avatares/${a.id}.svg` })));
export function avatarPorId(id) { return AVATARES_AVENTURA.find(a=>a.id===id) || AVATARES_AVENTURA.find(a=>a.id===AVATAR_PADRAO); }
export function validarAvatar(id) {
  if (id == null) return AVATAR_PADRAO;
  if (typeof id !== 'string' || !AVATARES_AVENTURA.some(a=>a.id===id)) throw falha(422,'Escolha um avatar disponível.');
  return id;
}
