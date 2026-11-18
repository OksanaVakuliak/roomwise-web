import type { Locale } from 'next-intl';
import { roomMetrics } from '@/lib/draft/rooms';
import type { DraftRoom } from '@/lib/draft/schema';
import { area, dimension } from '@/lib/format';
import { SURFACE_KEYS, type SurfaceMaterials } from '@/lib/room-3d/materials';
import type { SceneMaterial, SurfaceKey } from '@/lib/room-3d/types';

export type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function materialLabel(t: Translate, material: SceneMaterial): string {
  if (material.kind !== 'neutral') {
    return material.name;
  }
  return t(
    material.reason === 'disabled' ? 'surface.excluded' : 'surface.none',
  );
}

export function surfaceLine(
  t: Translate,
  key: SurfaceKey,
  material: SceneMaterial,
): string {
  return t(`surface.${key}`, { material: materialLabel(t, material) });
}

export function surfaceLines(
  t: Translate,
  surfaces: SurfaceMaterials,
): string[] {
  return SURFACE_KEYS.map((key) => surfaceLine(t, key, surfaces[key]));
}

export function materialSignature(material: SceneMaterial): string {
  return material.kind === 'neutral'
    ? `neutral:${material.reason}`
    : `${material.kind}:${material.productId}:${material.name}`;
}

export type SettledSurfaces = Partial<Record<SurfaceKey, string>>;

export function settleSurfaces(
  previous: SettledSurfaces,
  next: SurfaceMaterials,
): { settled: SettledSurfaces; changed: SurfaceKey | null } {
  const settled: SettledSurfaces = { ...previous };
  const changed: SurfaceKey[] = [];
  for (const key of SURFACE_KEYS) {
    const material = next[key];
    if (material.kind === 'neutral' && material.reason === 'loading') {
      continue;
    }
    const signature = materialSignature(material);
    const before = previous[key];
    if (before !== undefined && before !== signature) {
      changed.push(key);
    }
    settled[key] = signature;
  }
  return {
    settled,
    changed: changed.length === 1 ? (changed[0] ?? null) : null,
  };
}

export function sceneDescription({
  t,
  locale,
  name,
  room,
  surfaces,
}: {
  t: Translate;
  locale: Locale;
  name: string;
  room: DraftRoom;
  surfaces: SurfaceMaterials;
}): string {
  const { lengthM, widthM, heightM } = room;
  if (lengthM === null || widthM === null || heightM === null) {
    return '';
  }
  const metrics = roomMetrics(room);
  const values = {
    name,
    length: dimension(lengthM, locale),
    width: dimension(widthM, locale),
    height: dimension(heightM, locale),
  };
  const summary = metrics
    ? t('description', { ...values, area: area(metrics.floorArea, locale) })
    : t('descriptionNoArea', values);
  return [summary, ...surfaceLines(t, surfaces)].join('. ');
}
