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
  getHistoricoRecaudo,
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
import GraficoDonut from './_components/GraficoDonut'
import GraficoBarras from './_components/GraficoBarras'

const ESTADO_STYLES: Record<EstadoCuenta['estado'], { bg: string; text: string; label: string }> = {
  pendiente:  { bg: 'bg-[#fff9db]', text: 'text-[#e67700]', label: 'Pendiente' },
  mora:       { bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]', label: 'Mora' },
  pagado:     { bg: 'bg-[#d3f9d8]', text: 'text-[#2f9e44]', label: 'Pagado' },
  exonerado:  { bg: 'bg-[#f5f3f3]', text: 'text-[#6f7978]', label: 'Exonerado' },
  parcial:    { bg: 'bg-[#d0ebff]', text: 'text-[#1971c2]', label: 'Parcial' },
}

const SISTEMA_LABELS: Record<string, string> = {
  manual:      'Datos manuales',
  siigo:       'Siigo',
  helisa:      'Helisa',
  sisco:       'Sisco',
  world_office:'World Office',
  otro:        'Sistema externo',
}

export default async function CarteraAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; filtro?: string }>
}) {
  const params = await searchParams
  const hoy = new Date()
  const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const periodo = params.periodo ?? periodoActual
  const filtro = params.filtro as EstadoCuenta['estado'] | undefined

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const [estados, pagosPendientes, config, stats, apartamentos, historico] = await Promise.all([
    getEstadosCuentaPeriodo(supabase, perfil.conjunto_id, periodo),
    getPagosPendientesVerificacion(supabase, perfil.conjunto_id),
    getConfigCartera(supabase, perfil.conjunto_id),
    getStatsCarteraPeriodo(supabase, perfil.conjunto_id, periodo),
    getApartamentos(supabase, perfil.conjunto_id),
    getHistoricoRecaudo(supabase, perfil.conjunto_id, 6),
  ])

  const pagosConUrls = await Promise.all(
    pagosPendientes.map(async (p) => {
      if (!p.comprobante_url) return { ...p, signed_url: null }
      const { data } = await supabase.storage.from('comprobantes').createSignedUrl(p.comprobante_url, 3600)
      return { ...p, signed_url: data?.signedUrl ?? null }
    })
  )

  // Filtrado por estado
  const estadosFiltrados = filtro
    ? estados.filter(e => e.estado === filtro)
    : estados

  const porcentajeRecaudo = stats.total_periodo > 0
    ? Math.round((stats.pagado / stats.total_periodo) * 100)
    : 0

  const sistemaLabel = SISTEMA_LABELS[config?.sistema_contable ?? 'manual'] ?? 'Manual'
  const esManual = !config?.sistema_contable || config.sistema_contable === 'manual'

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

      {/* Banner fuente de datos */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border mb-6 ${
        esManual
          ? 'bg-[#f5f3f3] border-[#bec9c8]'
          : 'bg-[#d0ebff] border-[#1971c2]/30'
      }`}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${esManual ? 'bg-[#bec9c8]' : 'bg-[#1971c2]'}`} />
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-semibold ${esManual ? 'text-[#3f4948]' : 'text-[#1971c2]'}`}>
            Fuente: {sistemaLabel}
          </span>
          {esManual ? (
            <span className="text-xs text-[#6f7978] ml-2">· Activa integración con tu software contable en Configuración</span>
          ) : config?.contable_ultima_sync ? (
            <span className="text-xs text-[#1971c2] ml-2">
              · Última sincronización: {new Date(config.contable_ultima_sync).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : (
            <span className="text-xs text-[#6f7978] ml-2">· Sin sincronizar aún</span>
          )}
        </div>
      </div>

      {/* Dashboard visual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

        {/* Donut — distribución del período */}
        <div className="bg-white border border-[#bec9c8] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-4">
            Estado del período · {formatPeriodo(periodo).split(' ')[0]}
          </p>
          <GraficoDonut
            total={stats.total_periodo}
            segmentos={[
              { valor: stats.pagado,    color: '#69db7c', label: 'Al día' },
              { valor: stats.pendiente, color: '#ffd43b', label: 'Pendiente' },
              { valor: stats.mora,      color: '#ff6b6b', label: 'En mora' },
              { valor: stats.exonerado, color: '#ced4da', label: 'Exonerado' },
            ]}
          />
        </div>

        {/* KPIs */}
        <div className="flex flex-col gap-3">
          <div className="bg-white border border-[#bec9c8] rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-[#3f4948] uppercase tracking-wide">% Recaudo</p>
              <p className="font-[family-name:var(--font-outfit)] text-3xl font-bold text-[#1b1c1c]">
                {porcentajeRecaudo}<span className="text-lg text-[#6f7978]">%</span>
              </p>
            </div>
            <div className="w-14 h-14 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#f5f3f3" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={porcentajeRecaudo >= 80 ? '#69db7c' : porcentajeRecaudo >= 50 ? '#ffd43b' : '#ff6b6b'}
                  strokeWidth="3"
                  strokeDasharray={`${porcentajeRecaudo * 0.942} 100`}
                  strokeDashoffset="23.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="?filtro=mora" className="bg-[#ffdad6]/60 border border-[#ba1a1a]/20 rounded-2xl px-4 py-3 hover:border-[#ba1a1a]/40 transition-colors">
              <p className="text-[10px] font-semibold text-[#ba1a1a] uppercase tracking-wide">Total mora</p>
              <p className="font-[family-name:var(--font-outfit)] font-bold text-[#ba1a1a] text-base mt-1">
                {formatValor(stats.valor_pendiente)}
              </p>
            </Link>
            <Link href="?filtro=pagado" className="bg-[#d3f9d8]/60 border border-[#2f9e44]/20 rounded-2xl px-4 py-3 hover:border-[#2f9e44]/40 transition-colors">
              <p className="text-[10px] font-semibold text-[#2f9e44] uppercase tracking-wide">Recaudado</p>
              <p className="font-[family-name:var(--font-outfit)] font-bold text-[#2f9e44] text-base mt-1">
                {formatValor(stats.valor_pagado)}
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Barras históricas */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide">Recaudo — últimos 6 meses</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] text-[#6f7978]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#69db7c]" /> Recaudado
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-[#6f7978]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ffc9c9]" /> Pendiente
            </span>
          </div>
        </div>
        <GraficoBarras historico={historico} />
      </div>

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

      {/* Selector de período + filtro activo */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href={`?periodo=${periodoAnterior(periodo)}${filtro ? `&filtro=${filtro}` : ''}`}
          className="h-9 px-3 flex items-center text-sm text-[#3f4948] bg-white border border-[#bec9c8] rounded-xl hover:bg-[#f5f3f3] transition-colors"
        >
          ←
        </Link>
        <span className="font-[family-name:var(--font-outfit)] font-semibold text-[#1b1c1c] capitalize flex-1 text-center">
          {formatPeriodo(periodo)}
        </span>
        <Link
          href={`?periodo=${periodoSiguiente(periodo)}${filtro ? `&filtro=${filtro}` : ''}`}
          className="h-9 px-3 flex items-center text-sm text-[#3f4948] bg-white border border-[#bec9c8] rounded-xl hover:bg-[#f5f3f3] transition-colors"
        >
          →
        </Link>
      </div>

      {filtro && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_STYLES[filtro]?.bg ?? 'bg-[#f5f3f3]'} ${ESTADO_STYLES[filtro]?.text ?? 'text-[#3f4948]'}`}>
            Filtrando: {ESTADO_STYLES[filtro]?.label ?? filtro}
          </span>
          <Link href={`?periodo=${periodo}`} className="text-xs text-[#6f7978] hover:text-[#1b1c1c] underline">
            Limpiar
          </Link>
          <span className="text-xs text-[#6f7978]">— {estadosFiltrados.length} resultado{estadosFiltrados.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Lista estados de cuenta */}
      {estadosFiltrados.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center mb-6">
          <p className="text-[#3f4948] text-sm font-medium">
            {filtro
              ? `No hay apartamentos con estado "${ESTADO_STYLES[filtro]?.label ?? filtro}" en ${formatPeriodo(periodo)}.`
              : `No hay estados de cuenta para ${formatPeriodo(periodo)}.`}
          </p>
          {!filtro && <p className="text-[#6f7978] text-xs mt-1">Usa el formulario de abajo para generarlos.</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-2 mb-6">
          {estadosFiltrados.map((ec) => {
            const estilo = ESTADO_STYLES[ec.estado]
            const apto = ec.apartamentos as { numero: string; torre: string | null } | undefined
            const residente = (ec.usuarios as { nombre: string } | undefined)?.nombre
            return (
              <div
                key={ec.id}
                className={`bg-white border rounded-2xl px-4 py-3 flex items-center justify-between gap-4 ${
                  ec.estado === 'exonerado' ? 'opacity-60' : ''
                } ${filtro === ec.estado ? 'border-[#004746]/30' : 'border-[#bec9c8]'}`}
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
