import { describe, expect, it } from 'vitest';
import { digitoVerificadorCurp, digitoVerificadorRfc, validar, validarCurp, validarRfc } from '../src/index.js';

const HOY = new Date(Date.UTC(2026, 10, 7));

// RFC de prueba que el SAT publica en sus certificados de ejemplo (no son de personas reales).
const RFC_SAT = ['EKU9003173C9', 'CACX7605101P8', 'XOJI740919U48', 'FUNK671228PH6', 'IAÑL750210963', 'JUFA7608212V6', 'KICR630120NX3', 'MAS0810247C0'];

describe('RFC', () => {
  it.each(RFC_SAT)('acepta el RFC de prueba del SAT %s', (rfc) => {
    const r = validarRfc(rfc, HOY);
    expect(r.errores).toEqual([]);
    expect(r.valido).toBe(true);
  });

  it('calcula el dígito verificador de personas físicas y morales', () => {
    expect(digitoVerificadorRfc('GODE561231GR8')).toBe('8');
    expect(digitoVerificadorRfc('EKU9003173C9')).toBe('9');
  });

  it('desglosa tipo, fecha y homoclave', () => {
    expect(validarRfc('gode-561231-gr8', HOY)).toMatchObject({ valido: true, rfc: 'GODE561231GR8', tipo: 'fisica', fecha: '1956-12-31', homoclave: 'GR8' });
    expect(validarRfc('EKU9003173C9', HOY)).toMatchObject({ tipo: 'moral', fecha: '1990-03-17' });
    expect(validarRfc('MAS0810247C0', HOY).fecha).toBe('2008-10-24');
  });

  it('reconoce los RFC genéricos', () => {
    expect(validarRfc('XAXX010101000', HOY)).toMatchObject({ valido: true, tipo: 'generico' });
    expect(validarRfc('XEXX010101000', HOY).descripcion).toMatch(/extranjero/);
  });

  it('explica cada error', () => {
    expect(validarRfc('GODE561231GR9', HOY).errores[0]).toMatch(/debería ser "8"/);
    expect(validarRfc('GODE561331GR8', HOY).errores[0]).toMatch(/no existe/);
    expect(validarRfc('GODE56123', HOY).errores[0]).toMatch(/12 caracteres.*13/);
    expect(validarRfc('PUTO561231GR8', HOY).errores[0]).toMatch(/no asigna/);
    expect(validarRfc('GODE561231G08', HOY).errores[0]).toMatch(/homoclave/);
  });
});

describe('CURP', () => {
  it('acepta una CURP con dígito verificador correcto', () => {
    const r = validarCurp('BOXW310820HNERXN09', HOY);
    expect(r.errores).toEqual([]);
    expect(r).toMatchObject({ valido: true, fechaNacimiento: '1931-08-20', sexo: 'H', estado: 'NE', estadoNombre: 'Nacido en el extranjero', edad: 95 });
  });

  it('usa la posición 17 para el siglo', () => {
    const base = 'GOMA050315MJCMRN0';
    const curp = base.replace(/0$/, 'A');
    const completa = curp + digitoVerificadorCurp(curp);
    expect(validarCurp(completa, HOY)).toMatchObject({ valido: true, fechaNacimiento: '2005-03-15', edad: 21, estadoNombre: 'Jalisco', sexoTexto: 'Mujer' });
  });

  it('explica cada error', () => {
    expect(validarCurp('BOXW310820HNERXN08', HOY).errores[0]).toMatch(/debería ser "9"/);
    expect(validarCurp('BOXW310820HZZRXN09', HOY).errores[0]).toMatch(/entidad/);
    expect(validarCurp('BOXW310820QNERXN09', HOY).errores[0]).toMatch(/sexo/);
    expect(validarCurp('BOXW311320HNERXN09', HOY).errores[0]).toMatch(/no existe/);
    expect(validarCurp('BOXW31082', HOY).errores[0]).toMatch(/18 caracteres/);
    expect(validarCurp('CACA310820HNERXN09', HOY).errores[0]).toMatch(/no asigna/);
  });
});

describe('validar()', () => {
  it('distingue RFC de CURP por la longitud', () => {
    expect(validar('BOXW310820HNERXN09', HOY).clave).toBe('curp');
    expect(validar('GODE561231GR8', HOY).clave).toBe('rfc');
  });
});
