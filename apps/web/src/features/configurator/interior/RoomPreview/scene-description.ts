import type { Locale, useTranslations } from 'next-intl';
import { roomFloorArea } from '@/lib/draft/rooms';
import type { DraftRoom } from '@/lib/draft/schema';
import { area } from '@/lib/format';
import { SURFACE_KEYS, type SurfaceMaterials } from '@/lib/room-3d/materials';
import type { SceneMaterial, SurfaceKey } from '@/lib/room-3d/types';

export type Translate = ReturnType<typeof useTranslations<'RoomPreview'>>;

export function materialLabel(t: Translate, material: SceneMaterial): string {
  if (material.kind !== 'neutral') {
    return material.name;
  }
  if (material.reason === 'disabled') {
    return t('surface.excluded');
  }
  return t(material.reason === 'loading' ? 'surface.loading' : 'surface.none');
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
    : `product:${material.productId}`;
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

export type SceneLabels = {
  name: string;
  length: string;
  width: string;
  height: string;
};

export function sceneDescription({
  t,
  locale,
  labels,
  room,
  surfaces,
}: {
  t: Translate;
  locale: Locale;
  labels: SceneLabels;
  room: DraftRoom;
  surfaces: SurfaceMaterials;
}): string {
  const floorArea = roomFloorArea(room);
  const summary =
    floorArea === null
      ? t('descriptionNoArea', labels)
      : t('description', { ...labels, area: area(floorArea, locale) });
  return [summary, ...surfaceLines(t, surfaces)].join('. ');
}
