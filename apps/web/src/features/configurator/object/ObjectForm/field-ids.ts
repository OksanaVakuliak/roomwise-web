export type ObjectFieldId =
  | 'finishLevel'
  | 'totalArea'
  | 'gas'
  | 'kitchenType'
  | 'balconyArea'
  | 'balconyTiles';

export function objectFieldDomId(field: ObjectFieldId): string {
  return `object-${field}`;
}
