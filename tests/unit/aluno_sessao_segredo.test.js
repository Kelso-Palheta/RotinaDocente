import {expect,it} from 'vitest';
import crypto from 'crypto';
import {verifySessionToken,signSessionToken} from '@/lib/aluno/session';
it('recusa assinatura forjada com segredo público antigo',()=>{
 const p=Buffer.from(JSON.stringify({loginKey:'inventado',exp:Math.floor(Date.now()/1000)+1000})).toString('base64url');
 const assinatura=crypto.createHmac('sha256','simuladoapp_edu_super_secure_secret_key_2026_auth').update(p).digest('base64url');expect(verifySessionToken(`${p}.${assinatura}`)).toBeNull();
});
it('sessão emitida pelo servidor mantém identidade e expiração verificáveis',()=>{const token=signSessionToken({loginKey:'lk'});expect(verifySessionToken(token)).toMatchObject({loginKey:'lk'});expect(verifySessionToken(token+'x')).toBeNull();});
