// CongoFlow — Villes desservies (liste configurable)
// lat/lng servent UNIQUEMENT à rattacher une position approximative à la ville
// la plus proche ; aucune coordonnée précise n'est stockée sur le profil.

export const CITIES = [
  { name: 'Kinshasa',    lat: -4.44, lng: 15.27, communes: ['Gombe', 'Lingwala', 'Kalamu', 'Bandalungwa', 'Limete', 'Ngaliema', 'Kasa-Vubu', 'Lemba', 'Matonge', 'Ngiri-Ngiri', 'Mont-Ngafula', 'Matete', 'Barumbu', 'Selembao'] },
  { name: 'Lubumbashi',  lat: -11.66, lng: 27.48, communes: ['Golf', 'Bel-Air', 'Kampemba', 'Ruashi', 'Kenya', 'Aviateurs'] },
  { name: 'Boma',        lat: -5.85, lng: 13.05, communes: ['Centre', 'Nzadi', 'Kalamu', 'Sukisa'] },
  { name: 'Matadi',      lat: -5.82, lng: 13.46, communes: ['Soyo', 'Nzanza', 'Mvuzi'] },
  { name: 'Goma',        lat: -1.68, lng: 29.23, communes: ['Himbi', 'Les Volcans', 'Katindo', 'Mapendo', 'Ngangi-Mugunga'] },
  { name: 'Bukavu',      lat: -2.51, lng: 28.86, communes: ['Ibanda', 'Bagira', 'Kadutu'] },
  { name: 'Kisangani',   lat: 0.52, lng: 25.20, communes: ['Mangobo', 'Makiso', 'Tshopo'] },
  { name: 'Mbuji-Mayi',  lat: -6.13, lng: 23.59, communes: ['Diulu', 'Kabuya', 'Bipemba'] },
  { name: 'Kolwezi',     lat: -10.72, lng: 25.47, communes: ['Dilala', 'Manika'] },
  { name: 'Likasi',      lat: -10.98, lng: 26.74, communes: ['Shituru', 'Panda'] },
  { name: 'Kananga',     lat: -5.90, lng: 22.42, communes: ['Kananga', 'Ndesha', 'Katoka'] },
  { name: 'Mbandaka',    lat: 0.05, lng: 18.26, communes: ['Mbandaka', 'Wangata'] },
  { name: 'Tshikapa',    lat: -6.42, lng: 20.80, communes: ['Dibumba', 'Luebo'] },
  { name: 'Butembo',     lat: 0.14, lng: 29.30, communes: ['Kimemi', 'Bulengera'] },
  { name: 'Uvira',       lat: -3.40, lng: 29.14, communes: ['Kalundu', 'Kavinvira'] },
];

// Ville la plus proche d'une position (haversine, approximation)
export function nearestCity(lat, lng) {
  let best = null, bestD = Infinity;
  for (const c of CITIES) {
    const dLat = (c.lat - lat) * 111;
    const dLng = (c.lng - lng) * 111 * Math.cos(((c.lat + lat) / 2) * Math.PI / 180);
    const d = Math.hypot(dLat, dLng);
    if (d < bestD) { bestD = d; best = c; }
  }
  return bestD <= 150 ? best.name : null;   // au-delà de 150 km : aucune ville sûre
}

// Détection approximative par IP (services gratuits, sans clé)
export async function cityFromIP() {
  const services = ['https://ipapi.co/json/', 'https://ipinfo.io/json'];
  for (const url of services) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (!r.ok) continue;
      const j = await r.json();
      if (j && j.city && CITIES.some(c => c.name === j.city)) return j.city;
      if (j && j.city && j.country === 'CD') return nearestCityName(j.latitude, j.longitude);
      if (j && j.loc) { const [la, ln] = j.loc.split(',').map(Number); return nearestCityName(la, ln); }
    } catch (e) { /* service indisponible : essayer le suivant */ }
  }
  return null;
}
function nearestCityName(lat, lng) {
  const c = nearestCity(lat, lng);
  return c; // peut être null si trop loin
}
