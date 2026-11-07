/** Quita espacios, guiones y puntos, y pasa a mayúsculas. "gode 561231-gr8" → "GODE561231GR8". */
export function limpiar(texto: string): string {
  return String(texto ?? '').normalize('NFC').toUpperCase().replace(/[\s\-_.]/g, '');
}

/** Valida AAMMDD con el siglo indicado. Devuelve la fecha ISO (AAAA-MM-DD) o null si no existe ese día. */
export function fechaValida(anio: number, mes: number, dia: number): string | null {
  if (mes < 1 || mes > 12 || dia < 1) return null;
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return null;
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Años cumplidos a una fecha de referencia. */
export function edad(fechaIso: string, hoy: Date): number {
  const [a, m, d] = fechaIso.split('-').map(Number) as [number, number, number];
  let anios = hoy.getUTCFullYear() - a;
  if (hoy.getUTCMonth() + 1 < m || (hoy.getUTCMonth() + 1 === m && hoy.getUTCDate() < d)) anios--;
  return anios;
}
