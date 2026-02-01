import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AppCard } from '@/components/portal/AppCard'
import { Grid3X3 } from 'lucide-react'

const defaultApps = [
  {
    id: '1',
    name: 'Curicaueri',
    slug: 'curicaueri',
    description: "Aprende la lengua P'urhépecha con grabaciones de hablantes nativos",
    icon_url: null,
    app_url: process.env.NEXT_PUBLIC_CURICAUERI_URL || 'http://localhost:5173',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
]

export default async function AppsPage() {
  const supabase = await createClient()

  let apps = defaultApps
  try {
    const { data } = await supabase
      .from('town_apps')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (data && data.length > 0) {
      apps = data
    }
  } catch {
    // Use default apps
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Aplicaciones
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
              Accede a las aplicaciones y servicios de la comunidad. Aprende P&apos;urhépecha,
              conecta con negocios locales y mantente informado.
            </p>
          </div>

          {/* Apps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>

          {apps.length === 0 && (
            <div className="text-center py-12">
              <Grid3X3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay aplicaciones disponibles
              </h3>
              <p className="text-gray-500">
                Pronto agregaremos más aplicaciones y servicios.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
