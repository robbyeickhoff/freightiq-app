export type StopPosition = {
  address: string | null;
  lat: number;
  lng: number;
  entrance_lat: number | null;
  entrance_lng: number | null;
};

export type StopDestination = StopPosition & { address: string; city: string; state_code: string };

export function stopPosition(row: StopPosition): StopPosition {
  return {
    address: row.address ?? null,
    lat: Number(row.lat),
    lng: Number(row.lng),
    entrance_lat: row.entrance_lat ?? null,
    entrance_lng: row.entrance_lng ?? null,
  };
}

// An in-flight read started before a successful move must not restore old coordinates.
let locationEpoch = 0;
export function getStopLocationEpoch() {
  return locationEpoch;
}
export function invalidateStopLocations() {
  locationEpoch += 1;
}

export function replaceMovedPin<T extends { id: string }>(
  pins: T[],
  id: string,
  location: StopDestination,
): T[] {
  return pins.map((pin) =>
    pin.id === id
      ? { ...pin, address: location.address, lat: location.lat, lng: location.lng }
      : pin,
  );
}

export function replaceMovedDz(intel: Record<string, unknown>, location: StopDestination) {
  const next = { ...intel };
  if (location.entrance_lat === null) {
    delete next.entranceLat;
    delete next.entranceLng;
  } else {
    next.entranceLat = location.entrance_lat;
    next.entranceLng = location.entrance_lng;
  }
  return next;
}
