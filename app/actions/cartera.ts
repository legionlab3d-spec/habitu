'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

// ── Generar cuotas del período ───────────────────────────────

export async function generarCuotas(
  _state: { error?: string; resultado?: { insertados: number; omitidos: number } } | undefined,
  formData: FormData
) {
  const periodo           = (formData.get('periodo')           as string).trim()
  const fecha_vencimiento = (formData.get('fecha_vencimiento') as string).trim()

  if (!periodo || !fecha_vencimiento) return { error: 'Período y fecha de vencimiento son obligatorios' }
  if (!/^\d{4}-\d{2}$/.test(periodo)) return { error: 'Formato de período inválido' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no encontrada' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permisos' }

  const { data, error } = await supabase.rpc('generar_estados_cuenta', {
    p_conjunto_id:       perfil.conjunto_id,
    p_periodo:           periodo,
    p_fecha_vencimiento: fecha_vencimiento,
  })

  if (error) return { error: error.message }

  const resultado = data?.[0] ?? { insertados: 0, omitidos: 0 }

  revalidatePath('/dashboard/admin/cartera')
  return { resultado }
}

// ── Actualizar configuración de cartera ─────────────────────

export async function actualizarConfigCartera(
  _state: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const valor_cuota_mensual = parseFloat((formData.get('valor_cuota_mensual') as string) || '0')
  const dia_limite_pago     = parseInt((formData.get('dia_limite_pago')     as string) || '10', 10)
  const mora_automatica     = formData.get('mora_automatica') === 'on'
  const porcentaje_mora     = parseFloat((formData.get('porcentaje_mora')   as string) || '0')
  const link_pse            = (formData.get('link_pse')            as string).trim() || null
  const link_banco          = (formData.get('link_banco')          as string).trim() || null
  const instrucciones_pago  = (formData.get('instrucciones_pago')  as string).trim() || null

  if (valor_cuota_mensual < 0) return { error: 'La cuota no puede ser negativa' }
  if (dia_limite_pago < 1 || dia_limite_pago > 31) return { error: 'Día límite debe estar entre 1 y 31' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no encontrada' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permisos' }

  const { error } = await supabase
    .from('config_conjunto')
    .upsert({
      conjunto_id: perfil.conjunto_id,
      valor_cuota_mensual,
      dia_limite_pago,
      mora_automatica,
      porcentaje_mora,
      link_pse,
      link_banco,
      instrucciones_pago,
    }, { onConflict: 'conjunto_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/cartera')
  revalidatePath('/dashboard/residente/cartera')
  return { ok: true }
}

// ── Cuota individual por apartamento ────────────────────────

export async function setCuotaApartamento(
  _state: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const apartamento_id = (formData.get('apartamento_id') as string).trim()
  const cuota_raw      = (formData.get('cuota_mensual')  as string).trim()
  const cuota_mensual  = cuota_raw === '' ? null : parseFloat(cuota_raw)

  if (!apartamento_id) return { error: 'Apartamento requerido' }
  if (cuota_mensual !== null && cuota_mensual < 0) return { error: 'La cuota no puede ser negativa' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no encontrada' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permisos' }

  const { error } = await supabase
    .from('apartamentos')
    .update({ cuota_mensual })
    .eq('id', apartamento_id)
    .eq('conjunto_id', perfil.conjunto_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/cartera')
  return { ok: true }
}

// ── Residente reporta pago ───────────────────────────────────

export async function reportarPago(
  _state: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const estado_cuenta_id = (formData.get('estado_cuenta_id') as string).trim() || null
  const monto_str        = (formData.get('monto')            as string).trim()
  const fecha_pago       = (formData.get('fecha_pago')       as string).trim()
  const metodo           = (formData.get('metodo')           as string).trim() || 'transferencia'
  const referencia       = (formData.get('referencia')       as string).trim() || null
  const notas            = (formData.get('notas')            as string).trim() || null
  const comprobante      = formData.get('comprobante') as File | null

  const monto = parseFloat(monto_str)
  if (!monto || monto <= 0) return { error: 'El monto debe ser mayor a cero' }
  if (!fecha_pago) return { error: 'La fecha de pago es obligatoria' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no encontrada' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) return { error: 'Perfil no encontrado' }

  // Obtener apartamento_id del residente
  let apartamento_id: string | null = null
  const { data: apto } = await supabase
    .from('apartamentos')
    .select('id')
    .eq('conjunto_id', perfil.conjunto_id)
    .eq('residente_id', user.id)
    .single()

  apartamento_id = apto?.id ?? null
  if (!apartamento_id) return { error: 'No tienes un apartamento asignado' }

  // Subir comprobante si se adjuntó
  let comprobante_url: string | null = null
  if (comprobante && comprobante.size > 0) {
    const ext  = comprobante.name.split('.').pop() ?? 'jpg'
    const path = `${perfil.conjunto_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const bytes = await comprobante.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(path, bytes, { contentType: comprobante.type })

    if (!uploadError) comprobante_url = path
  }

  const { error } = await supabase.from('pagos').insert({
    conjunto_id:     perfil.conjunto_id,
    apartamento_id,
    usuario_id:      user.id,
    estado_cuenta_id,
    monto,
    metodo,
    referencia,
    notas,
    comprobante_url,
    reportado_por:   user.id,
    fecha_pago,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/residente/cartera')
  revalidatePath('/dashboard/admin/cartera')
  return { ok: true }
}

// ── Admin verifica o rechaza un pago ────────────────────────

export async function accionVerificarPago(id: string, nuevoEstado: 'verificado' | 'rechazado') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  await supabase.rpc('verificar_pago', {
    p_pago_id:      id,
    p_nuevo_estado: nuevoEstado,
  })

  revalidatePath('/dashboard/admin/cartera')
  revalidatePath('/dashboard/residente/cartera')
}

// ── Admin exonera un estado de cuenta ───────────────────────

export async function exonerarEstadoCuenta(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  await supabase
    .from('estados_cuenta')
    .update({ estado: 'exonerado', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  revalidatePath('/dashboard/admin/cartera')
}
