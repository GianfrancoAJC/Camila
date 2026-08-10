'use client';

interface FilaEmpresa {
  empresa_id: string;
  empresa_nombre: string;
  mensajes: number;
  tokens_entrada: number;
  tokens_salida: number;
  costo_estimado: number;
  ultimo_uso: string | null;
}

function formatUSD(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export function PanelSuperAdminTab({ resumenEmpresas }: { resumenEmpresas: FilaEmpresa[] }) {
  return (
    <div>
      <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
        Consumo de tokens y costo estimado por empresa (cross-tenant). Hoy solo existe AJR; el diseño ya soporta más empresas.
      </p>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
              {['Empresa', 'Mensajes', 'Tokens', 'Costo estimado', 'Último uso'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resumenEmpresas.map((e) => (
              <tr key={e.empresa_id} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-4 py-2.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{e.empresa_nombre}</td>
                <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{Number(e.mensajes).toLocaleString('es-PE')}</td>
                <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{(Number(e.tokens_entrada) + Number(e.tokens_salida)).toLocaleString('es-PE')}</td>
                <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{formatUSD(Number(e.costo_estimado))}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted)' }}>{e.ultimo_uso ? new Date(e.ultimo_uso).toLocaleDateString('es-PE') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
