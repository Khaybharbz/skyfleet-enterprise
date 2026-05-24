type LatLng = {
  lat: number;
  lng: number;
};

const OSRM_BASE =
  "https://router.project-osrm.org";

/**
 * 🚗 GET REAL ROAD ROUTE FROM OSRM
 */
export async function getOSRMRoute(
  start: LatLng,
  end: LatLng
) {
  const url = `${OSRM_BASE}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  const res = await fetch(url);

  const data = await res.json();

  const route =
    data?.routes?.[0];

  if (!route) {
    return {
      distance: 0,
      duration: 0,
      coords: [],
    };
  }

  return {
    distance: route.distance, // meters
    duration: route.duration, // seconds

    coords:
      route.geometry.coordinates.map(
        (c: number[]) => ({
          lng: c[0],
          lat: c[1],
        })
      ),
  };
}