'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import {
  Map, Store, Calendar, MapPin, Layers, Plus, Settings, X, Send,
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle
} from 'lucide-react'
import type { MapPoint, MapPolygon } from '@/components/map/DynamicMap'

const DynamicMap = dynamic(() => import('@/components/map/DynamicMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <div className="text-gray-500">Cargando mapa...</div>
    </div>
  ),
})

interface LayerToggle {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  enabled: boolean
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

export default function MapPage() {
  const { user, profile } = useAuth()
  const supabase = createClient()

  // Map data
  const [points, setPoints] = useState<MapPoint[]>([])
  const [polygons, setPolygons] = useState<MapPolygon[]>([])
  const [selectedItem, setSelectedItem] = useState<MapPoint | MapPolygon | null>(null)
  const [loading, setLoading] = useState(true)

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mode, setMode] = useState<'browse' | 'add'>('browse')

  // Add POI form state
  const [newPOILocation, setNewPOILocation] = useState<{ lat: number; lng: number } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    address: '',
    phone: '',
  })
  const [saving, setSaving] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Layers
  const [layers, setLayers] = useState<LayerToggle[]>([
    { id: 'businesses', name: 'Negocios', icon: <Store className="w-4 h-4" />, color: '#f59e0b', enabled: true },
    { id: 'events', name: 'Eventos', icon: <Calendar className="w-4 h-4" />, color: '#8b5cf6', enabled: true },
    { id: 'pois', name: 'Puntos de Interés', icon: <MapPin className="w-4 h-4" />, color: '#10b981', enabled: true },
    { id: 'parcels', name: 'Parcelas', icon: <Layers className="w-4 h-4" />, color: '#3b82f6', enabled: false },
  ])

  useEffect(() => {
    loadMapData()
  }, [layers])

  const loadMapData = async () => {
    setLoading(true)
    const allPoints: MapPoint[] = []
    const allPolygons: MapPolygon[] = []

    if (layers.find((l) => l.id === 'businesses')?.enabled) {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name, description, category, latitude, longitude, address')
        .eq('is_active', true)
        .not('latitude', 'is', null)

      if (businesses) {
        allPoints.push(
          ...businesses.map((b) => ({
            id: b.id,
            name: b.name,
            description: b.description || b.address,
            latitude: parseFloat(b.latitude),
            longitude: parseFloat(b.longitude),
            category: b.category,
            type: 'business' as const,
            color: '#f59e0b',
            data: b,
          }))
        )
      }
    }

    if (layers.find((l) => l.id === 'events')?.enabled) {
      const { data: events } = await supabase
        .from('events')
        .select('id, title, description, location, latitude, longitude, start_time')
        .eq('is_published', true)
        .not('latitude', 'is', null)
        .gte('start_time', new Date().toISOString())

      if (events) {
        allPoints.push(
          ...events.map((e) => ({
            id: e.id,
            name: e.title,
            description: e.location || e.description,
            latitude: parseFloat(e.latitude),
            longitude: parseFloat(e.longitude),
            category: 'evento',
            type: 'event' as const,
            color: '#8b5cf6',
            data: e,
          }))
        )
      }
    }

    if (layers.find((l) => l.id === 'pois')?.enabled) {
      const { data: pois } = await supabase
        .from('points_of_interest')
        .select('id, name, description, category, latitude, longitude, address')
        .eq('status', 'approved')
        .eq('is_active', true)

      if (pois) {
        allPoints.push(
          ...pois.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || p.address,
            latitude: parseFloat(p.latitude),
            longitude: parseFloat(p.longitude),
            category: p.category,
            type: 'poi' as const,
            color: '#10b981',
            data: p,
          }))
        )
      }
    }

    if (layers.find((l) => l.id === 'parcels')?.enabled) {
      const { data: parcels } = await supabase
        .from('parcels')
        .select('id, name, description, category, geometry, parcel_id')
        .eq('is_public', true)

      if (parcels) {
        allPolygons.push(
          ...parcels.map((p) => ({
            id: p.id,
            name: p.name || p.parcel_id,
            description: p.description,
            geometry: p.geometry?.coordinates?.[0] || [],
            category: p.category,
            fillColor: '#3b82f6',
            strokeColor: '#1d4ed8',
            data: p,
          }))
        )
      }
    }

    setPoints(allPoints)
    setPolygons(allPolygons)
    setLoading(false)
  }

  const toggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l))
    )
  }

  const startAddMode = () => {
    if (!user) {
      setErrorMessage('Debes iniciar sesión para sugerir un punto de interés')
      return
    }
    setMode('add')
    setSelectedItem(null)
    setNewPOILocation(null)
    setSubmitStatus('idle')
    setFormData({ name: '', description: '', category: 'other', address: '', phone: '' })
    setSidebarOpen(true)
  }

  const cancelAddMode = () => {
    setMode('browse')
    setNewPOILocation(null)
    setSubmitStatus('idle')
    setErrorMessage('')
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36)
  }

  const handleSubmit = async () => {
    if (!user) return
    if (!newPOILocation) {
      setErrorMessage('Haz clic en el mapa para seleccionar ubicación')
      return
    }
    if (!formData.name.trim()) {
      setErrorMessage('El nombre es requerido')
      return
    }

    setSaving(true)
    setErrorMessage('')

    const { error } = await supabase.from('points_of_interest').insert({
      name: formData.name.trim(),
      slug: generateSlug(formData.name),
      description: formData.description.trim() || null,
      category: formData.category,
      latitude: newPOILocation.lat,
      longitude: newPOILocation.lng,
      address: formData.address.trim() || null,
      phone: formData.phone.trim() || null,
      status: 'pending',
      submitted_by: user.id,
      is_active: false,
    })

    setSaving(false)

    if (error) {
      setErrorMessage(error.message)
      setSubmitStatus('error')
    } else {
      setSubmitStatus('success')
      setTimeout(() => {
        cancelAddMode()
        loadMapData()
      }, 2000)
    }
  }

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    if (mode === 'add') {
      setNewPOILocation(latlng)
    }
  }

  // Combine existing points with the new POI marker when in add mode
  const displayPoints = [
    ...points,
    ...(mode === 'add' && newPOILocation
      ? [{
          id: 'new-poi',
          name: formData.name || 'Nueva ubicación',
          latitude: newPOILocation.lat,
          longitude: newPOILocation.lng,
          type: 'custom' as const,
          color: '#ef4444',
        }]
      : []),
  ]

  const categoryLabels: Record<string, string> = {
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

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Header />

      <div className="flex-1 flex relative overflow-hidden">
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 p-2 rounded-r-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          style={{ left: sidebarOpen ? '320px' : '0' }}
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {/* Sidebar */}
        <div
          className={`absolute left-0 top-0 bottom-0 z-10 bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ width: '320px' }}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-amber-500" />
                  <h1 className="font-bold text-lg dark:text-white">Mapa Comunitario</h1>
                </div>
                {(profile?.role === 'admin' || profile?.role === 'moderator') && (
                  <Link href="/admin/pois" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <Settings className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              {mode === 'browse' ? (
                <>
                  {/* Add POI Button */}
                  <div className="p-4 border-b dark:border-gray-700">
                    <Button onClick={startAddMode} className="w-full bg-green-500 hover:bg-green-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Sugerir Punto de Interés
                    </Button>
                    {errorMessage && !user && (
                      <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
                    )}
                  </div>

                  {/* Layers */}
                  <div className="p-4 border-b dark:border-gray-700">
                    <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                      Capas
                    </h2>
                    <div className="space-y-1">
                      {layers.map((layer) => (
                        <button
                          key={layer.id}
                          onClick={() => toggleLayer(layer.id)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            layer.enabled
                              ? 'bg-gray-100 dark:bg-gray-800'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ backgroundColor: layer.enabled ? layer.color : '#9ca3af' }}
                          >
                            <span className="text-white text-xs">{layer.icon}</span>
                          </div>
                          <span className={`text-sm ${layer.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                            {layer.name}
                          </span>
                          <div className={`ml-auto w-2 h-2 rounded-full ${layer.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Item Details */}
                  {selectedItem && (
                    <div className="p-4 border-b dark:border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Seleccionado
                        </h2>
                        <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{selectedItem.name}</h3>
                      {selectedItem.category && (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded mt-1">
                          {categoryLabels[selectedItem.category] || selectedItem.category}
                        </span>
                      )}
                      {selectedItem.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{selectedItem.description}</p>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="p-4 border-b dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{points.length}</div>
                        <div className="text-xs text-gray-500">Puntos</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{polygons.length}</div>
                        <div className="text-xs text-gray-500">Parcelas</div>
                      </div>
                    </div>
                  </div>

                  {/* User submissions */}
                  {user && (
                    <div className="p-4">
                      <Link
                        href="/map/submissions"
                        className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700"
                      >
                        <MapPin className="w-4 h-4" />
                        Ver mis sugerencias
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                /* Add POI Form */
                <div className="p-4">
                  {submitStatus === 'success' ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2 dark:text-white">¡Enviado!</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Tu sugerencia será revisada pronto.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold dark:text-white">Nuevo Punto de Interés</h2>
                        <button onClick={cancelAddMode} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Instructions */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>1.</strong> Haz clic en el mapa para marcar la ubicación
                          <br />
                          <strong>2.</strong> Completa los datos del lugar
                        </p>
                      </div>

                      {/* Location status */}
                      <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                        newPOILocation
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                        <MapPin className="w-4 h-4" />
                        {newPOILocation ? (
                          <span className="text-sm">
                            {newPOILocation.lat.toFixed(5)}, {newPOILocation.lng.toFixed(5)}
                          </span>
                        ) : (
                          <span className="text-sm">Haz clic en el mapa...</span>
                        )}
                      </div>

                      {errorMessage && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg mb-4 text-sm">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {errorMessage}
                        </div>
                      )}

                      {/* Form fields */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nombre *</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Iglesia de San Jerónimo"
                            className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Categoría</label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          >
                            {categories.map((cat) => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descripción</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe este lugar..."
                            rows={3}
                            className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Dirección</label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Calle y número"
                            className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Teléfono</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(opcional)"
                            className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" onClick={cancelAddMode} className="flex-1">
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSubmit}
                            disabled={saving || !newPOILocation}
                            className="flex-1 bg-green-500 hover:bg-green-600"
                          >
                            {saving ? 'Enviando...' : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Enviar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map - Full screen behind sidebar */}
        <div className="flex-1 relative">
          {mode === 'add' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              📍 Haz clic en el mapa para marcar ubicación
            </div>
          )}
          <DynamicMap
            points={displayPoints}
            polygons={polygons}
            onPointClick={(point) => {
              if (mode === 'browse') {
                setSelectedItem(point)
                setSidebarOpen(true)
              }
            }}
            onPolygonClick={(polygon) => {
              if (mode === 'browse') {
                setSelectedItem(polygon)
                setSidebarOpen(true)
              }
            }}
            onMapClick={handleMapClick}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}
