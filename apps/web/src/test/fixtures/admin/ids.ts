import type { components } from '@/generated/api';

type Schemas = components['schemas'];

export type LocalizedText = { en: string; uk: string };
export type Actor = NonNullable<Schemas['RuleAdminDto_Output']['updatedBy']>;
export type Stamp = Pick<
  Schemas['RuleAdminDto_Output'],
  'revision' | 'updatedAt' | 'updatedBy'
>;
export type AdminImageRef = NonNullable<
  Schemas['StyleAdminDto_Output']['image']
>;

export const adminUuid = (n: number): string =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const adminActor: Actor = {
  id: adminUuid(1),
  login: 'admin',
};

export const adminIds = {
  admin: adminUuid(1),
  demo: adminUuid(2),
  roomTypes: {
    LIVING_ROOM: adminUuid(100),
    BEDROOM: adminUuid(101),
    KITCHEN: adminUuid(102),
    KITCHEN_LIVING: adminUuid(103),
    BATHROOM: adminUuid(104),
    HALLWAY: adminUuid(105),
    STORAGE: adminUuid(106),
  },
  categories: {
    flooring: adminUuid(200),
    wallFinish: adminUuid(201),
    ceilingFinish: adminUuid(202),
    plumbing: adminUuid(203),
    legacyDecor: adminUuid(204),
    unpublishedLighting: adminUuid(205),
  },
  materialTypes: {
    laminate: adminUuid(300),
    tile: adminUuid(301),
    paint: adminUuid(302),
    wallpaper: adminUuid(303),
  },
  products: {
    laminate: adminUuid(400),
    draftTile: adminUuid(401),
    textured: adminUuid(402),
    archived: adminUuid(403),
    inStyle: adminUuid(404),
  },
  styles: {
    modern: adminUuid(500),
    classic: adminUuid(501),
    draft: adminUuid(502),
  },
  packageItems: {
    wiring: adminUuid(600),
    plumbing: adminUuid(601),
    ventilation: adminUuid(602),
  },
  options: {
    heatedFloor: adminUuid(700),
    airConditioner: adminUuid(701),
    smartHome: adminUuid(702),
    cleaning: adminUuid(703),
  },
  coefficients: {
    laborRate: adminUuid(800),
    puttyLayers: adminUuid(801),
    adhesive: adminUuid(802),
    cablePerRoom: adminUuid(803),
    unusedExtra: adminUuid(804),
  },
  rules: {
    objectBase: adminUuid(900),
    categoryLaminate: adminUuid(901),
    materialTile: adminUuid(902),
    surfaceWalls: adminUuid(903),
    orphan: adminUuid(904),
  },
  leads: {
    new: adminUuid(1000),
    inProgress: adminUuid(1001),
    done: adminUuid(1002),
    rejected: adminUuid(1003),
    spam: adminUuid(1004),
  },
  images: {
    laminate: adminUuid(1100),
    style: adminUuid(1101),
    texture: adminUuid(1102),
  },
} as const;

export function makeStamp(overrides: Partial<Stamp> = {}): Stamp {
  return {
    revision: adminUuid(9000),
    updatedAt: '2026-11-10T09:30:00.000Z',
    updatedBy: adminActor,
    ...overrides,
  };
}

export function makeAdminImageRef(
  id: string = adminIds.images.style,
  overrides: Partial<AdminImageRef> = {},
): AdminImageRef {
  return {
    id,
    thumb: `https://res.cloudinary.example.com/roomwise/${id}/thumb.webp`,
    card: `https://res.cloudinary.example.com/roomwise/${id}/card.webp`,
    zoom: `https://res.cloudinary.example.com/roomwise/${id}/zoom.webp`,
    ...overrides,
  };
}
