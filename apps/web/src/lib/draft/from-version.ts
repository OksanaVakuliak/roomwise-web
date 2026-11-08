import type { Configuration } from '@roomwise/calc-engine';
import type { VersionView } from '@/lib/api/calculations';
import { configurationHash } from './hash';
import { normalizeRoomName } from './rooms';
import type { DraftOption, DraftRoom, DraftV1 } from './schema';

type VersionConfiguration = VersionView['configuration'];

function toDraftRoom(room: VersionConfiguration['rooms'][number]): DraftRoom {
  const name = normalizeRoomName(room.name ?? '');
  return {
    clientId: room.clientId,
    roomTypeCode: room.roomTypeCode,
    name: name === '' ? null : name,
    lengthM: room.lengthM,
    widthM: room.widthM,
    heightM: room.heightM,
    heatedFloor: room.heatedFloor,
    selections: Object.fromEntries(
      room.selections.map(({ categoryId, productId, areaShare }) => [
        categoryId,
        {
          productId,
          disabled: false,
          source: 'manual' as const,
          ...(areaShare !== undefined && { areaShare }),
        },
      ]),
    ),
  };
}

function toDraftOptions(
  options: VersionConfiguration['options'],
  heatedFloorOptionId: string | null,
): DraftV1['options'] {
  const result: Record<string, DraftOption> = {};
  for (const option of options) {
    if (option.optionId === heatedFloorOptionId) {
      continue;
    }
    result[option.optionId] = {
      ...(option.quantity !== undefined && { quantity: option.quantity }),
      ...(option.roomClientIds !== undefined && {
        roomClientIds: option.roomClientIds,
      }),
    };
  }
  return result;
}

function toSavedConfiguration(source: VersionConfiguration): Configuration {
  return {
    scope: source.scope ?? 'FULL',
    finishLevel: source.finishLevel,
    totalAreaSqm: source.totalAreaSqm,
    balconyAreaSqm: source.balconyAreaSqm,
    balconyTiles: source.balconyTiles,
    rooms: source.rooms.map((room) => {
      const name = normalizeRoomName(room.name ?? '');
      return {
        clientId: room.clientId,
        roomTypeCode: room.roomTypeCode,
        ...(name !== '' && { name }),
        lengthM: room.lengthM,
        widthM: room.widthM,
        heightM: room.heightM,
        heatedFloor: room.heatedFloor,
        selections: room.selections.map(
          ({ categoryId, productId, areaShare }) => ({
            categoryId,
            productId,
            ...(areaShare !== undefined && { areaShare }),
          }),
        ),
      };
    }),
    options: source.options.map((option) => ({
      optionId: option.optionId,
      ...(option.quantity !== undefined && { quantity: option.quantity }),
      ...(option.roomClientIds !== undefined && {
        roomClientIds: option.roomClientIds,
      }),
    })),
    currency: 'USD',
  };
}

export function fromVersion(
  version: VersionView,
  heatedFloorOptionId: string | null,
): DraftV1 {
  const { configuration } = version;
  const styleId = version.style?.id ?? null;
  const present =
    configuration.balconyAreaSqm > 0 || configuration.balconyTiles;
  return {
    step: 'result',
    furthestStep: 'result',
    object: {
      scope: configuration.scope ?? 'FULL',
      finishLevel: configuration.finishLevel,
      totalAreaSqm: configuration.totalAreaSqm,
      balcony: {
        present,
        areaSqm: present ? configuration.balconyAreaSqm : null,
        tiles: configuration.balconyTiles,
      },
    },
    rooms: configuration.rooms.map(toDraftRoom),
    styleId,
    options: toDraftOptions(configuration.options, heatedFloorOptionId),
    lastSaved: {
      publicId: version.publicId,
      versionNumber: version.number,
      configurationHash: configurationHash(
        toSavedConfiguration(configuration),
        styleId,
      ),
    },
  };
}
