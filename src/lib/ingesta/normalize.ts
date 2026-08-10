export function normalizarTexto(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

// Genera cod_local para BP: mayúsculas, sin tildes, sin puntos, espacios colapsados
export function slugLocal(nombre: string): string {
  return normalizarTexto(nombre).replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

// Parsea números peruanos: "S/ 1.234,56" → 1234.56
export function parsearDecimal(v: string | number | undefined | null): number {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  let s = String(v).replace(/^S\/\s*/i, '').trim();

  const hasComa = s.includes(',');
  const hasPeriod = s.includes('.');

  if (hasComa && hasPeriod) {
    const lastComa = s.lastIndexOf(',');
    const lastPeriod = s.lastIndexOf('.');
    if (lastComa > lastPeriod) {
      // "1.234,56" → coma es decimal
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // "1,234.56" → punto es decimal
      s = s.replace(/,/g, '');
    }
  } else if (hasComa) {
    // "14,5" → coma decimal
    s = s.replace(',', '.');
  }

  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

const MESES: Record<string, number> = {
  ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4,
  MAYO: 5, JUNIO: 6, JULIO: 7, AGOSTO: 8,
  SEPTIEMBRE: 9, OCTUBRE: 10, NOVIEMBRE: 11, DICIEMBRE: 12,
  ENE: 1, FEB: 2, MAR: 3, ABR: 4,
  MAY: 5, JUN: 6, JUL: 7, AGO: 8,
  SEP: 9, OCT: 10, NOV: 11, DIC: 12,
};

export function parsearMes(v: string): number {
  const upper = v.trim().toUpperCase();
  if (/^\d+$/.test(upper)) return parseInt(upper, 10);
  return MESES[upper] ?? 0;
}
