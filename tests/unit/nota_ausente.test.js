import { expect, it } from 'vitest';
import { temNota } from '@/utils/diario/calculos';
it('null em notas importadas significa ausência; zero continua nota lançada', () => {
 const atividades = [{id:'a'}];
 expect(temNota({simulado:null,a:null}, atividades)).toBe(false);
 expect(temNota({simulado:0}, atividades)).toBe(true);
 expect(temNota({a:0}, atividades)).toBe(true);
});
