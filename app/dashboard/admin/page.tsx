import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getAdminDashboardFull } from '@/src/services/dashboard'
import SeccionResumen from './_components/SeccionResumen'
import SeccionAlertas from './_components/SeccionAlertas'
import SeccionInsights from './_components/SeccionInsights'
import SeccionFinanciero from './_components/SeccionFinanciero'
import SeccionPqrs from './_components/SeccionPqrs'
import SeccionZonas from './_components/SeccionZonas'
import SeccionOperacion from './_components/SeccionOperacion'
import SeccionActividad from './_components/SeccionActividad'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const d = await getAdminDashboardFull(supabase, perfil.conjunto_id)
  const conjunto = (perfil.conjuntos as { nombre: string } | undefined)?.nombre ?? 'Tu conjunto'
  const mes = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-[#3f4948] font-semibold uppercase tracking-wide mb-1">Panel de Control</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Hola, {perfil.nombre.split(' ')[0]}
        </h1>
        <p className="text-[#3f4948] text-sm mt-1">{conjunto} · <span className="capitalize">{mes}</span></p>
      </div>

      {/* 1. Alertas — lo más urgente primero */}
      <SeccionAlertas alertas={d.alertas} />

      {/* 2. KPI cards de resumen */}
      <SeccionResumen d={d} />

      {/* 3. Insights automáticos */}
      <SeccionInsights insights={d.insights} />

      {/* 4 + 5. Financiero y PQRS lado a lado en pantallas grandes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-4">
        <SeccionFinanciero
          stats={d.stats_cartera}
          historico={d.historico_recaudo}
          pagos_por_verificar={d.pagos_por_verificar}
          periodo={d.periodo}
        />
        <SeccionPqrs
          total={d.pqrs_total}
          abiertas={d.pqrs_abiertas}
          en_proceso={d.pqrs_en_proceso}
          resueltas={d.pqrs_resueltas}
          por_categoria={d.pqrs_por_categoria}
          sin_respuesta_5d={d.pqrs_sin_respuesta_5d}
          dias_promedio={d.pqrs_dias_promedio}
        />
      </div>

      {/* 6 + 7. Zonas y Operación lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-4">
        <SeccionZonas
          zonas_top3={d.zonas_top3}
          hora_pico={d.hora_pico}
          zonas_canceladas={d.zonas_canceladas}
          zonas_activas={d.zonas_activas}
          reservas_mes={d.reservas_mes}
          reservas_activas={d.reservas_activas}
        />
        <SeccionOperacion
          visitantes_activos={d.visitantes_activos}
          paquetes_porteria={d.paquetes_porteria}
          vehiculos_pendientes={d.vehiculos_pendientes}
          llamados_activos={d.llamados_activos}
          paquetes_viejos={d.paquetes_viejos}
          visitantes_expirados={d.visitantes_expirados}
        />
      </div>

      {/* 8. Actividad reciente */}
      <SeccionActividad actividad={d.actividad} />
    </div>
  )
}
