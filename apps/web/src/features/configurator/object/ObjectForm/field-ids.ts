export type ObjectFieldId =
  | 'finishLevel'
  | 'totalArea'
  | 'balconyArea'
  | 'balconyTiles';

export function objectFieldDomId(field: ObjectFieldId): string {
  return `object-${field}`;
}
