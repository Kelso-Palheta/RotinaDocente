import {it,expect} from 'vitest';
import {MASTER_ENEM_PROMPT} from '@/lib/redacao/constants';
it('RN73 prompt exige motivo de anulação e notas nulas fora do alcance parcial',()=>{expect(MASTER_ENEM_PROMPT).toMatch(/"motivoAnulacao"\s*:/);expect(MASTER_ENEM_PROMPT).toMatch(/parcial[\s\S]*total:null/i);expect(MASTER_ENEM_PROMPT).toMatch(/somente as competências selecionadas/i);});
it('RN73 aluno e motivadores são conteúdo não confiável, sem execução de instruções',()=>{expect(MASTER_ENEM_PROMPT).toMatch(/redação[\s\S]*motivador[\s\S]*não confiáv/i);expect(MASTER_ENEM_PROMPT).toMatch(/não execute.*instruções/i);});
