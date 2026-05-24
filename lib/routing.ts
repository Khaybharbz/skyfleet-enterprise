export type LatLng = {
  lat: number;
  lng: number;
};

/**
 * =========================================
 * OSRM CONFIG
 * =========================================
 */

const OSRM_BASE =
  "https://router.project-osrm.org";

/**
 * =========================================
 * POLYLINE DECODER
 * =========================================
 */

function decodePolyline(
  str: string,
  precision = 5
) {
  let index = 0;

  let lat = 0;
  let lng = 0;

  const coordinates: LatLng[] = [];

  const factor =
    Math.pow(10, precision);

  while (index < str.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b =
        str.charCodeAt(index++) -
        63;

      result |=
        (b & 0x1f) << shift;

      shift += 5;
    } while (b >= 0x20);

    const deltaLat =
      result & 1
        ? ~(result >> 1)
        : result >> 1;

    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      b =
        str.charCodeAt(index++) -
        63;

      result |=
        (b & 0x1f) << shift;

      shift += 5;
    } while (b >= 0x20);

    const deltaLng =
      result & 1
        ? ~(result >> 1)
        : result >> 1;

    lng += deltaLng;

    coordinates.push({
      lat: lat / factor,
      lng: lng / factor,
    });
  }

  return coordinates;
}

/**
 * =========================================
 * GET ROUTE
 * =========================================
 */

export async function getRoute(
  start: LatLng,
  end: LatLng
): Promise<LatLng[]> {
  try {
    const url =
      `${OSRM_BASE}/route/v1/driving/` +
      `${start.lng},${start.lat};` +
      `${end.lng},${end.lat}` +
      `?overview=full&geometries=polyline`;

    const res =
      await fetch(url);

    const data =
      await res.json();

    if (
      !data.routes ||
      !data.routes.length
    ) {
      throw new Error(
        "No route found"
      );
    }

    const geometry =
      data.routes[0].geometry;

    return decodePolyline(
      geometry
    );
  } catch (err) {
    console.error(
      "ROUTING ERROR:",
      err
    );

    return [
      start,
      end,
    ];
  }
}