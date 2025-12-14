export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = deg2rad(b.lat - a.lat)
  const dLon = deg2rad(b.lng - a.lng)
  const lat1 = deg2rad(a.lat)
  const lat2 = deg2rad(b.lat)
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}



