export type Coordinate = {
  lat: number;
  lng: number;
};

/**
 * =========================================
 * OSRM ROUTE FETCHER
 * REAL ROAD ROUTES (DRIVING)
 * =========================================
 */

export async function getOSRMRoute(
  start: Coordinate,
  end: Coordinate
): Promise<Coordinate[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

    const res = await fetch(url);

    const data = await res.json();

    if (!data.routes?.length) {
      return [];
    }

    const coords =
      data.routes[0].geometry.coordinates;

    /**
     * OSRM returns:
     * [lng, lat]
     * convert to [lat, lng]
     */

    return coords.map(
      (c: number[]) => ({
        lat: c[1],
        lng: c[0],
      })
    );
  } catch (err) {
    console.error(
      "OSRM route error:",
      err
    );
    return [];
  }
}