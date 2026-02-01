import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WelcomeBanner } from '@/components/portal/WelcomeBanner'
import { AppCard } from '@/components/portal/AppCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Newspaper, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Default apps when database is empty or unavailable
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

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch apps
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

  // Fetch latest announcements
  let announcements: Array<{ id: string; title: string; category: string | null; published_at: string | null }> = []
  try {
    const { data } = await supabase
      .from('announcements')
      .select('id, title, category, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3)

    if (data) {
      announcements = data
    }
  } catch {
    // Empty announcements
  }

  // Fetch upcoming events
  let events: Array<{ id: string; title: string; start_time: string; location: string | null }> = []
  try {
    const { data } = await supabase
      .from('events')
      .select('id, title, start_time, location')
      .eq('is_published', true)
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(3)

    if (data) {
      events = data
    }
  } catch {
    // Empty events
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Welcome Banner */}
          <WelcomeBanner />

          {/* Apps Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Aplicaciones
              </h2>
              <Link
                href="/apps"
                className="text-amber-600 hover:text-amber-700 flex items-center gap-1 text-sm font-medium"
              >
                Ver todas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </section>

          {/* News and Events Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Latest Announcements */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-amber-500" />
                    <CardTitle>Últimas noticias</CardTitle>
                  </div>
                  <Link
                    href="/news"
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    Ver todas
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {announcements.length > 0 ? (
                  <ul className="space-y-3">
                    {announcements.map((announcement) => (
                      <li key={announcement.id}>
                        <Link
                          href={`/news/${announcement.id}`}
                          className="block hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 -mx-2 transition-colors"
                        >
                          <p className="font-medium text-gray-900 dark:text-white">
                            {announcement.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {announcement.category && (
                              <span className="text-amber-600">{announcement.category}</span>
                            )}
                            {announcement.published_at && (
                              <span className="ml-2">
                                {new Date(announcement.published_at).toLocaleDateString('es-MX')}
                              </span>
                            )}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <CardDescription>
                    No hay anuncios recientes. ¡Vuelve pronto!
                  </CardDescription>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <CardTitle>Próximos eventos</CardTitle>
                  </div>
                  <Link
                    href="/events"
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    Ver todos
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {events.length > 0 ? (
                  <ul className="space-y-3">
                    {events.map((event) => (
                      <li key={event.id}>
                        <Link
                          href={`/events/${event.id}`}
                          className="block hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 -mx-2 transition-colors"
                        >
                          <p className="font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            <span className="text-amber-600">
                              {new Date(event.start_time).toLocaleDateString('es-MX', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {event.location && (
                              <span className="ml-2">{event.location}</span>
                            )}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <CardDescription>
                    No hay eventos próximos. ¡Vuelve pronto!
                  </CardDescription>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
