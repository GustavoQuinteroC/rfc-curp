import { validar, limpiar } from './lib/index.js';

const $ = (id) => document.getElementById(id);

function crear(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

/** Corta la clave en sus partes con lo que significa cada una. */
function partes(r) {
  const c = r.clave === 'curp' ? r.curp : r.rfc;
  if (r.clave === 'rfc' && r.tipo === 'generico') return [[c, r.descripcion, false]];
  if (r.clave === 'rfc' && (c.length === 12 || c.length === 13)) {
    const n = c.length === 13 ? 4 : 3;
    const malDigito = r.errores.some((e) => e.includes('dígito verificador'));
    return [
      [c.slice(0, n), r.tipo === 'fisica' ? 'Apellidos y nombre' : 'Razón social', r.errores.some((e) => e.includes('letras') || e.includes('no asigna'))],
      [c.slice(n, n + 6), r.fecha ? `${r.tipo === 'fisica' ? 'Nació' : 'Constituida'} ${r.fecha}` : 'Fecha', r.errores.some((e) => e.includes('fecha'))],
      [c.slice(n + 6, n + 8), 'Homoclave', r.errores.some((e) => e.includes('homoclave'))],
      [c.slice(n + 8), 'Dígito verificador', malDigito],
    ];
  }
  if (r.clave === 'curp' && c.length === 18) {
    return [
      [c.slice(0, 4), 'Apellidos y nombre', r.errores.some((e) => e.includes('primeras 4') || e.includes('no asigna'))],
      [c.slice(4, 10), r.fechaNacimiento ? `Nació ${r.fechaNacimiento}` : 'Fecha', r.errores.some((e) => e.includes('fecha'))],
      [c[10], r.sexoTexto ?? 'Sexo', r.errores.some((e) => e.includes('sexo'))],
      [c.slice(11, 13), r.estadoNombre ?? 'Estado', r.errores.some((e) => e.includes('entidad'))],
      [c.slice(13, 16), 'Consonantes internas', r.errores.some((e) => e.includes('consonantes'))],
      [c[16], /\d/.test(c[16]) ? 'Nació antes de 2000' : 'Nació desde 2000', r.errores.some((e) => e.includes('posición 17'))],
      [c[17], 'Dígito verificador', r.errores.some((e) => e.includes('dígito verificador'))],
    ];
  }
  return [];
}

function resumen(r) {
  if (r.clave === 'rfc') {
    if (r.tipo === 'generico') return 'RFC genérico';
    return r.tipo === 'fisica' ? 'RFC de persona física' : 'RFC de persona moral';
  }
  return r.edad !== undefined ? `CURP · ${r.sexoTexto ?? ''} · ${r.edad} años · ${r.estadoNombre ?? ''}` : 'CURP';
}

function revisarUna() {
  const texto = $('clave').value;
  const lista = $('partes');
  const veredicto = $('veredicto');
  lista.replaceChildren();
  veredicto.replaceChildren();
  if (!limpiar(texto)) return;

  const r = validar(texto);
  for (const [valor, significado, mal] of partes(r)) {
    const li = crear('li', `parte${mal ? ' parte--mal' : ''}`);
    li.append(crear('b', '', valor), crear('span', '', significado));
    lista.append(li);
  }
  const titulo = crear('p', 'veredicto__titulo', r.valido ? `Válido: ${resumen(r)}` : 'No es válido');
  titulo.dataset.valido = String(r.valido);
  veredicto.append(titulo);
  if (r.errores.length) {
    const ul = crear('ul');
    for (const e of r.errores) ul.append(crear('li', '', e));
    veredicto.append(ul);
  }
}

let resultados = [];

function revisarLote() {
  const lineas = $('lote').value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 5000);
  resultados = lineas.map((l) => validar(l));
  const cuerpo = $('tabla').querySelector('tbody');
  cuerpo.replaceChildren();
  for (const r of resultados.slice(0, 500)) {
    const tr = crear('tr');
    tr.append(
      crear('td', 'clave', r.clave === 'curp' ? r.curp : r.rfc),
      crear('td', '', r.clave.toUpperCase()),
    );
    const td = crear('td');
    td.append(crear('span', `estado estado--${r.valido ? 'si' : 'no'}`, r.valido ? 'Válido' : 'No válido'));
    tr.append(td, crear('td', '', r.valido ? resumen(r) : r.errores.join(' ')));
    cuerpo.append(tr);
  }
  const validos = resultados.filter((r) => r.valido).length;
  $('tabla').hidden = resultados.length === 0;
  $('descargar').disabled = resultados.length === 0;
  $('resumen-lote').textContent = resultados.length
    ? `${validos} de ${resultados.length} válidos${resultados.length > 500 ? ' (la tabla muestra los primeros 500; el CSV trae todos)' : ''}.`
    : '';
}

function csv(valor) {
  const texto = String(valor ?? '');
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

$('descargar').addEventListener('click', () => {
  const filas = [['clave', 'tipo', 'valido', 'detalle', 'fecha', 'sexo', 'estado']];
  for (const r of resultados) {
    filas.push([
      r.clave === 'curp' ? r.curp : r.rfc,
      r.clave === 'curp' ? 'CURP' : `RFC ${r.tipo ?? ''}`.trim(),
      r.valido ? 'sí' : 'no',
      r.valido ? resumen(r) : r.errores.join(' '),
      r.clave === 'curp' ? r.fechaNacimiento ?? '' : r.fecha ?? '',
      r.clave === 'curp' ? r.sexoTexto ?? '' : '',
      r.clave === 'curp' ? r.estadoNombre ?? '' : '',
    ]);
  }
  const blob = new Blob(['﻿' + filas.map((f) => f.map(csv).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'rfc-curp-revisados.csv' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$('clave').addEventListener('input', revisarUna);
$('lote').addEventListener('input', revisarLote);
document.querySelectorAll('[data-ejemplo]').forEach((b) => b.addEventListener('click', () => {
  $('clave').value = b.dataset.ejemplo;
  revisarUna();
  $('clave').focus();
}));
