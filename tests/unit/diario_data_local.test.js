import { expect, it } from 'vitest';
import { dataLocalISO } from '@/utils/diario/datas';
it('chamada e ocorrência usam o dia local mesmo após meia-noite UTC',()=>{
 const anterior=process.env.TZ;
 try {
  process.env.TZ='America/Belem';
  const data=new Date('2026-10-24T01:30:00.000Z');
  expect(dataLocalISO(data)).toBe('2026-10-23');
 } finally { if(anterior===undefined)delete process.env.TZ;else process.env.TZ=anterior; }
});
