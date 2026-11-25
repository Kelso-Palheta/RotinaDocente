import React from 'react';
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {TextoAnimado} from '@/components/revisao/TextoAnimado';
afterEach(cleanup);
it('preserva leitura contínua e destaca expressões acentuadas, sem HTML injetado',()=>{
 const texto='A música eletrônica conversa com o hip-hop. <script>não executar</script>';
 const {container}=render(<TextoAnimado texto={texto} destaques={['música eletrônica','hip-hop','<script>']}/>);
 expect(screen.getByText(texto)).not.toHaveAttribute('aria-hidden');
 expect(container.querySelector('[data-texto-visual]')).toHaveAttribute('aria-hidden','true');
 expect([...container.querySelectorAll('mark')].map(n=>n.textContent)).toEqual(['música eletrônica','hip-hop','<script>']);
 expect(container.querySelector('script')).toBeNull();
 expect(container.querySelector('[data-texto-visual]').textContent).toBe(texto);
});
