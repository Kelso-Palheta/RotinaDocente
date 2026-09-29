// src/utils/hasModule.js
// Reexporta o helper canônico definido em config/planos (dono do PLANOS_CONFIG),
// evitando import circular entre os dois módulos.
export { temAcessoAoModulo } from "../config/planos";
