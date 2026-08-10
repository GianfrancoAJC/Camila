'use client';

import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadResult {
  carga_id: string;
  filas_total: number;
  filas_ok: number;
  filas_error: number;
  pendientes: number;
}

const MESES = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

const anioActual = new Date().getFullYear();
const ANIOS = [anioActual, anioActual - 1, anioActual - 2];

export function UploadForm({ onSuccess }: { onSuccess?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cadena, setCadena] = useState<'BP' | 'HYS'>('BP');
  const [anio, setAnio] = useState(String(anioActual));
  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'ok' | 'error'>('idle');
  const [resultado, setResultado] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) return;

    setEstado('cargando');
    setResultado(null);
    setErrorMsg('');

    const fd = new FormData();
    fd.append('file', archivo);
    fd.append('cadena', cadena);
    fd.append('anio', anio);
    fd.append('mes', mes);

    try {
      const res = await fetch('/api/ingesta/procesar', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) {
        setEstado('error');
        setErrorMsg(json.error ?? 'Error desconocido');
      } else {
        setEstado('ok');
        setResultado(json);
        setArchivo(null);
        if (fileRef.current) fileRef.current.value = '';
        onSuccess?.();
      }
    } catch {
      setEstado('error');
      setErrorMsg('No se pudo conectar con el servidor');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Cadena */}
      <div className="flex gap-3">
        {(['BP', 'HYS'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCadena(c)}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors"
            style={{
              borderColor: cadena === c ? 'var(--primary)' : 'var(--border)',
              background: cadena === c ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'transparent',
              color: cadena === c ? 'var(--primary)' : 'var(--muted)',
            }}
          >
            {c === 'BP' ? 'Boticas Perú (BP)' : 'Hogar y Salud (HYS)'}
          </button>
        ))}
      </div>

      {/* Periodo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Año</label>
          <select
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {ANIOS.map((a) => (
              <option key={a} value={String(a)}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Mes</label>
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {MESES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Archivo */}
      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Archivo CSV</label>
        <label
          className="flex flex-col items-center justify-center w-full h-28 rounded-lg border-2 border-dashed cursor-pointer transition-colors"
          style={{
            borderColor: archivo ? 'var(--primary)' : 'var(--border)',
            background: archivo
              ? 'color-mix(in srgb, var(--primary) 6%, transparent)'
              : 'color-mix(in srgb, var(--border) 30%, transparent)',
          }}
        >
          <Upload size={20} style={{ color: archivo ? 'var(--primary)' : 'var(--muted)' }} className="mb-1" />
          <span className="text-sm" style={{ color: archivo ? 'var(--primary)' : 'var(--muted)' }}>
            {archivo ? archivo.name : 'Haz clic o arrastra un CSV aquí'}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!archivo || estado === 'cargando'}
        className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: 'var(--primary)', color: '#fff' }}
      >
        {estado === 'cargando' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Procesando…
          </>
        ) : (
          <>
            <Upload size={16} />
            Procesar CSV
          </>
        )}
      </button>

      {/* Resultado */}
      {estado === 'ok' && resultado && (
        <div
          className="rounded-lg border p-4 space-y-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Carga completada
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total filas', value: resultado.filas_total },
              { label: 'Procesadas', value: resultado.filas_ok, color: 'text-green-500' },
              { label: 'Pendientes', value: resultado.pendientes, color: resultado.pendientes > 0 ? 'text-amber-500' : undefined },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-xl font-semibold ${color ?? ''}`} style={!color ? { color: 'var(--foreground)' } : undefined}>
                  {value}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
              </div>
            ))}
          </div>
          {resultado.pendientes > 0 && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {resultado.pendientes} código{resultado.pendientes !== 1 ? 's' : ''} de producto sin mapear.
              Resuélvelos en <strong>Catálogos → Pendientes</strong> para que aparezcan en los dashboards.
            </p>
          )}
        </div>
      )}

      {estado === 'error' && (
        <div className="flex items-start gap-2 rounded-lg border p-3" style={{ borderColor: '#ef4444', background: 'color-mix(in srgb, #ef4444 8%, transparent)' }}>
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <span className="text-sm text-red-500">{errorMsg}</span>
        </div>
      )}
    </form>
  );
}
