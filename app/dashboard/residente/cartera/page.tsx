import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import {
  getMisEstadosCuenta,
  getConfigCartera,
  formatPeriodo,
  formatValor,
  type EstadoCuenta,
} from '@/src/services/cartera'
import ReportarPagoForm from './_components/ReportarPagoForm'

const ESTADO_STYLES: Record<EstadoCuenta['estado'], { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'bg-[#fff9db]', text: 'text-[#e67700]', label: 'Pendiente' },
  mora:      { bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]', label: 'En mora' },
  pagado:    { bg: 'bg-[#d3f9d8]', text: 'text-[#2f9e44]', label: 'Al día' },
  exonerado: { bg: 'bg-[#f5f3f3]', text: 'text-[#6f7978]', label: 'Exonerado' },
  parcial:   { bg: 'bg-[#d0ebff]', text: 'text-[#1971c2]', label: 'Pago parcial' },
}

export default async function CarteraResidentePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) redirect('/registro-completar')

  // Buscar el apartamento del residente
  const { data: apto } = await supabase
    .from('apartamentos')
    .select('id, numero, torre')
    .eq('conjunto_id', perfil.conjunto_id)
    .or(`residente_id.eq.${user.id},propietario_id.eq.${user.id}`)
    .single()

  const [estados, config] = await Promise.all([
    apto ? getMisEstadosCuenta(supabase, perfil.conjunto_id, apto.id) : Promise.resolve([]),
    getConfigCartera(supabase, perfil.conjunto_id),
  ])

  const estadoActual = estados[0] ?? null
  const historial    = estados.slice(1)
  const debeReportar = estadoActual && (estadoActual.estado === 'pendiente' || estadoActual.estado === 'mora')

  // Verificar si ya reportó pago para el estado actual
  let yaReporto = false
  if (estadoActual) {
    const { count } = await supabase
      .from('pagos')
      .select('*', { count: 'exact', head: true })
      .eq('estado_cuenta_id', estadoActual.id)
      .eq('reportado_por', user.id)
      .eq('estado', 'pendiente_verificacion')
    yaReporto = (count ?? 0) > 0
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Mi cuenta</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Cartera
        </h1>
        {apto && (
          <p className="text-sm text-[#3f4948] mt-1">
            Apto {apto.numero}{apto.torre ? ` · Torre ${apto.torre}` : ''}
          </p>
        )}
      </div>

      {/* Sin apartamento */}
      {!apto && (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No tienes un apartamento asignado.</p>
          <p className="text-[#6f7978] text-xs mt-1">Contacta al administrador.</p>
        </div>
      )}

      {/* Estado actual */}
      {apto && !estadoActual && (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center mb-6">
          <p className="text-[#3f4948] text-sm font-medium">No hay estados de cuenta generados aún.</p>
        </div>
      )}

      {estadoActual && (() => {
        const estilo = ESTADO_STYLES[estadoActual.estado]
        return (
          <div className={`border-2 rounded-2xl p-5 mb-5 ${
            estadoActual.estado === 'pagado' || estadoActual.estado === 'exonerado'
              ? 'border-[#2f9e44]/40 bg-[#d3f9d8]/30'
              : estadoActual.estado === 'mora'
              ? 'border-[#ba1a1a]/40 bg-[#ffdad6]/30'
              : 'border-[#f59f00]/40 bg-[#fff9db]/30'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
                  {estilo.label}
                </span>
                <p className="font-[family-name:var(--font-outfit)] text-2xl font-bold text-[#1b1c1c] mt-2">
                  {formatValor(estadoActual.valor_total)}
                </p>
                <p className="text-xs text-[#3f4948] capitalize">{formatPeriodo(estadoActual.periodo)}</p>
              </div>
              <div className="text-right text-xs text-[#6f7978]">
                <p>Cuota: {formatValor(estadoActual.valor_cuota)}</p>
                {estadoActual.valor_mora > 0 && (
                  <p className="text-[#ba1a1a]">Mora: +{formatValor(estadoActual.valor_mora)}</p>
                )}
                <p className="mt-1">
                  Vence:{' '}
                  {new Date(estadoActual.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-CO', {
                    day: 'numeric', month: 'long'
                  })}
                </p>
              </div>
            </div>

            {estadoActual.estado === 'pagado' && (
              <p className="text-sm text-[#2f9e44] font-medium">
                ✓ Pagado el{' '}
                {estadoActual.fecha_pago
                  ? new Date(estadoActual.fecha_pago + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            )}
          </div>
        )
      })()}

      {/* Links de pago */}
      {config && (config.link_pse || config.link_banco || config.instrucciones_pago) && (
        <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-5">
          <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-3">
            Cómo pagar
          </h2>
          <div className="flex flex-col gap-2">
            {config.link_pse && (
              <a
                href={config.link_pse}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 h-10 px-4 bg-[#004746] hover:bg-[#08605f] text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Pagar online / PSE
              </a>
            )}
            {config.link_banco && (
              <div className="bg-[#f5f3f3] rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Datos bancarios</p>
                <p className="text-sm text-[#1b1c1c]">{config.link_banco}</p>
              </div>
            )}
            {config.instrucciones_pago && (
              <div className="bg-[#f5f3f3] rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Instrucciones</p>
                <p className="text-sm text-[#3f4948] whitespace-pre-line">{config.instrucciones_pago}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reportar pago */}
      {debeReportar && estadoActual && (
        <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-5">
          <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
            {yaReporto ? 'Pago en verificación' : 'Reportar pago'}
          </h2>
          {yaReporto ? (
            <p className="text-sm text-[#3f4948]">
              Tu pago fue reportado y está pendiente de verificación por el administrador.
            </p>
          ) : (
            <ReportarPagoForm
              estadoCuentaId={estadoActual.id}
              valorTotal={estadoActual.valor_total}
            />
          )}
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-outfit)] text-base font-semibold text-[#1b1c1c] mb-3">
            Historial
          </h2>
          <div className="flex flex-col gap-2">
            {historial.map((ec) => {
              const estilo = ESTADO_STYLES[ec.estado]
              return (
                <div key={ec.id} className="bg-white border border-[#bec9c8] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#1b1c1c] capitalize">{formatPeriodo(ec.periodo)}</p>
                    <p className="text-xs text-[#6f7978]">{formatValor(ec.valor_total)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${estilo.bg} ${estilo.text}`}>
                    {estilo.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
