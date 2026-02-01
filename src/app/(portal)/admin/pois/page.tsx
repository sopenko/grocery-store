'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MapPin, Check, X, Trash2, Edit2, Plus, Clock,
  CheckCircle, XCircle, AlertCircle, ChevronDown
} from 'lucide-react'

const DynamicMap = dynamic(() => import('@/components/map/DynamicMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-gray-500">Cargando mapa...</div>
    </div>
  ),
})

interface POI {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  latitude: number
  longitude: number
  address: string | null
  phone: string | null
  website_url: string | null
  image_url: string | null
  is_active: boolean
  status: 'pending' | 'approved' | 'rejected'
  submitted_by: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  submitter?: { username: string; full_name: string | null }
}

const categories = [
  { value: 'cultural', label: 'Cultural' },
  { value: 'landmark', label: 'Monumento' },
  { value: 'government', label: 'Gobierno' },
  { value: 'health', label: 'Salud' },
  { value: 'education', label: 'Educación' },
  { value: 'religious', label: 'Religioso' },
  { value: 'recreation', label: 'Recreación' },
  { value: 'transport', label: 'Transporte' },
  { value: 'other', label: 'Otro' },
]

export default function AdminPOIsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [showForm, setShowForm] = useState(false)
  const [editingPoi, setEditingPoi] = useState<POI | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'other',
    address: '',
    phone: '',
    website_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)

  const supabase = createClient()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator'

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadPOIs()
    }
  }, [authLoading, isAdmin, filter])

  const loadPOIs = async () => {
    setLoading(true)
    let query = supabase
      .from('points_of_interest')
      .select(`
        *,
        submitter:submitted_by(username, full_name)
      `)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (!error && data) {
      setPois(data as POI[])
    }
    setLoading(false)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingPoi ? formData.slug : generateSlug(name),
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      category: 'other',
      address: '',
      phone: '',
      website_url: '',
    })
    setSelectedLocation(null)
    setEditingPoi(null)
    setShowForm(false)
  }

  const handleEdit = (poi: POI) => {
    setEditingPoi(poi)
    setFormData({
      name: poi.name,
      slug: poi.slug,
      description: poi.description || '',
      category: poi.category,
      address: poi.address || '',
      phone: poi.phone || '',
      website_url: poi.website_url || '',
    })
    setSelectedLocation({ lat: poi.latitude, lng: poi.longitude })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLocation) {
      alert('Por favor selecciona una ubicación en el mapa')
      return
    }

    setSaving(true)

    const poiData = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      category: formData.category,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      address: formData.address || null,
      phone: formData.phone || null,
      website_url: formData.website_url || null,
      status: 'approved' as const,
      is_active: true,
      created_by: user?.id,
    }

    let error
    if (editingPoi) {
      const { error: updateError } = await supabase
        .from('points_of_interest')
        .update(poiData)
        .eq('id', editingPoi.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('points_of_interest')
        .insert(poiData)
      error = insertError
    }

    setSaving(false)

    if (error) {
      alert('Error al guardar: ' + error.message)
    } else {
      resetForm()
      loadPOIs()
    }
  }

  const handleApprove = async (poi: POI) => {
    setActionLoading(poi.id)
    const { error } = await supabase
      .from('points_of_interest')
      .update({
        status: 'approved',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        is_active: true,
      })
      .eq('id', poi.id)

    setActionLoading(null)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadPOIs()
    }
  }

  const handleReject = async () => {
    if (!showRejectModal) return
    setActionLoading(showRejectModal)

    const { error } = await supabase
      .from('points_of_interest')
      .update({
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason || null,
        is_active: false,
      })
      .eq('id', showRejectModal)

    setActionLoading(null)
    setShowRejectModal(null)
    setRejectionReason('')

    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadPOIs()
    }
  }

  const handleDelete = async (poi: POI) => {
    if (!confirm(`¿Eliminar "${poi.name}"? Esta acción no se puede deshacer.`)) return

    setActionLoading(poi.id)
    const { error } = await supabase
      .from('points_of_interest')
      .delete()
      .eq('id', poi.id)

    setActionLoading(null)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadPOIs()
    }
  }

  const handleMapClick = (point: { latitude: number; longitude: number }) => {
    if (showForm) {
      setSelectedLocation({ lat: point.latitude, lng: point.longitude })
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
              <p className="text-gray-600">
                Solo los administradores pueden acceder a esta página.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const statusCounts = {
    pending: pois.filter(p => p.status === 'pending').length,
    approved: pois.filter(p => p.status === 'approved').length,
    rejected: pois.filter(p => p.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Administrar Puntos de Interés
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Gestiona y aprueba los puntos de interés de la comunidad.
              </p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-500 hover:bg-green-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Punto
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - List & Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Add/Edit Form */}
              {showForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {editingPoi ? 'Editar Punto' : 'Nuevo Punto de Interés'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Nombre *</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Slug *</label>
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Categoría *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Descripción</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Dirección</label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Teléfono</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Sitio Web</label>
                        <input
                          type="url"
                          value={formData.website_url}
                          onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                          placeholder="https://"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          <strong>Ubicación:</strong>{' '}
                          {selectedLocation
                            ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
                            : 'Haz clic en el mapa para seleccionar la ubicación'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={saving || !selectedLocation} className="bg-green-500 hover:bg-green-600">
                          {saving ? 'Guardando...' : editingPoi ? 'Actualizar' : 'Crear Punto'}
                        </Button>
                        <Button type="button" variant="outline" onClick={resetForm}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(status)}
                    className={filter === status ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    {status === 'all' && 'Todos'}
                    {status === 'pending' && (
                      <>
                        <Clock className="w-4 h-4 mr-1" />
                        Pendientes ({statusCounts.pending})
                      </>
                    )}
                    {status === 'approved' && (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprobados
                      </>
                    )}
                    {status === 'rejected' && (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Rechazados
                      </>
                    )}
                  </Button>
                ))}
              </div>

              {/* POI List */}
              <div className="space-y-3">
                {loading ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      Cargando...
                    </CardContent>
                  </Card>
                ) : pois.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      No hay puntos de interés {filter !== 'all' ? `con estado "${filter}"` : ''}
                    </CardContent>
                  </Card>
                ) : (
                  pois.map((poi) => (
                    <Card key={poi.id} className={poi.status === 'pending' ? 'border-amber-300 bg-amber-50/50' : ''}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {poi.name}
                              </h3>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                poi.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                poi.status === 'approved' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {poi.status === 'pending' ? 'Pendiente' :
                                 poi.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                              </span>
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {categories.find(c => c.value === poi.category)?.label || poi.category}
                              </span>
                            </div>
                            {poi.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {poi.description}
                              </p>
                            )}
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>📍 {poi.latitude.toFixed(6)}, {poi.longitude.toFixed(6)}</p>
                              {poi.address && <p>🏠 {poi.address}</p>}
                              {poi.submitter && (
                                <p>👤 Enviado por: {poi.submitter.full_name || poi.submitter.username}</p>
                              )}
                              {poi.rejection_reason && (
                                <p className="text-red-600">❌ Razón: {poi.rejection_reason}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {poi.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleApprove(poi)}
                                  disabled={actionLoading === poi.id}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setShowRejectModal(poi.id)}
                                  disabled={actionLoading === poi.id}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(poi)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(poi)}
                              disabled={actionLoading === poi.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {showForm ? 'Haz clic para ubicar' : 'Vista previa'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[500px] rounded-lg overflow-hidden">
                    <DynamicMap
                      zoom={14}
                      points={[
                        ...pois.filter(p => p.status === 'approved').map(p => ({
                          id: p.id,
                          name: p.name,
                          description: p.description || undefined,
                          latitude: p.latitude,
                          longitude: p.longitude,
                          category: p.category,
                          type: 'poi' as const,
                          color: '#10b981',
                        })),
                        ...(selectedLocation ? [{
                          id: 'selected',
                          name: formData.name || 'Nueva ubicación',
                          latitude: selectedLocation.lat,
                          longitude: selectedLocation.lng,
                          type: 'custom' as const,
                          color: '#ef4444',
                        }] : []),
                      ]}
                      onPointClick={(point) => {
                        if (showForm && point.id !== 'selected') {
                          setSelectedLocation({ lat: point.latitude, lng: point.longitude })
                        }
                      }}
                    />
                  </div>
                  {showForm && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Haz clic en el mapa para seleccionar la ubicación
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Rechazar Punto de Interés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Razón del rechazo (opcional)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="Explica por qué se rechaza este punto..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(null)
                      setRejectionReason('')
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleReject}
                    className="bg-red-500 hover:bg-red-600"
                    disabled={actionLoading === showRejectModal}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  )
}
