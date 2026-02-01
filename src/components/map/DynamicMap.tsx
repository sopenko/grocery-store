'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, ScaleControl, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

// Custom colored markers
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  })
}

// Base map tile providers
const tileLayers = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    name: 'Calles',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> | Earthstar Geographics',
    name: 'Satélite',
  },
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    name: 'Híbrido',
    labels: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    name: 'Terreno',
  },
}

export interface MapPoint {
  id: string
  name: string
  description?: string
  latitude: number
  longitude: number
  category?: string
  color?: string
  type: 'business' | 'event' | 'poi' | 'custom'
  data?: Record<string, unknown>
}

export interface MapPolygon {
  id: string
  name: string
  description?: string
  geometry: number[][] // Array of [lat, lng] pairs
  category?: string
  fillColor?: string
  strokeColor?: string
  data?: Record<string, unknown>
}

interface DynamicMapProps {
  center?: [number, number]
  zoom?: number
  points?: MapPoint[]
  polygons?: MapPolygon[]
  onPointClick?: (point: MapPoint) => void
  onPolygonClick?: (polygon: MapPolygon) => void
  onMapClick?: (latlng: { lat: number; lng: number }) => void
  className?: string
}

// Component to handle map center changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])

  return null
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick?: (latlng: { lat: number; lng: number }) => void }) {
  const map = useMap()

  useEffect(() => {
    if (!onMapClick) return

    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    }

    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
    }
  }, [map, onMapClick])

  return null
}

// Location control component
function LocationControl() {
  const map = useMap()
  const [locating, setLocating] = useState(false)
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null)
  const [userCircle, setUserCircle] = useState<L.Circle | null>(null)

  const handleLocate = () => {
    setLocating(true)
    map.locate({ setView: true, maxZoom: 16 })
  }

  useEffect(() => {
    const onLocationFound = (e: L.LocationEvent) => {
      setLocating(false)

      // Remove previous markers
      if (userMarker) map.removeLayer(userMarker)
      if (userCircle) map.removeLayer(userCircle)

      const radius = e.accuracy / 2
      const marker = L.marker(e.latlng, {
        icon: L.divIcon({
          className: 'user-location-marker',
          html: `<div style="
            background-color: #4285f4;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(map)

      const circle = L.circle(e.latlng, {
        radius,
        color: '#4285f4',
        fillColor: '#4285f4',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map)

      setUserMarker(marker)
      setUserCircle(circle)
    }

    const onLocationError = () => {
      setLocating(false)
      alert('No se pudo obtener tu ubicación')
    }

    map.on('locationfound', onLocationFound)
    map.on('locationerror', onLocationError)

    return () => {
      map.off('locationfound', onLocationFound)
      map.off('locationerror', onLocationError)
    }
  }, [map, userMarker, userCircle])

  return (
    <div className="leaflet-top leaflet-right" style={{ top: '80px' }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={handleLocate}
          disabled={locating}
          title="Mi ubicación"
          style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            border: 'none',
            cursor: locating ? 'wait' : 'pointer',
          }}
        >
          {locating ? (
            <div style={{ width: '16px', height: '16px', border: '2px solid #4285f4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

// Fullscreen control
function FullscreenControl() {
  const map = useMap()
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    const container = map.getContainer()

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      setTimeout(() => map.invalidateSize(), 100)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [map])

  return (
    <div className="leaflet-top leaflet-right" style={{ top: '120px' }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isFullscreen ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

// Search control
function SearchControl() {
  const map = useMap()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchMarkerRef = useRef<L.Marker | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setShowResults(true)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await response.json()
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const selectResult = (result: { lat: string; lon: string; display_name: string }) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)

    // Remove previous search marker
    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current)
    }

    // Add new marker
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'search-marker',
        html: `<div style="
          background-color: #ef4444;
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      }),
    })
      .addTo(map)
      .bindPopup(result.display_name)
      .openPopup()

    searchMarkerRef.current = marker
    map.setView([lat, lng], 16)
    setShowResults(false)
    setQuery('')
  }

  return (
    <div className="leaflet-top leaflet-left" style={{ top: '10px', left: '50px' }}>
      <div className="leaflet-control" style={{ margin: 0 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', background: 'white', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar lugar..."
              style={{
                width: '200px',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px 0 0 4px',
                outline: 'none',
                fontSize: '14px',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              style={{
                padding: '8px 12px',
                background: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '0 4px 4px 0',
                cursor: 'pointer',
              }}
            >
              {searching ? '...' : '🔍'}
            </button>
          </div>

          {showResults && results.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              marginTop: '4px',
              maxHeight: '200px',
              overflow: 'auto',
              zIndex: 1000,
            }}>
              {results.map((result, i) => (
                <button
                  key={i}
                  onClick={() => selectResult(result)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Base layer switcher
function LayerSwitcher({ currentLayer, onLayerChange }: { currentLayer: string; onLayerChange: (layer: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '25px' }}>
      <div className="leaflet-control" style={{ margin: '10px' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: '44px',
              height: '44px',
              background: 'white',
              border: '2px solid rgba(0,0,0,0.2)',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
            title="Cambiar mapa base"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>

          {expanded && (
            <div style={{
              position: 'absolute',
              bottom: '50px',
              right: 0,
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              padding: '8px',
              display: 'flex',
              gap: '8px',
            }}>
              {Object.entries(tileLayers).map(([key, layer]) => (
                <button
                  key={key}
                  onClick={() => {
                    onLayerChange(key)
                    setExpanded(false)
                  }}
                  style={{
                    width: '60px',
                    height: '60px',
                    padding: '4px',
                    background: currentLayer === key ? '#e3f2fd' : 'white',
                    border: currentLayer === key ? '2px solid #4285f4' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '30px',
                    marginBottom: '4px',
                    background: key === 'satellite' || key === 'hybrid' ? '#2d5016' : key === 'terrain' ? '#c9b896' : '#e8e4da',
                    borderRadius: '2px',
                  }} />
                  {layer.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Measure control
function MeasureControl() {
  const map = useMap()
  const [measuring, setMeasuring] = useState(false)
  const [measureType, setMeasureType] = useState<'distance' | 'area' | null>(null)
  const [points, setPoints] = useState<L.LatLng[]>([])
  const polylineRef = useRef<L.Polyline | null>(null)
  const polygonRef = useRef<L.Polygon | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const labelRef = useRef<L.Marker | null>(null)

  const clearMeasure = () => {
    if (polylineRef.current) map.removeLayer(polylineRef.current)
    if (polygonRef.current) map.removeLayer(polygonRef.current)
    if (labelRef.current) map.removeLayer(labelRef.current)
    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []
    setPoints([])
  }

  const startMeasure = (type: 'distance' | 'area') => {
    clearMeasure()
    setMeasuring(true)
    setMeasureType(type)
    map.getContainer().style.cursor = 'crosshair'
  }

  const stopMeasure = () => {
    setMeasuring(false)
    setMeasureType(null)
    map.getContainer().style.cursor = ''
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters.toFixed(0)} m`
    return `${(meters / 1000).toFixed(2)} km`
  }

  const formatArea = (sqMeters: number) => {
    if (sqMeters < 10000) return `${sqMeters.toFixed(0)} m²`
    return `${(sqMeters / 10000).toFixed(2)} ha`
  }

  const calculateArea = (latlngs: L.LatLng[]) => {
    if (latlngs.length < 3) return 0
    let area = 0
    for (let i = 0; i < latlngs.length; i++) {
      const j = (i + 1) % latlngs.length
      area += latlngs[i].lng * latlngs[j].lat
      area -= latlngs[j].lng * latlngs[i].lat
    }
    area = Math.abs(area) / 2
    // Convert to square meters (approximate)
    const avgLat = latlngs.reduce((sum, ll) => sum + ll.lat, 0) / latlngs.length
    const metersPerDegree = 111320 * Math.cos((avgLat * Math.PI) / 180)
    return area * metersPerDegree * metersPerDegree
  }

  useEffect(() => {
    if (!measuring) return

    const handleClick = (e: L.LeafletMouseEvent) => {
      const newPoints = [...points, e.latlng]
      setPoints(newPoints)

      // Add marker
      const marker = L.marker(e.latlng, {
        icon: L.divIcon({
          className: 'measure-marker',
          html: `<div style="width:10px;height:10px;background:#f59e0b;border:2px solid white;border-radius:50%;"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
      }).addTo(map)
      markersRef.current.push(marker)

      // Update line/polygon
      if (measureType === 'distance') {
        if (polylineRef.current) map.removeLayer(polylineRef.current)
        polylineRef.current = L.polyline(newPoints, { color: '#f59e0b', weight: 3, dashArray: '10, 5' }).addTo(map)

        // Calculate total distance
        let totalDistance = 0
        for (let i = 1; i < newPoints.length; i++) {
          totalDistance += newPoints[i - 1].distanceTo(newPoints[i])
        }

        // Update label
        if (labelRef.current) map.removeLayer(labelRef.current)
        if (newPoints.length > 1) {
          labelRef.current = L.marker(e.latlng, {
            icon: L.divIcon({
              className: 'measure-label',
              html: `<div style="background:white;padding:4px 8px;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.2);font-size:12px;white-space:nowrap;">${formatDistance(totalDistance)}</div>`,
              iconAnchor: [-10, 10],
            }),
          }).addTo(map)
        }
      } else if (measureType === 'area') {
        if (polygonRef.current) map.removeLayer(polygonRef.current)
        if (newPoints.length >= 3) {
          polygonRef.current = L.polygon(newPoints, { color: '#f59e0b', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.2 }).addTo(map)

          // Calculate area
          const area = calculateArea(newPoints)

          // Update label at centroid
          if (labelRef.current) map.removeLayer(labelRef.current)
          const bounds = L.latLngBounds(newPoints)
          labelRef.current = L.marker(bounds.getCenter(), {
            icon: L.divIcon({
              className: 'measure-label',
              html: `<div style="background:white;padding:4px 8px;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.2);font-size:12px;white-space:nowrap;">${formatArea(area)}</div>`,
              iconAnchor: [40, 10],
            }),
          }).addTo(map)
        } else if (newPoints.length === 2) {
          polylineRef.current = L.polyline(newPoints, { color: '#f59e0b', weight: 2, dashArray: '5, 5' }).addTo(map)
        }
      }
    }

    const handleDblClick = (e: L.LeafletMouseEvent) => {
      e.originalEvent.preventDefault()
      stopMeasure()
    }

    map.on('click', handleClick)
    map.on('dblclick', handleDblClick)

    return () => {
      map.off('click', handleClick)
      map.off('dblclick', handleDblClick)
    }
  }, [measuring, measureType, points, map])

  return (
    <div className="leaflet-top leaflet-right" style={{ top: '160px' }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={() => measuring ? stopMeasure() : startMeasure('distance')}
          title="Medir distancia"
          style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: measuring && measureType === 'distance' ? '#fff3cd' : 'white',
            border: 'none',
            cursor: 'pointer',
            borderBottom: '1px solid #ccc',
          }}
        >
          📏
        </button>
        <button
          onClick={() => measuring ? stopMeasure() : startMeasure('area')}
          title="Medir área"
          style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: measuring && measureType === 'area' ? '#fff3cd' : 'white',
            border: 'none',
            cursor: 'pointer',
            borderBottom: '1px solid #ccc',
          }}
        >
          ⬡
        </button>
        <button
          onClick={clearMeasure}
          title="Limpiar medición"
          style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

export default function DynamicMap({
  center = [19.6792, -101.6117], // Default to San Jerónimo Purenchécuaro, Michoacán
  zoom = 15,
  points = [],
  polygons = [],
  onPointClick,
  onPolygonClick,
  onMapClick,
  className = '',
}: DynamicMapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [baseLayer, setBaseLayer] = useState('satellite')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-gray-500">Cargando mapa...</div>
      </div>
    )
  }

  const getMarkerColor = (point: MapPoint) => {
    if (point.color) return point.color
    switch (point.type) {
      case 'business':
        return '#f59e0b' // amber
      case 'event':
        return '#8b5cf6' // purple
      case 'poi':
        return '#10b981' // green
      default:
        return '#3b82f6' // blue
    }
  }

  const currentTileLayer = tileLayers[baseLayer as keyof typeof tileLayers]

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .leaflet-control-attribution {
          font-size: 10px !important;
        }
        .leaflet-container {
          z-index: 1 !important;
        }
        .leaflet-pane {
          z-index: 1 !important;
        }
        .leaflet-top, .leaflet-bottom {
          z-index: 100 !important;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={zoom}
        className={`w-full h-full ${className}`}
        style={{ minHeight: '400px' }}
        zoomControl={false}
        doubleClickZoom={false}
      >
        <MapController center={center} zoom={zoom} />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        <ZoomControl position="topright" />
        <ScaleControl position="bottomleft" imperial={false} />

        {/* Controls */}
        <SearchControl />
        <LocationControl />
        <FullscreenControl />
        <MeasureControl />
        <LayerSwitcher currentLayer={baseLayer} onLayerChange={setBaseLayer} />

        {/* Base tile layer */}
        <TileLayer
          key={baseLayer}
          attribution={currentTileLayer.attribution}
          url={currentTileLayer.url}
        />

        {/* Labels overlay for hybrid view */}
        {baseLayer === 'hybrid' && (
          <TileLayer
            url="https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png"
            opacity={0.7}
          />
        )}

        {/* Render polygons */}
        {polygons.map((polygon) => (
          <Polygon
            key={polygon.id}
            positions={polygon.geometry.map((coord) => [coord[0], coord[1]] as [number, number])}
            pathOptions={{
              fillColor: polygon.fillColor || '#3b82f6',
              fillOpacity: 0.3,
              color: polygon.strokeColor || '#1d4ed8',
              weight: 2,
            }}
            eventHandlers={{
              click: () => onPolygonClick?.(polygon),
            }}
          >
            <Popup>
              <div className="min-w-[150px]">
                <h3 className="font-semibold text-gray-900">{polygon.name}</h3>
                {polygon.category && (
                  <span className="text-xs text-gray-500">{polygon.category}</span>
                )}
                {polygon.description && (
                  <p className="text-sm text-gray-600 mt-1">{polygon.description}</p>
                )}
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Render points */}
        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={createColoredIcon(getMarkerColor(point))}
            eventHandlers={{
              click: () => onPointClick?.(point),
            }}
          >
            <Popup>
              <div className="min-w-[150px]">
                <h3 className="font-semibold text-gray-900">{point.name}</h3>
                {point.category && (
                  <span className="text-xs text-gray-500 capitalize">{point.category}</span>
                )}
                {point.description && (
                  <p className="text-sm text-gray-600 mt-1">{point.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  )
}
