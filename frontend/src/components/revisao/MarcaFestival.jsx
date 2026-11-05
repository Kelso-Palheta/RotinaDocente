import React from 'react';

export function MarcaFestival({ compacta = false }) {
  return (
    <div className={compacta ? 'festival-marca festival-marca-compacta' : 'festival-marca'}>
      <span className="festival-logotipo">Arte em jogo</span>
      <span className="festival-faixa-enem">Revisão ENEM</span>
    </div>
  );
}
