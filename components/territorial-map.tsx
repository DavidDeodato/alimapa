"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Layers, X } from "lucide-react"
import type { Request, Farmer, Institution } from "@/lib/types"

interface TerritorialMapProps {
  requests: Request[]
  farmers: Farmer[]
  institutions?: Institution[]
  onRequestClick?: (request: Request) => void
  onFarmerClick?: (farmer: Farmer) => void
  centerLat?: number
  centerLng?: number
}

export function TerritorialMap({
  requests,
  farmers,
  institutions = [],
  onRequestClick,
  onFarmerClick,
  centerLat = -15.78,
  centerLng = -47.93,
}: TerritorialMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [map, setMap] = useState<any>(null)
  const [showRequests, setShowRequests] = useState(true)
  const [showFarmers, setShowFarmers] = useState(true)
  const [showInstitutions, setShowInstitutions] = useState(true)
  const [layersOpen, setLayersOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return

    // Dynamically import Leaflet only on client
    import("leaflet").then((L) => {
      // Fix for default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      // React 18/Next dev pode rodar effects duas vezes; Leaflet não permite inicializar 2x no mesmo container.
      // Guardamos a instância em ref e checamos antes de criar.
      if (!mapInstanceRef.current) {
        const newMap = L.map(mapRef.current!, {
          zoomControl: true,
        }).setView([centerLat, centerLng], 12)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(newMap)

        mapInstanceRef.current = newMap
        setMap(newMap)
      }
    })

    return () => {
      // Cleanup robusto: remove a instância real, mesmo se o state `map` estiver stale.
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Se o centro mudar (ex: carregou municipality center), ajusta sem recriar mapa
  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.setView([centerLat, centerLng], mapInstanceRef.current.getZoom?.() ?? 12)
  }, [centerLat, centerLng])

  useEffect(() => {
    if (!map || typeof window === "undefined") return

    import("leaflet").then((L) => {
      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer)
        }
      })

      // Add request markers
      if (showRequests) {
        requests.forEach((request) => {
          if (request.lat && request.lng) {
            const urgencyColors: Record<number, string> = {
              1: "#6b7280",
              2: "#3b82f6",
              3: "#eab308",
              4: "#f97316",
              5: "#ef4444",
            }

            const icon = L.divIcon({
              className: "custom-marker",
              html: `
                <div style="
                  width: 30px; height: 30px; border-radius: 9999px;
                  background: ${urgencyColors[request.urgency]};
                  border: 2px solid rgba(255,255,255,0.95);
                  box-shadow: 0 6px 16px rgba(0,0,0,0.22);
                  display: flex; align-items: center; justify-content: center;
                  ${request.urgency >= 4 ? "animation: pulse 1.6s infinite;" : ""}
                ">
                  <span style="color: white; font-size: 16px; line-height: 1; transform: translateY(-1px);">!</span>
                </div>
              `,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            })

            const marker = L.marker([request.lat, request.lng], { icon })
              .bindPopup(`
                <strong>${request.institutionName}</strong><br/>
                Status: ${request.status}<br/>
                Programa: ${request.program}
              `)
              .addTo(map)

            if (onRequestClick) {
              marker.on("click", () => onRequestClick(request))
            }
          }
        })
      }

      // Add farmer markers
      if (showFarmers) {
        farmers.forEach((farmer) => {
          if (farmer.lat && farmer.lng) {
            const icon = L.divIcon({
              className: "custom-marker",
              html: `
                <div style="
                  width: 26px; height: 26px; border-radius: 9999px;
                  background: #10b981;
                  border: 2px solid rgba(255,255,255,0.95);
                  box-shadow: 0 6px 16px rgba(0,0,0,0.18);
                  display: flex; align-items: center; justify-content: center;
                ">
                  <span style="color: white; font-size: 14px; line-height: 1;">🌿</span>
                </div>
              `,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            })

            const marker = L.marker([farmer.lat, farmer.lng], { icon })
              .bindPopup(`
                <strong>${farmer.name}</strong><br/>
                Produtos: ${farmer.products.join(", ")}<br/>
                CAF: ${farmer.cafStatus}
              `)
              .addTo(map)

            if (onFarmerClick) {
              marker.on("click", () => onFarmerClick(farmer))
            }
          }
        })
      }

      // Add institution markers
      if (showInstitutions) {
        institutions.forEach((institution) => {
          if (institution.lat && institution.lng) {
            const icon = L.divIcon({
              className: "custom-marker",
              html: `
                <div style="
                  width: 26px; height: 26px; border-radius: 9999px;
                  background: #3b82f6;
                  border: 2px solid rgba(255,255,255,0.95);
                  box-shadow: 0 6px 16px rgba(0,0,0,0.18);
                  display: flex; align-items: center; justify-content: center;
                ">
                  <span style="color: white; font-size: 14px; line-height: 1;">🏫</span>
                </div>
              `,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            })

            L.marker([institution.lat, institution.lng], { icon })
              .bindPopup(`
                <strong>${institution.name}</strong><br/>
                Tipo: ${institution.type}
              `)
              .addTo(map)
          }
        })
      }
    })
  }, [map, requests, farmers, institutions, showRequests, showFarmers, showInstitutions, onRequestClick, onFarmerClick])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Layer control */}
      <div className="absolute top-4 left-4 z-[1000]">
        {layersOpen ? (
          <Card className="p-4 space-y-3 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Camadas
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setLayersOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requests"
                checked={showRequests}
                onCheckedChange={(checked) => setShowRequests(checked as boolean)}
              />
              <Label htmlFor="requests" className="text-sm cursor-pointer">
                Requisições
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="farmers"
                checked={showFarmers}
                onCheckedChange={(checked) => setShowFarmers(checked as boolean)}
              />
              <Label htmlFor="farmers" className="text-sm cursor-pointer">
                Agricultores
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="institutions"
                checked={showInstitutions}
                onCheckedChange={(checked) => setShowInstitutions(checked as boolean)}
              />
              <Label htmlFor="institutions" className="text-sm cursor-pointer">
                Instituições
              </Label>
            </div>
          </Card>
        ) : (
          <Button onClick={() => setLayersOpen(true)}>
            <Layers className="h-4 w-4 mr-2" />
            Camadas
          </Button>
        )}
      </div>

      {/* Legend */}
      <Card className="absolute bottom-4 left-4 z-[1000] p-3">
        <h4 className="text-xs font-semibold mb-2">Legenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
            <span>Requisições (urgência)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
            <span>Agricultores</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
            <span>Instituições</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
