import { edad, fechaValida, limpiar } from './comun.js';

const ALFABETO_CURP = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

export const ESTADOS: Readonly<Record<string, string>> = {
  AS: 'Aguascalientes', BC: 'Baja California', BS: 'Baja California Sur', CC: 'Campeche', CL: 'Coahuila',
  CM: 'Colima', CS: 'Chiapas', CH: 'Chihuahua', DF: 'Ciudad de México', DG: 'Durango', GT: 'Guanajuato',
  GR: 'Guerrero', HG: 'Hidalgo', JC: 'Jalisco', MC: 'Estado de México', MN: 'Michoacán', MS: 'Morelos',
  NT: 'Nayarit', NL: 'Nuevo León', OC: 'Oaxaca', PL: 'Puebla', QT: 'Querétaro', QR: 'Quintana Roo',
  SP: 'San Luis Potosí', SL: 'Sinaloa', SR: 'Sonora', TC: 'Tabasco', TS: 'Tamaulipas', TL: 'Tlaxcala',
  VZ: 'Veracruz', YN: 'Yucatán', ZS: 'Zacatecas', NE: 'Nacido en el extranjero',
};

const SEXOS = { H: 'Hombre', M: 'Mujer', X: 'No binario' } as const;

/** Combinaciones que RENAPO no asigna: la segunda letra se cambia por X. */
export const PALABRAS_INCONVENIENTES_CURP: ReadonlySet<string> = new Set([
  'BACA', 'BAKA', 'BUEI', 'BUEY', 'CACA', 'CACO', 'CAGA', 'CAGO', 'CAKA', 'CAKO', 'COGE', 'COGI', 'COJA',
  'COJE', 'COJI', 'COJO', 'COLA', 'CULO', 'FALO', 'FETO', 'GETA', 'GUEI', 'GUEY', 'JETA', 'JOTO', 'KACA',
  'KACO', 'KAGA', 'KAGO', 'KAKA', 'KAKO', 'KOGE', 'KOGI', 'KOJA', 'KOJE', 'KOJI', 'KOJO', 'KOLA', 'KULO',
  'LILO', 'LOCA', 'LOCO', 'LOKA', 'LOKO', 'MAME', 'MAMO', 'MEAR', 'MEAS', 'MEON', 'MIAR', 'MION', 'MOCO',
  'MOKO', 'MULA', 'MULO', 'NACA', 'NACO', 'PEDA', 'PEDO', 'PENE', 'PIPI', 'PITO', 'POPO', 'PUTA', 'PUTO',
  'QULO', 'RATA', 'ROBA', 'ROBE', 'ROBO', 'RUIN', 'SENO', 'TETA', 'VACA', 'VAGA', 'VAGO', 'VAKA', 'VUEI',
  'VUEY', 'WUEI', 'WUEY',
]);

export interface ResultadoCurp {
  valido: boolean;
  curp: string;
  fechaNacimiento?: string;
  edad?: number;
  sexo?: keyof typeof SEXOS;
  sexoTexto?: string;
  estado?: string;
  estadoNombre?: string;
  errores: string[];
}

/** Dígito verificador de una CURP (se calcula con los primeros 17 caracteres). */
export function digitoVerificadorCurp(curp: string): string {
  const base = limpiar(curp).slice(0, 17);
  if (base.length !== 17) throw new RangeError('La CURP debe tener al menos 17 caracteres.');
  let suma = 0;
  for (let i = 0; i < 17; i++) {
    const valor = ALFABETO_CURP.indexOf(base[i]!);
    if (valor < 0) throw new RangeError(`Carácter no válido en la CURP: ${base[i]}`);
    suma += valor * (18 - i);
  }
  return String((10 - (suma % 10)) % 10);
}

export function validarCurp(entrada: string, hoy: Date = new Date()): ResultadoCurp {
  const curp = limpiar(entrada);
  const errores: string[] = [];
  if (curp.length !== 18) {
    return { valido: false, curp, errores: [`Una CURP tiene 18 caracteres; esta tiene ${curp.length}.`] };
  }
  const resultado: ResultadoCurp = { valido: false, curp, errores };

  const iniciales = curp.slice(0, 4);
  if (!/^[A-Z][AEIOUX][A-Z]{2}$/.test(iniciales)) {
    errores.push(`Las primeras 4 posiciones son letras y la segunda es una vocal (o X): "${iniciales}".`);
  } else if (PALABRAS_INCONVENIENTES_CURP.has(iniciales)) {
    errores.push(`"${iniciales}" es una combinación que RENAPO no asigna: la segunda letra debería ser X.`);
  }

  const fecha = curp.slice(4, 10);
  const diferenciador = curp[16]!;
  if (!/^\d{6}$/.test(fecha)) {
    errores.push(`Las posiciones 5 a 10 son la fecha de nacimiento (AAMMDD): "${fecha}".`);
  } else if (!/^[0-9A-Z]$/.test(diferenciador)) {
    errores.push(`La posición 17 debe ser un número (nacidos antes de 2000) o una letra (desde 2000): "${diferenciador}".`);
  } else {
    const anio = (/\d/.test(diferenciador) ? 1900 : 2000) + Number(fecha.slice(0, 2));
    const iso = fechaValida(anio, Number(fecha.slice(2, 4)), Number(fecha.slice(4, 6)));
    if (!iso) {
      errores.push(`La fecha de nacimiento "${fecha}" no existe (formato AAMMDD).`);
    } else {
      resultado.fechaNacimiento = iso;
      const anios = edad(iso, hoy);
      if (anios < 0) errores.push('La fecha de nacimiento está en el futuro.');
      else resultado.edad = anios;
    }
  }

  const sexo = curp[10]!;
  if (sexo in SEXOS) {
    resultado.sexo = sexo as keyof typeof SEXOS;
    resultado.sexoTexto = SEXOS[sexo as keyof typeof SEXOS];
  } else {
    errores.push(`La posición 11 es el sexo (H, M o X): "${sexo}".`);
  }

  const estado = curp.slice(11, 13);
  if (estado in ESTADOS) {
    resultado.estado = estado;
    resultado.estadoNombre = ESTADOS[estado]!;
  } else {
    errores.push(`"${estado}" no es una clave de entidad de nacimiento.`);
  }

  if (!/^[B-DF-HJ-NP-TV-ZÑ]{3}$/.test(curp.slice(13, 16))) {
    errores.push(`Las posiciones 14 a 16 son consonantes internas de apellidos y nombre: "${curp.slice(13, 16)}".`);
  }

  if (!/^\d$/.test(curp[17]!)) {
    errores.push(`El último carácter es el dígito verificador y debe ser un número: "${curp[17]}".`);
  } else if (errores.length === 0) {
    const esperado = digitoVerificadorCurp(curp);
    if (curp[17] !== esperado) {
      errores.push(`El dígito verificador debería ser "${esperado}" y es "${curp[17]}". Probablemente hay un error de captura.`);
    }
  }

  resultado.valido = errores.length === 0;
  return resultado;
}
