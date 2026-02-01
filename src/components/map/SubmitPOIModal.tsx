'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, MapPin, Send, CheckCircle } from 'lucide-react'

const DynamicMap = dynamic(() => import('@/components/map/DynamicMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-gray-500">Cargando mapa...</div>
    </div>
  ),
})

interface SubmitPOIModalProps {
  isOpen: boolean
  onClose: () => void
  initialLocation?: { lat: number; lng: number }
}

const categories = [
  { value: 'cultural', label: 'Cultural', description: 'Museos, teatros, sitios históricos' },
  { value: 'landmark', label: 'Monumento', description: 'Estatuas, monumentos, puntos de referencia' },
  { value: 'government', label: 'Gobierno', description: 'Oficinas gubernamentales, servicios públicos' },
  { value: 'health', label: 'Salud', description: 'Hospitales, clínicas, farmacias' },
  { value: 'education', label: 'Educación', description: 'Escuelas, bibliotecas, centros de estudio' },
  { value: 'religious', label: 'Religioso', description: 'Iglesias, templos, lugares sagrados' },
  { value: 'recreation', label: 'Recreación', description: 'Parques, deportivos, áreas de juego' },
  { value: 'transport', label: 'Transporte', description: 'Paradas, estaciones, terminales' },
  { value: 'other', label: 'Otro', description: 'Otros puntos de interés' },
]

export function SubmitPOIModal({ isOpen, onClose, initialLocation }: SubmitPOIModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  )
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    address: '',
    phone: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation)
    }
  }, [initialLocation])

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setTimeout(() => {
        setStep('form')
        setFormData({
          name: '',
          description: '',
          category: 'other',
          address: '',
          phone: '',
        })
        setSelectedLocation(initialLocation || null)
        setError('')
      }, 300)
    }
  }, [isOpen, initialLocation])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('Debes iniciar sesión para enviar un punto de interés')
      return
    }

    if (!selectedLocation) {
      setError('Por favor selecciona una ubicación en el mapa')
      return
    }

    if (!formData.name.trim()) {
      setError('El nombre es requerido')
      return
    }

    setSaving(true)

    const { error: insertError } = await supabase.from('points_of_interest').insert({
      name: formData.name.trim(),
      slug: generateSlug(formData.name),
      description: formData.description.trim() || null,
      category: formData.category,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      address: formData.address.trim() || null,
      phone: formData.phone.trim() || null,
      status: 'pending',
      submitted_by: user.id,
      is_active: false,
    })

    setSaving(false)

    if (insertError) {
      setError('Error al enviar: ' + insertError.message)
    } else {
      setStep('success')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" />
            {step === 'success' ? 'Enviado' : 'Sugerir Punto de Interés'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {!user ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Debes iniciar sesión para sugerir un punto de interés.
              </p>
              <Button asChild>
                <a href="/login">Iniciar Sesión</a>
              </Button>
            </div>
          ) : step === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">¡Gracias por tu sugerencia!</h3>
              <p className="text-gray-600 mb-6">
                Tu punto de interés ha sido enviado para revisión.
                Un administrador lo revisará pronto.
              </p>
              <Button onClick={onClose}>Cerrar</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Map */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ubicación * (haz clic en el mapa)
                </label>
                <div className="h-[250px] rounded-lg overflow-hidden border">
                  <DynamicMap
                    zoom={15}
                    points={
                      selectedLocation
                        ? [
                            {
                              id: 'selected',
                              name: formData.name || 'Nueva ubicación',
                              latitude: selectedLocation.lat,
                              longitude: selectedLocation.lng,
                              type: 'custom' as const,
                              color: '#ef4444',
                            },
                          ]
                        : []
                    }
                    onPointClick={(point) => {
                      setSelectedLocation({ lat: point.latitude, lng: point.longitude })
                    }}
                  />
                </div>
                {selectedLocation && (
                  <p className="text-xs text-gray-500 mt-1">
                    📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del lugar *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Iglesia de San Jerónimo"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">Categoría *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label} - {cat.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe este lugar para la comunidad..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Address & Phone */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle y número"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(opcional)"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Nota:</strong> Tu sugerencia será revisada por un administrador
                  antes de aparecer en el mapa público. Recibirás una notificación
                  cuando sea aprobada.
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !selectedLocation}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {saving ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Sugerencia
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
