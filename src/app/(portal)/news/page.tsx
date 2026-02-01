import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Newspaper } from 'lucide-react'
import Link from 'next/link'

interface Announcement {
  id: string
  title: string
  content: string
  category: string | null
  published_at: string | null
  users: { username: string; full_name: string | null } | null
}

export default async function NewsPage() {
  const supabase = await createClient()

  let announcements: Announcement[] = []

  try {
    const { data } = await supabase
      .from('announcements')
      .select('id, title, content, category, published_at, users:author_id(username, full_name)')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(20)

    if (data) {
      // Transform the data to match our interface
      announcements = data.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.category,
        published_at: item.published_at,
        users: Array.isArray(item.users) ? item.users[0] || null : item.users,
      }))
    }
  } catch {
    // Empty announcements
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
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Noticias
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
              Mantente informado sobre las últimas noticias y anuncios de la comunidad.
            </p>
          </div>

          {/* News Grid */}
          {announcements.length > 0 ? (
            <div className="grid gap-6">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        {announcement.category && (
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded mb-2">
                            {announcement.category}
                          </span>
                        )}
                        <CardTitle className="text-xl">
                          <Link href={`/news/${announcement.id}`} className="hover:text-amber-600">
                            {announcement.title}
                          </Link>
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription>
                      {announcement.published_at && (
                        <span>
                          {new Date(announcement.published_at).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      {announcement.users && (
                        <span className="ml-2">
                          por {announcement.users.full_name || announcement.users.username}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                      {announcement.content}
                    </p>
                    <Link
                      href={`/news/${announcement.id}`}
                      className="inline-block mt-4 text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Leer más
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay noticias disponibles
              </h3>
              <p className="text-gray-500">
                Pronto publicaremos noticias y anuncios de la comunidad.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
