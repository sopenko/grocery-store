'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Map, Store, Calendar, MapPin, Layers, Plus, Settings } from 'lucide-react'
import { SubmitPOIModal } from '@/components/map/SubmitPOIModal'
import type { MapPoint, MapPolygon } from '@/components/map/DynamicMap'

// Dynamic import for map component (client-side only)
const DynamicMap = dynamic(() => import('@/components/map/DynamicMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg">
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

export default function MapPage() {
  const { user, profile } = useAuth()
  const [points, setPoints] = useState<MapPoint[]>([])
  const [polygons, setPolygons] = useState<MapPolygon[]>([])
  const [selectedItem, setSelectedItem] = useState<MapPoint | MapPolygon | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [layers, setLayers] = useState<LayerToggle[]>([
    { id: 'businesses', name: 'Negocios', icon: <Store className="w-4 h-4" />, color: '#f59e0b', enabled: true },
    { id: 'events', name: 'Eventos', icon: <Calendar className="w-4 h-4" />, color: '#8b5cf6', enabled: true },
    { id: 'pois', name: 'Puntos de Interés', icon: <MapPin className="w-4 h-4" />, color: '#10b981', enabled: true },
    { id: 'parcels', name: 'Parcelas', icon: <Layers className="w-4 h-4" />, color: '#3b82f6', enabled: false },
  ])

  const supabase = createClient()

  useEffect(() => {
    loadMapData()
  }, [layers])

  const loadMapData = async () => {
    setLoading(true)
    const allPoints: MapPoint[] = []
    const allPolygons: MapPolygon[] = []

    // Load businesses
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

    // Load events
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

    // Load points of interest (only approved ones)
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

    // Load parcels
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

  const categoryLabels: Record<string, string> = {
    cultural: 'Cultural',
    landmark: 'Monumento',
    government: 'Gobierno',
    health: 'Salud',
    education: 'Educación',
    religious: 'Religioso',
    recreation: 'Recreación',
    transport: 'Transporte',
    residential: 'Residencial',
    commercial: 'Comercial',
    agricultural: 'Agrícola',
    public: 'Público',
    communal: 'Comunal',
    protected: 'Protegido',
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Map className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Mapa de la Comunidad
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Explora negocios, eventos, sitios culturales y terrenos de la comunidad.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowSubmitModal(true)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Sugerir Punto
              </Button>
              {(profile?.role === 'admin' || profile?.role === 'moderator') && (
                <Button variant="outline" asChild>
                  <Link href="/admin/pois">
                    <Settings className="w-4 h-4 mr-2" />
                    Administrar
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar - Layer Controls */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Capas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {layers.map((layer) => (
                    <button
                      key={layer.id}
                      onClick={() => toggleLayer(layer.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        layer.enabled
                          ? 'bg-gray-100 dark:bg-gray-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: layer.enabled ? layer.color : '#9ca3af',
                        }}
                      >
                        <span className="text-white">{layer.icon}</span>
                      </div>
                      <span
                        className={`font-medium ${
                          layer.enabled
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500'
                        }`}
                      >
                        {layer.name}
                      </span>
                      <div
                        className={`ml-auto w-3 h-3 rounded-full ${
                          layer.enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Selected Item Details */}
              {selectedItem && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Detalles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedItem.name}
                    </h3>
                    {selectedItem.category && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded mt-2">
                        {categoryLabels[selectedItem.category] || selectedItem.category}
                      </span>
                    )}
                    {selectedItem.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {selectedItem.description}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => setSelectedItem(null)}
                    >
                      Cerrar
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Stats */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Puntos en mapa:</span>
                      <span className="font-medium">{points.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Parcelas:</span>
                      <span className="font-medium">{polygons.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Submissions Link */}
              {user && (
                <Card>
                  <CardContent className="pt-6">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/map/submissions">
                        <MapPin className="w-4 h-4 mr-2" />
                        Mis Sugerencias
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Map */}
            <div className="lg:col-span-3">
              <Card className="overflow-hidden">
                <div className="h-[600px]">
                  <DynamicMap
                    points={points}
                    polygons={polygons}
                    onPointClick={(point) => setSelectedItem(point)}
                    onPolygonClick={(polygon) => setSelectedItem(polygon)}
                    className="rounded-lg"
                  />
                </div>
              </Card>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4">
                {layers
                  .filter((l) => l.enabled)
                  .map((layer) => (
                    <div key={layer.id} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: layer.color }}
                      />
                      <span className="text-gray-600 dark:text-gray-400">{layer.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Submit POI Modal */}
      <SubmitPOIModal
        isOpen={showSubmitModal}
        onClose={() => {
          setShowSubmitModal(false)
          loadMapData() // Refresh data after submission
        }}
      />

      <Footer />
    </div>
  )
}
