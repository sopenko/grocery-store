import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, Phone, Mail, MapPin, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const categoryLabels: Record<string, string> = {
  restaurant: 'Restaurante',
  store: 'Tienda',
  service: 'Servicio',
  craft: 'Artesanías',
  health: 'Salud',
  education: 'Educación',
  other: 'Otro',
}

export default async function DirectoryPage() {
  const supabase = await createClient()

  let businesses: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    category: string
    phone: string | null
    email: string | null
    address: string | null
    is_verified: boolean
  }> = []

  try {
    const { data } = await supabase
      .from('businesses')
      .select('id, name, slug, description, category, phone, email, address, is_verified')
      .eq('is_active', true)
      .order('is_verified', { ascending: false })
      .order('name')
      .limit(50)

    if (data) {
      businesses = data
    }
  } catch {
    // Empty businesses
  }

  // Group businesses by category
  const businessesByCategory = businesses.reduce((acc, business) => {
    const category = business.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(business)
    return acc
  }, {} as Record<string, typeof businesses>)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Directorio de Negocios
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
              Encuentra negocios locales, artesanos, restaurantes y servicios de la comunidad.
            </p>
          </div>

          {/* Businesses by Category */}
          {Object.keys(businessesByCategory).length > 0 ? (
            <div className="space-y-10">
              {Object.entries(businessesByCategory).map(([category, categoryBusinesses]) => (
                <section key={category}>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {categoryLabels[category] || category}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryBusinesses.map((business) => (
                      <Card key={business.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Link
                                href={`/directory/${business.slug}`}
                                className="hover:text-amber-600"
                              >
                                {business.name}
                              </Link>
                              {business.is_verified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </CardTitle>
                          </div>
                          {business.description && (
                            <CardDescription className="line-clamp-2">
                              {business.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          {business.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-amber-500" />
                              <a href={`tel:${business.phone}`} className="hover:text-amber-600">
                                {business.phone}
                              </a>
                            </div>
                          )}
                          {business.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-amber-500" />
                              <a href={`mailto:${business.email}`} className="hover:text-amber-600">
                                {business.email}
                              </a>
                            </div>
                          )}
                          {business.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 mt-0.5 text-amber-500" />
                              <span>{business.address}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay negocios registrados
              </h3>
              <p className="text-gray-500">
                Pronto agregaremos negocios locales al directorio.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
