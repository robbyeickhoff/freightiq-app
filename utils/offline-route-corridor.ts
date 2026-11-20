import { buffer } from '@turf/buffer';
import { lineString, point } from '@turf/helpers';
import type { Polygon, MultiPolygon } from 'geojson';
import type { RouteCoordinate } from './route-plan';
// @ts-expect-error Node strip-types tests require the explicit TypeScript extension.
import { offlineRouteBounds, containsOfflineStop, type OfflineRouteBounds } from './offline-route-coverage.ts';

export type OfflineCoverage = OfflineRouteBounds | { bounds: OfflineRouteBounds; geometryJSON: string };

// Keep the same 5 km rerouting margin, but follow the road instead of filling
// the entire rectangle between distant bends. Turf handles loops and overlaps.
export function offlineRouteCorridor(points: RouteCoordinate[]) {
  const bounds = offlineRouteBounds(points);
  if (!bounds) return null;
  const coordinates = points.map(({ longitude, latitude }) => [longitude, latitude]);
  const distinct = coordinates.filter((p, i) => i === 0 || p[0] !== coordinates[i - 1][0] || p[1] !== coordinates[i - 1][1]);
  const feature = distinct.length > 1 ? lineString(distinct) : point(distinct[0]);
  const result = buffer(feature, 5, { units: 'kilometers', steps: 8 });
  if (!result) return null;
  return { bounds, geometryJSON: JSON.stringify(result.geometry) };
}

function inRing(ring: number[][], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function containsOfflinePoint(coverage: OfflineCoverage, point: RouteCoordinate): boolean {
  if (Array.isArray(coverage)) return containsOfflineStop(coverage, point);
  if (!containsOfflineStop(coverage.bounds, point)) return false;
  try {
    const geometry = JSON.parse(coverage.geometryJSON) as Polygon | MultiPolygon;
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
    return polygons.some((rings) => inRing(rings[0], point.longitude, point.latitude) &&
      !rings.slice(1).some((ring) => inRing(ring, point.longitude, point.latitude)));
  } catch { return false; }
}
