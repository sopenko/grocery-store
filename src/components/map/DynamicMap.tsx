'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet'
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

export default function DynamicMap({
  center = [19.6792, -101.6117], // Default to San Jerónimo Purenchécuaro, Michoacán
  zoom = 13,
  points = [],
  polygons = [],
  onPointClick,
  onPolygonClick,
  className = '',
}: DynamicMapProps) {
  const [isMounted, setIsMounted] = useState(false)

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

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    >
      <MapController center={center} zoom={zoom} />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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
  )
}
