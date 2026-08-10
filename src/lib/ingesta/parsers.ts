import { normalizarTexto, slugLocal, parsearDecimal, parsearMes } from './normalize';

export interface FilaNormalizada {
  cod_local: string;
  nombre_local: string;
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
  anio: number;
  mes: number;
  cod_producto: string;
  nombre_producto: string;
  cantidad: number;
  neto_vta: number;
  stock: number;
}

type Row = Record<string, string>;

function col(row: Row, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined) return String(v).trim();
  }
  return '';
}

export function parsearFilaBP(row: Row): FilaNormalizada {
  const nombre = col(row, 'DESCRIPCION_LOCAL', 'DESCRIPCION LOCAL', 'DESCRIPCION_LOCAL ');
  return {
    cod_local: slugLocal(nombre),
    nombre_local: nombre,
    direccion: col(row, 'DIRECCIÓN', 'DIRECCION', 'DIRECCION '),
    distrito: normalizarTexto(col(row, 'DISTRITO')),
    provincia: '',
    departamento: normalizarTexto(col(row, 'DEPARTAMENTO')),
    anio: parseInt(col(row, 'AÑO', 'ANO', 'AÑO ') || '0', 10),
    mes: parseInt(col(row, 'MES') || '0', 10),
    cod_producto: col(row, 'COD_PRODUCTO', 'COD PRODUCTO', 'COD_PRODUCTO '),
    nombre_producto: col(row, 'DESCRIPCION', 'DESCRIPCION '),
    cantidad: parsearDecimal(col(row, 'VTA_UNID', 'VTA UNID')),
    neto_vta: parsearDecimal(col(row, 'VTA_VAL', 'VTA VAL')),
    stock: parsearDecimal(col(row, 'STOCK')),
  };
}

export function parsearFilaHYS(row: Row): FilaNormalizada {
  return {
    cod_local: col(row, 'COD SUCURSAL', 'COD_SUCURSAL'),
    nombre_local: col(row, 'SUCURSAL'),
    direccion: col(row, 'DIRECCION', 'DIRECCIÓN'),
    distrito: normalizarTexto(col(row, 'DISTRITO')),
    provincia: normalizarTexto(col(row, 'PROVINCIA')),
    departamento: normalizarTexto(col(row, 'DEPARTAMENTO')),
    anio: parseInt(col(row, 'AÑO', 'ANO') || '0', 10),
    mes: parsearMes(col(row, 'MES')),
    cod_producto: col(row, 'COD ARTICULO', 'COD_ARTICULO'),
    nombre_producto: col(row, 'ARTICULO'),
    cantidad: parsearDecimal(col(row, 'VTA UND', 'VTA_UND')),
    neto_vta: parsearDecimal(col(row, 'VTA SOL', 'VTA_SOL')),
    stock: parsearDecimal(col(row, 'STOCK TOTAL', 'STOCK_TOTAL')),
  };
}

export function parsearFilas(
  rows: Row[],
  cadena: 'BP' | 'HYS'
): FilaNormalizada[] {
  const parser = cadena === 'BP' ? parsearFilaBP : parsearFilaHYS;
  return rows
    .map(parser)
    .filter((f) => f.cod_local && f.cod_producto && f.anio > 0 && f.mes > 0);
}
