export type RoomFieldId =
  | 'roomTypeCode'
  | 'name'
  | 'lengthM'
  | 'widthM'
  | 'heightM';

export type RoomFieldErrors = Partial<Record<RoomFieldId, string>>;

export function roomFieldDomId(clientId: string, field: RoomFieldId): string {
  return `room-${clientId}-${field}`;
}

export function roomDeleteDomId(clientId: string): string {
  return `room-${clientId}-delete`;
}
