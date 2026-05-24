export const calculateETA = (
  route: { lat: number; lng: number }[],
  currentIndex: number,
  speedKmh = 40
) => {
  if (!route.length || currentIndex >= route.length) {
    return {
      remainingMinutes: 0,
      remainingKm: 0,
    };
  }

  let distanceKm = 0;

  for (let i = currentIndex; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];

    distanceKm += haversine(a.lat, a.lng, b.lat, b.lng);
  }

  const hours = distanceKm / speedKmh;
  const minutes = Math.round(hours * 60);

  return {
    remainingMinutes: minutes,
    remainingKm: Number(distanceKm.toFixed(2)),
  };
};

// 🌍 Haversine distance (real-world GPS distance)
const haversine = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;

  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);