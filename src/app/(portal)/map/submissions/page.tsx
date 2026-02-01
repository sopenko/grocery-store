'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MapPin, Clock, CheckCircle, XCircle, Trash2, ArrowLeft, Plus
} from 'lucide-react'

interface Submission {
  id: string
  name: string
  description: string | null
  category: string
  latitude: number
  longitude: number
  address: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  created_at: string
  reviewed_at: string | null
}

const categories: Record<string, string> = {
  cultural: 'Cultural',
  landmark: 'Monumento',
  government: 'Gobierno',
  health: 'Salud',
  education: 'Educación',
  religious: 'Religioso',
  recreation: 'Recreación',
  transport: 'Transporte',
  other: 'Otro',
}

export default function MySubmissionsPage() {
  const { user, loading: authLoading } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && user) {
      loadSubmissions()
    }
  }, [authLoading, user])

  const loadSubmissions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('points_of_interest')
      .select('*')
      .eq('submitted_by', user?.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSubmissions(data)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta sugerencia? Esta acción no se puede deshacer.')) return

    setDeleting(id)
    const { error } = await supabase
      .from('points_of_interest')
      .delete()
      .eq('id', id)
      .eq('submitted_by', user?.id)
      .eq('status', 'pending')

    setDeleting(null)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadSubmissions()
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Inicia Sesión</h2>
              <p className="text-gray-600 mb-4">
                Debes iniciar sesión para ver tus sugerencias.
              </p>
              <Button asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const pendingCount = submissions.filter(s => s.status === 'pending').length
  const approvedCount = submissions.filter(s => s.status === 'approved').length
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/map">
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </Button>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Mis Sugerencias
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Puntos de interés que has sugerido para la comunidad.
              </p>
            </div>
            <Button asChild className="bg-green-500 hover:bg-green-600">
              <Link href="/map">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Sugerencia
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="py-4 text-center">
                <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{pendingCount}</div>
                <div className="text-sm text-gray-500">Pendientes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{approvedCount}</div>
                <div className="text-sm text-gray-500">Aprobadas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{rejectedCount}</div>
                <div className="text-sm text-gray-500">Rechazadas</div>
              </CardContent>
            </Card>
          </div>

          {/* Submissions List */}
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Cargando...
                </CardContent>
              </Card>
            ) : submissions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No has enviado sugerencias
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Ayuda a la comunidad sugiriendo puntos de interés importantes.
                  </p>
                  <Button asChild className="bg-green-500 hover:bg-green-600">
                    <Link href="/map">
                      <Plus className="w-4 h-4 mr-2" />
                      Sugerir un Punto
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              submissions.map((submission) => (
                <Card
                  key={submission.id}
                  className={
                    submission.status === 'pending'
                      ? 'border-amber-300 bg-amber-50/50'
                      : submission.status === 'rejected'
                      ? 'border-red-200 bg-red-50/50'
                      : ''
                  }
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {submission.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              submission.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : submission.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {submission.status === 'pending' && (
                              <>
                                <Clock className="w-3 h-3 inline mr-1" />
                                Pendiente
                              </>
                            )}
                            {submission.status === 'approved' && (
                              <>
                                <CheckCircle className="w-3 h-3 inline mr-1" />
                                Aprobado
                              </>
                            )}
                            {submission.status === 'rejected' && (
                              <>
                                <XCircle className="w-3 h-3 inline mr-1" />
                                Rechazado
                              </>
                            )}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                            {categories[submission.category] || submission.category}
                          </span>
                        </div>

                        {submission.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {submission.description}
                          </p>
                        )}

                        <div className="text-xs text-gray-500 space-y-1">
                          <p>📍 {submission.latitude.toFixed(6)}, {submission.longitude.toFixed(6)}</p>
                          {submission.address && <p>🏠 {submission.address}</p>}
                          <p>📅 Enviado: {formatDate(submission.created_at)}</p>
                          {submission.reviewed_at && (
                            <p>✅ Revisado: {formatDate(submission.reviewed_at)}</p>
                          )}
                        </div>

                        {submission.rejection_reason && (
                          <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-300">
                              <strong>Razón del rechazo:</strong> {submission.rejection_reason}
                            </p>
                          </div>
                        )}
                      </div>

                      {submission.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(submission.id)}
                          disabled={deleting === submission.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
