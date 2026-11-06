export type OptionScope = 'FULL' | 'PARTIAL';

export const HEATED_FLOOR_CODE = 'HEATED_FLOOR';

export type RoomOptionLike = {
  code: string | null;
  kind: string;
  perRoom: boolean;
  roomTypeCodes: readonly string[];
  available?: boolean;
  scopes: readonly OptionScope[];
};

export function isOptionAllowedForRoom(
  option: Pick<RoomOptionLike, 'roomTypeCodes' | 'available'>,
  roomTypeCode: string,
): boolean {
  return (
    option.available !== false &&
    (option.roomTypeCodes.length === 0 ||
      option.roomTypeCodes.includes(roomTypeCode))
  );
}

export function roomOptionsFor<T extends RoomOptionLike & { id: string }>(
  options: readonly T[],
  roomTypeCode: string | null,
  scope: OptionScope,
  chosen: Readonly<Record<string, unknown>>,
): T[] {
  if (roomTypeCode === null) {
    return [];
  }
  return options.filter(
    (option) =>
      option.kind === 'ENGINEERING' &&
      option.perRoom &&
      option.code !== HEATED_FLOOR_CODE &&
      isOptionAllowedForRoom(option, roomTypeCode) &&
      (option.scopes.includes(scope) || chosen[option.id] !== undefined),
  );
}
