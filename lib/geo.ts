export const interpolate = (
  start: number,
  end: number,
  factor: number
) => {
  return start + (end - start) * factor;
};

export const getBearing = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLon = toRad(end.lng - start.lng);

  const y =
    Math.sin(dLon) * Math.cos(toRad(end.lat));
  const x =
    Math.cos(toRad(start.lat)) * Math.sin(toRad(end.lat)) -
    Math.sin(toRad(start.lat)) *
      Math.cos(toRad(end.lat)) *
      Math.cos(dLon);

  const brng = toDeg(Math.atan2(y, x));

  return (brng + 360) % 360;
};