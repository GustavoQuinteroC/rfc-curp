import { fechaValida, limpiar } from './comun.js';

// Valores del anexo 20 / reglas del SAT para el dígito verificador.
const ALFABETO_RFC = '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ';

/** Combinaciones que el SAT no asigna como letras iniciales: la última se cambia por X. */
export const PALABRAS_INCONVENIENTES_RFC: ReadonlySet<string> = new Set([
  'BUEI', 'BUEY', 'CACA', 'CACO', 'CAGA', 'CAGO', 'CAKA', 'CAKO', 'COGE', 'COJA', 'COJE', 'COJI', 'COJO',
  'CULO', 'FETO', 'GUEY', 'JOTO', 'KACA', 'KACO', 'KAGA', 'KAGO', 'KAKA', 'KOGE', 'KOJO', 'KULO', 'MAME',
  'MAMO', 'MEAR', 'MEAS', 'MEON', 'MION', 'MOCO', 'MULA', 'PEDA', 'PEDO', 'PENE', 'PUTA', 'PUTO', 'QULO',
  'RATA', 'RUIN',
]);

export const RFC_GENERICOS: Readonly<Record<string, string>> = {
  XAXX010101000: 'RFC genérico para operaciones con el público en general',
  XEXX010101000: 'RFC genérico para residentes en el extranjero',
};

export interface ResultadoRfc {
  valido: boolean;
  /** RFC limpio: sin espacios ni guiones y en mayúsculas. */
  rfc: string;
  tipo?: 'fisica' | 'moral' | 'generico';
  /** Fecha de nacimiento (persona física) o de constitución (persona moral), AAAA-MM-DD. */
  fecha?: string;
  homoclave?: string;
  descripcion?: string;
  errores: string[];
}

/** Dígito verificador de un RFC de 12 o 13 caracteres (el último no se usa). */
export function digitoVerificadorRfc(rfc: string): string {
  const limpio = limpiar(rfc);
  const base = (limpio.length === 12 ? ` ${limpio}` : limpio).slice(0, 12);
  if (base.length !== 12) throw new RangeError('El RFC debe tener 12 o 13 caracteres.');
  let suma = 0;
  for (let i = 0; i < 12; i++) {
    const valor = ALFABETO_RFC.indexOf(base[i]!);
    if (valor < 0) throw new RangeError(`Carácter no válido en el RFC: ${base[i]}`);
    suma += valor * (13 - i);
  }
  const resto = 11 - (suma % 11);
  return resto === 11 ? '0' : resto === 10 ? 'A' : String(resto);
}

export function validarRfc(entrada: string, hoy: Date = new Date()): ResultadoRfc {
  const rfc = limpiar(entrada);
  const errores: string[] = [];

  if (rfc in RFC_GENERICOS) {
    return { valido: true, rfc, tipo: 'generico', descripcion: RFC_GENERICOS[rfc]!, errores };
  }
  if (rfc.length !== 12 && rfc.length !== 13) {
    return { valido: false, rfc, errores: [`Un RFC tiene 12 caracteres (persona moral) o 13 (persona física); este tiene ${rfc.length}.`] };
  }

  const tipo = rfc.length === 13 ? 'fisica' : 'moral';
  const letras = tipo === 'fisica' ? 4 : 3;
  const partes = new RegExp(`^(.{${letras}})(.{6})(.{3})$`).exec(rfc)!;
  const [, iniciales = '', fecha = '', homoclave = ''] = partes;

  if (!new RegExp(`^[A-ZÑ&]{${letras}}$`).test(iniciales)) {
    errores.push(`Los primeros ${letras} caracteres deben ser letras (se permiten Ñ y &): "${iniciales}".`);
  } else if (tipo === 'fisica' && PALABRAS_INCONVENIENTES_RFC.has(iniciales)) {
    errores.push(`"${iniciales}" es una combinación que el SAT no asigna: cambia la última letra por X.`);
  }

  let fechaIso: string | null = null;
  if (!/^\d{6}$/.test(fecha)) {
    errores.push(`Después de las letras van 6 dígitos con la fecha (AAMMDD): "${fecha}".`);
  } else {
    const aa = Number(fecha.slice(0, 2));
    const anio = 2000 + aa <= hoy.getUTCFullYear() ? 2000 + aa : 1900 + aa;
    fechaIso = fechaValida(anio, Number(fecha.slice(2, 4)), Number(fecha.slice(4, 6)));
    if (!fechaIso) errores.push(`La fecha "${fecha}" no existe (formato AAMMDD).`);
  }

  if (!/^[1-9A-V][1-9A-Z][0-9A]$/.test(homoclave)) {
    errores.push(`La homoclave "${homoclave}" no tiene el formato del SAT: dos caracteres (sin 0 ni O) y un dígito verificador (número o A).`);
  } else if (errores.length === 0) {
    const esperado = digitoVerificadorRfc(rfc);
    if (rfc.slice(-1) !== esperado) {
      errores.push(`El dígito verificador debería ser "${esperado}" y es "${rfc.slice(-1)}". Probablemente hay un error de captura.`);
    }
  }

  const resultado: ResultadoRfc = { valido: errores.length === 0, rfc, tipo, homoclave, errores };
  if (fechaIso) resultado.fecha = fechaIso;
  return resultado;
}
