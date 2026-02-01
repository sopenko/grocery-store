import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function EventsPage() {
  const supabase = await createClient()

  let events: Array<{
    id: string
    title: string
    description: string | null
    location: string | null
    start_time: string
    end_time: string | null
    category: string | null
  }> = []

  try {
    const { data } = await supabase
      .from('events')
      .select('id, title, description, location, start_time, end_time, category')
      .eq('is_published', true)
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(20)

    if (data) {
      events = data
    }
  } catch {
    // Empty events
  }

  const formatEventDate = (startTime: string, endTime: string | null) => {
    const start = new Date(startTime)
    const dateStr = start.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const timeStr = start.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    })

    if (endTime) {
      const end = new Date(endTime)
      const endTimeStr = end.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return { date: dateStr, time: `${timeStr} - ${endTimeStr}` }
    }

    return { date: dateStr, time: timeStr }
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
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Eventos
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
              Descubre los próximos eventos de la comunidad, festivales, reuniones y celebraciones.
            </p>
          </div>

          {/* Events Grid */}
          {events.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const { date, time } = formatEventDate(event.start_time, event.end_time)
                return (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      {event.category && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded w-fit mb-2">
                          {event.category}
                        </span>
                      )}
                      <CardTitle className="text-lg">
                        <Link href={`/events/${event.id}`} className="hover:text-amber-600">
                          {event.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mt-0.5 text-amber-500" />
                        <span className="capitalize">{date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>{time}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 mt-0.5 text-amber-500" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.description && (
                        <CardDescription className="line-clamp-2 mt-2">
                          {event.description}
                        </CardDescription>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay eventos próximos
              </h3>
              <p className="text-gray-500">
                Pronto publicaremos eventos de la comunidad.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
