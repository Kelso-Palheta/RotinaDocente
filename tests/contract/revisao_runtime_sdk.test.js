import {it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

it('carrega o Firebase Auth real com require(esm) habilitado, como exige o runtime Vercel',()=>{
 const cwd=fileURLToPath(new URL('../../frontend/',import.meta.url));
 const comando='const {getAuth}=require("firebase-admin/auth");if(typeof getAuth!=="function")process.exit(2);';
 const ambiente={...process.env};delete ambiente.NODE_OPTIONS;
 const semCompatibilidade=spawnSync(process.execPath,['--no-experimental-require-module','-e',comando],{cwd,env:ambiente,encoding:'utf8'});
 expect(semCompatibilidade.status).not.toBe(0);
 expect(semCompatibilidade.stderr).toContain('ERR_REQUIRE_ESM');
 const compativel=spawnSync(process.execPath,['--no-experimental-require-module','--experimental-require-module','-e',comando],{cwd,env:ambiente,encoding:'utf8'});
 expect(compativel.status,compativel.stderr).toBe(0);
},10000);
