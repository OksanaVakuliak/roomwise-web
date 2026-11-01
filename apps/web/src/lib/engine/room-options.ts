export const HEATED_FLOOR_CODE = 'HEATED_FLOOR';

export type RoomOptionLike = {
  code: string | null;
  kind: string;
  perRoom: boolean;
  roomTypeCodes: readonly string[];
  available?: boolean;
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

export function roomOptionsFor<T extends RoomOptionLike>(
  options: readonly T[],
  roomTypeCode: string | null,
): T[] {
  if (roomTypeCode === null) {
    return [];
  }
  return options.filter(
    (option) =>
      option.kind === 'ENGINEERING' &&
      option.perRoom &&
      option.code !== HEATED_FLOOR_CODE &&
      isOptionAllowedForRoom(option, roomTypeCode),
  );
}
