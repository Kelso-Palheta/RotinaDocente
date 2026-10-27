import { describe,it,expect } from 'vitest';
import { extractScore } from '@/lib/redacao/scores';
const full={c1:120,c2:160,c3:120,c4:160,c5:80,total:640};
describe('RN73 notas de redação',()=>{
 it('recusa valores inválidos e soma divergente',()=>{expect(extractScore(JSON.stringify({...full,c1:250}))).toBeNull();expect(extractScore(JSON.stringify({...full,total:999}))).toBeNull();});
 it('não transforma ausência ou decimal/texto parcial em zero/inteiro',()=>{for(const data of [{c1:160},{...full,c1:120.5},{...full,c1:null},{...full,c1:'120abc'}])expect(extractScore(JSON.stringify(data))).toBeNull();});
 it('parcial contém só competências escolhidas e nenhum total',()=>{expect(extractScore('{"c1":160,"c3":80}',{competencies:['C1','C3']})).toMatchObject({modo:'parcial',total:null,items:[{subject:'C1',A:160},{subject:'C3',A:80}]});});
 it('anulação requer motivo explícito e zeros válidos',()=>{const data={c1:0,c2:0,c3:0,c4:0,c5:0,total:0,anulada:true,motivoAnulacao:'Fuga ao tema'};expect(extractScore(JSON.stringify(data))).toMatchObject({total:0,anulada:true,motivoAnulacao:'Fuga ao tema'});expect(extractScore(JSON.stringify({...data,motivoAnulacao:''}))).toBeNull();});
});
