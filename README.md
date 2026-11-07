# Validador de RFC y CURP

[![Pruebas](https://github.com/GustavoQuinteroC/rfc-curp/actions/workflows/pruebas.yml/badge.svg)](https://github.com/GustavoQuinteroC/rfc-curp/actions/workflows/pruebas.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-estricto-2350ff)
![Sin dependencias](https://img.shields.io/badge/dependencias-0-2350ff)
![Licencia MIT](https://img.shields.io/badge/licencia-MIT-2350ff)

Valida RFC y CURP de México con su dígito verificador y explica en español qué está mal: fecha que no existe, homoclave con formato incorrecto, estado inexistente, combinaciones que el SAT o RENAPO no asignan o un dígito verificador que no cuadra (casi siempre, un error de captura). También desglosa cada clave: tipo de persona, fecha de nacimiento o constitución, sexo, edad y entidad.

**Pruébalo aquí:** https://proyectos.gustavoquintero.dev/rfc-curp/ (también revisa listas completas pegadas desde Excel y descarga el resultado en CSV).

> **English:** A dependency-free TypeScript library that validates Mexican RFC (tax ID) and CURP (population registry key) including check digits, SAT/RENAPO forbidden-word lists, dates and state codes, and returns plain-Spanish error messages plus a breakdown (person type, birth date, sex, age, state). Ships with type definitions; tested against SAT sample RFCs.

## Uso

```bash
npm install @gustavoquintero/rfc-curp
```

```ts
import { validarRfc, validarCurp, validar } from '@gustavoquintero/rfc-curp';

validarRfc('GODE-561231-GR8');
// { valido: true, rfc: 'GODE561231GR8', tipo: 'fisica', fecha: '1956-12-31', homoclave: 'GR8', errores: [] }

validarRfc('XAXX010101000');
// { valido: true, tipo: 'generico', descripcion: 'RFC genérico para operaciones con el público en general', ... }

validarCurp('BOXW310820HNERXN09');
// { valido: true, fechaNacimiento: '1931-08-20', edad: 95, sexo: 'H', sexoTexto: 'Hombre',
//   estado: 'NE', estadoNombre: 'Nacido en el extranjero', errores: [] }

validarCurp('BOXW310820HNERXN08').errores;
// ['El dígito verificador debería ser "9" y es "8". Probablemente hay un error de captura.']

validar('EKU9003173C9').clave; // 'rfc'  (decide por la longitud)
```

También exporta `digitoVerificadorRfc`, `digitoVerificadorCurp`, `ESTADOS`, `RFC_GENERICOS` y las listas de palabras inconvenientes.

## Qué revisa

| | RFC | CURP |
|---|---|---|
| Longitud y caracteres permitidos | 12 (moral) o 13 (física), con Ñ y & | 18 |
| Fecha real (no 31 de febrero) | Sí | Sí, con el siglo de la posición 17 |
| Palabras inconvenientes | Lista del SAT | Lista de RENAPO |
| Homoclave / consonantes / estado | Formato de la homoclave | Sexo (H, M, X), 33 entidades y NE, consonantes internas |
| Dígito verificador | Sí | Sí |
| Genéricos | XAXX010101000 y XEXX010101000 | — |

No consulta al SAT ni a RENAPO: una clave puede ser válida en su estructura y no estar registrada.

## Pruebas

```bash
npm ci
npm run typecheck
npm test       # Vitest, incluye los RFC de prueba que el SAT publica en sus certificados de ejemplo
npm run e2e    # Playwright sobre la página
```

El algoritmo de dígito verificador se comprobó contra RFC de prueba del SAT (incluido uno con Ñ) y contra [python-stdnum](https://github.com/arthurdejong/python-stdnum).

## Licencia

MIT.
