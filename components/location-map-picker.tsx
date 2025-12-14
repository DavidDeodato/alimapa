"use client"

import { useEffect } from "react"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"

// Fix do Marker do Leaflet no bundler (senão o ícone some)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const pulseIcon = L.divIcon({
  className: "",
  html: '<div class="pulse-marker"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function ClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function AutoResize({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize()
      map.setView(center)
    }, 50)
  }, [map, center])
  return null
}

export function LocationMapPicker({
  center,
  onPick,
  height = 320,
}: {
  center: [number, number]
  onPick: (lat: number, lng: number) => void
  height?: number
}) {
  return (
    <div className="rounded-lg overflow-hidden border" style={{ height }}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AutoResize center={center} />
        <ClickPicker onPick={onPick} />
        <Marker position={center} icon={pulseIcon} />
      </MapContainer>
    </div>
  )
}



