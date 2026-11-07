export { validarRfc, digitoVerificadorRfc, RFC_GENERICOS, PALABRAS_INCONVENIENTES_RFC, type ResultadoRfc } from './rfc.js';
export { validarCurp, digitoVerificadorCurp, ESTADOS, PALABRAS_INCONVENIENTES_CURP, type ResultadoCurp } from './curp.js';
export { limpiar } from './comun.js';

import { validarRfc, type ResultadoRfc } from './rfc.js';
import { validarCurp, type ResultadoCurp } from './curp.js';
import { limpiar } from './comun.js';

export type Resultado = ({ clave: 'rfc' } & ResultadoRfc) | ({ clave: 'curp' } & ResultadoCurp);

/** Decide por la longitud si el texto es RFC (12 o 13) o CURP (18) y lo valida. */
export function validar(texto: string, hoy: Date = new Date()): Resultado {
  return limpiar(texto).length === 18
    ? { clave: 'curp', ...validarCurp(texto, hoy) }
    : { clave: 'rfc', ...validarRfc(texto, hoy) };
}
