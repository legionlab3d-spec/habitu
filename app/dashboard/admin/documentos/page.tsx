import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getDocumentos, CATEGORIA_DOCUMENTO } from '@/src/services/documentos'
import { eliminarDocumento } from '@/app/actions/documentos'
import DocumentoForm from './_components/DocumentoForm'

export default async function DocumentosAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const lista = await getDocumentos(supabase, perfil.conjunto_id)

  const conUrls = await Promise.all(
    lista.map(async (d) => {
      const { data } = await supabase.storage.from('documentos').createSignedUrl(d.url, 3600)
      return { ...d, signed_url: data?.signedUrl ?? null }
    })
  )

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Admin</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Documentos
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">Documentos del conjunto disponibles para residentes</p>
      </div>

      {/* Subir */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Subir documento
        </h2>
        <DocumentoForm />
      </div>

      {/* Lista */}
      {conUrls.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay documentos subidos aún.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conUrls.map((d) => (
            <div key={d.id} className="bg-white border border-[#bec9c8] rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-semibold text-[#1b1c1c] truncate">{d.nombre}</span>
                  <span className="text-[10px] text-[#6f7978] bg-[#f5f3f3] px-2 py-0.5 rounded-full flex-shrink-0">
                    {CATEGORIA_DOCUMENTO[d.categoria]}
                  </span>
                  {!d.publico && (
                    <span className="text-[10px] text-[#e67700] bg-[#fff9db] px-2 py-0.5 rounded-full flex-shrink-0">
                      Solo admin
                    </span>
                  )}
                </div>
                {d.descripcion && (
                  <p className="text-xs text-[#6f7978]">{d.descripcion}</p>
                )}
                <p className="text-xs text-[#6f7978]">
                  {new Date(d.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {d.signed_url && (
                  <a
                    href={d.signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#004746] border border-[#004746] hover:bg-[#004746] hover:text-white transition-colors px-3 py-1.5 rounded-lg"
                  >
                    Ver
                  </a>
                )}
                <form action={async () => { 'use server'; await eliminarDocumento(d.id, d.url) }}>
                  <button type="submit" className="text-xs text-[#6f7978] hover:text-[#ba1a1a] transition-colors px-2 py-1.5 rounded-lg hover:bg-[#ffdad6]">
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
