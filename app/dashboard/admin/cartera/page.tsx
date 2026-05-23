import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getApartamentos } from '@/src/services/apartamentos'
import {
  getEstadosCuentaPeriodo,
  getPagosPendientesVerificacion,
  getConfigCartera,
  getStatsCarteraPeriodo,
  periodoAnterior,
  periodoSiguiente,
  formatPeriodo,
  formatValor,
  type EstadoCuenta,
} from '@/src/services/cartera'
import { accionVerificarPago, exonerarEstadoCuenta } from '@/app/actions/cartera'
import GenerarCuotasForm from './_components/GenerarCuotasForm'
import ConfigCarteraForm from './_components/ConfigCarteraForm'
import CuotaApartamentoForm from './_components/CuotaApartamentoForm'

const ESTADO_STYLES: Record<EstadoCuenta['estado'], { bg: string; text: string; label: string }> = {
  pendiente:  { bg: 'bg-[#fff9db]', text: 'text-[#e67700]', label: 'Pendiente' },
  mora:       { bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]', label: 'Mora' },
  pagado:     { bg: 'bg-[#d3f9d8]', text: 'text-[#2f9e44]', label: 'Pagado' },
  exonerado:  { bg: 'bg-[#f5f3f3]', text: 'text-[#6f7978]', label: 'Exonerado' },
  parcial:    { bg: 'bg-[#d0ebff]', text: 'text-[#1971c2]', label: 'Parcial' },
}

export default async function CarteraAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const params = await searchParams
  const hoy = new Date()
  const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const periodo = params.periodo ?? periodoActual

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const [estados, pagosPendientes, config, stats, apartamentos] = await Promise.all([
    getEstadosCuentaPeriodo(supabase, perfil.conjunto_id, periodo),
    getPagosPendientesVerificacion(supabase, perfil.conjunto_id),
    getConfigCartera(supabase, perfil.conjunto_id),
    getStatsCarteraPeriodo(supabase, perfil.conjunto_id, periodo),
    getApartamentos(supabase, perfil.conjunto_id),
  ])

  // Generar signed URLs para comprobantes
  const pagosConUrls = await Promise.all(
    pagosPendientes.map(async (p) => {
      if (!p.comprobante_url) return { ...p, signed_url: null }
      const { data } = await supabase.storage.from('comprobantes').createSignedUrl(p.comprobante_url, 3600)
      return { ...p, signed_url: data?.signedUrl ?? null }
    })
  )

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Admin · Cartera</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Cartera
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">
          Gestión de cuotas, pagos y estados de cuenta
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pendientes', val: stats.pendiente, color: 'text-[#e67700]' },
          { label: 'En mora',    val: stats.mora,      color: 'text-[#ba1a1a]' },
          { label: 'Pagados',   val: stats.pagado,    color: 'text-[#2f9e44]' },
          { label: 'Total período', val: stats.total_periodo, color: 'text-[#1b1c1c]' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#bec9c8] rounded-2xl p-4">
            <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`font-[family-name:var(--font-outfit)] text-3xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Valores resumen */}
      {(stats.valor_pendiente > 0 || stats.valor_pagado > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-[#fff9db] border border-[#f59f00]/30 rounded-2xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-[#e67700] font-medium">Por recaudar</span>
            <span className="font-[family-name:var(--font-outfit)] font-bold text-[#e67700]">{formatValor(stats.valor_pendiente)}</span>
          </div>
          <div className="bg-[#d3f9d8] border border-[#2f9e44]/30 rounded-2xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-[#2f9e44] font-medium">Recaudado</span>
            <span className="font-[family-name:var(--font-outfit)] font-bold text-[#2f9e44]">{formatValor(stats.valor_pagado)}</span>
          </div>
        </div>
      )}

      {/* Pagos pendientes de verificación */}
      {pagosConUrls.length > 0 && (
        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-outfit)] text-base font-semibold text-[#1b1c1c] mb-3 flex items-center gap-2">
            Pagos por verificar
            <span className="text-xs font-bold bg-[#ba1a1a] text-white px-2 py-0.5 rounded-full">
              {pagosConUrls.length}
            </span>
          </h2>
          <div className="flex flex-col gap-2">
            {pagosConUrls.map((p) => {
              const apto = p.apartamentos as { numero: string; torre: string | null } | undefined
              const nombre = (p.usuarios as { nombre: string } | undefined)?.nombre ?? 'Residente'
              const ec = p.estados_cuenta as { periodo: string } | undefined
              return (
                <div key={p.id} className="bg-white border border-[#bec9c8] rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1b1c1c]">
                        {apto ? `Apto ${apto.numero}${apto.torre ? ` · Torre ${apto.torre}` : ''}` : '—'}
                        <span className="font-normal text-[#3f4948]"> · {nombre}</span>
                      </p>
                      <p className="text-xs text-[#6f7978] mt-0.5">
                        {formatValor(p.monto)} · {p.metodo}
                        {ec ? ` · Período ${ec.periodo}` : ''}
                        {p.referencia ? ` · Ref: ${p.referencia}` : ''}
                      </p>
                      {p.signed_url && (
                        <a
                          href={p.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#004746] hover:underline mt-0.5 inline-block"
                        >
                          Ver comprobante →
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <form action={async () => { 'use server'; await accionVerificarPago(p.id, 'verificado') }}>
                        <button type="submit" className="text-xs text-[#2f9e44] border border-[#2f9e44] hover:bg-[#2f9e44] hover:text-white transition-colors px-3 py-1.5 rounded-lg">
                          Verificar
                        </button>
                      </form>
                      <form action={async () => { 'use server'; await accionVerificarPago(p.id, 'rechazado') }}>
                        <button type="submit" className="text-xs text-[#6f7978] hover:text-[#ba1a1a] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#ffdad6]">
                          Rechazar
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Selector de período */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href={`?periodo=${periodoAnterior(periodo)}`}
          className="h-9 px-3 flex items-center text-sm text-[#3f4948] bg-white border border-[#bec9c8] rounded-xl hover:bg-[#f5f3f3] transition-colors"
        >
          ←
        </Link>
        <span className="font-[family-name:var(--font-outfit)] font-semibold text-[#1b1c1c] capitalize flex-1 text-center">
          {formatPeriodo(periodo)}
        </span>
        <Link
          href={`?periodo=${periodoSiguiente(periodo)}`}
          className="h-9 px-3 flex items-center text-sm text-[#3f4948] bg-white border border-[#bec9c8] rounded-xl hover:bg-[#f5f3f3] transition-colors"
        >
          →
        </Link>
      </div>

      {/* Lista estados de cuenta */}
      {estados.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center mb-6">
          <p className="text-[#3f4948] text-sm font-medium">No hay estados de cuenta para {formatPeriodo(periodo)}.</p>
          <p className="text-[#6f7978] text-xs mt-1">Usa el formulario de abajo para generarlos.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mb-6">
          {estados.map((ec) => {
            const estilo = ESTADO_STYLES[ec.estado]
            const apto = ec.apartamentos as { numero: string; torre: string | null } | undefined
            const residente = (ec.usuarios as { nombre: string } | undefined)?.nombre
            return (
              <div
                key={ec.id}
                className={`bg-white border border-[#bec9c8] rounded-2xl px-4 py-3 flex items-center justify-between gap-4 ${
                  ec.estado === 'exonerado' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
                      {estilo.label}
                    </span>
                    {ec.valor_mora > 0 && (
                      <span className="text-[10px] text-[#ba1a1a]">+mora {formatValor(ec.valor_mora)}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#1b1c1c] truncate">
                    {apto ? `Apto ${apto.numero}${apto.torre ? ` · Torre ${apto.torre}` : ''}` : '—'}
                    {residente && <span className="font-normal text-[#3f4948]"> · {residente}</span>}
                  </p>
                  <p className="text-xs text-[#6f7978]">
                    {formatValor(ec.valor_total)} · Vence {new Date(ec.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                {ec.estado !== 'pagado' && ec.estado !== 'exonerado' && (
                  <form action={async () => { 'use server'; await exonerarEstadoCuenta(ec.id) }}>
                    <button type="submit" className="text-xs text-[#6f7978] hover:text-[#004746] px-2 py-1 rounded-lg hover:bg-[#f5f3f3] transition-colors whitespace-nowrap">
                      Exonerar
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Generar cuotas */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-4">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Generar cuotas del período
        </h2>
        <GenerarCuotasForm />
      </div>

      {/* Cuotas por apartamento */}
      {apartamentos.length > 0 && (
        <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-4">
          <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-1">
            Cuota individual por apartamento
          </h2>
          <p className="text-xs text-[#6f7978] mb-4">
            Cuota por defecto: {formatValor(config?.valor_cuota_mensual ?? 0)}
          </p>
          <CuotaApartamentoForm
            apartamentos={apartamentos.map(a => ({
              id: a.id,
              numero: a.numero,
              torre: a.torre,
              cuota_mensual: (a as typeof a & { cuota_mensual?: number | null }).cuota_mensual ?? null,
            }))}
            cuotaDefault={config?.valor_cuota_mensual ?? 0}
          />
        </div>
      )}

      {/* Configuración */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Configuración de cartera
        </h2>
        <ConfigCarteraForm config={config} />
      </div>

    </div>
  )
}
