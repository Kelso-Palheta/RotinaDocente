import {it,expect} from 'vitest';
import {podeLerRedacao} from '@/dominio/redacao/acessoAluno';
const session={login:'ana1234',loginKey:'lk'},vinculo={professorUid:'p',alunoId:'a',turmaId:'t'};
it('RN73 legado explicitamente não publicado e estados internos alternativos não são públicos',()=>{for(const correction of [{loginKey:'lk',publicado:false},{loginKey:'lk',status:'draft'},{loginKey:'lk',status:'archived'}])expect(podeLerRedacao(correction,session,vinculo,'p')).toBe(false);});
it('RN73 não escolhe uma identidade de login para ignorar a outra contraditória',()=>{expect(podeLerRedacao({loginAluno:'ana1234',login:'colega',loginKey:'lk'},session,vinculo,'p')).toBe(false);});
