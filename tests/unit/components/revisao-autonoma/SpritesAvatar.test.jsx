import { expect, it, vi } from 'vitest';
import { desenharAvatar } from '@/components/revisao-autonoma/spritesAvatar';
it('sprite selecionado é desenhado no Canvas sem modificar posição ou hitbox',()=>{
 const ctx={save:vi.fn(),translate:vi.fn(),scale:vi.fn(),drawImage:vi.fn(),restore:vi.fn()};
 const p={x:60,y:376,w:28,h:44,vx:-260};const antes={...p};
 const imagem={complete:true,naturalWidth:48,src:'/aula-gamificada/avatares/lia.svg'};
 desenharAvatar(ctx,p,imagem,'lia');
 expect(ctx.drawImage).toHaveBeenCalledWith(imagem,-18,-24,36,48);
 expect(ctx.scale).toHaveBeenCalledWith(-1,1);expect(p).toEqual(antes);
});
it('falha/carregamento de sprite mantém personagem visível e não muda física',()=>{
 const ctx={fillRect:vi.fn()};const p={x:10,y:20,w:28,h:44};const antes={...p};
 desenharAvatar(ctx,p,{complete:false},'pixel');
 expect(ctx.fillRect).toHaveBeenCalled();expect(p).toEqual(antes);
});
