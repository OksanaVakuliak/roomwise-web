import type {
  Estimate,
  EstimateLine,
  EstimateMessage,
  Section,
} from '@roomwise/calc-engine';
import { roomDisplayName } from '@/lib/draft/rooms';
import type { DraftRoom } from '@/lib/draft/schema';
import { accessoryKey } from '@/lib/engine/accessory-component';
import { partKopecks } from '@/lib/engine/part-kopecks';
import {
  groupLines,
  type LineView,
  type Money,
  OBJECT_GROUP_ID,
  sumMoney,
} from '@/lib/engine/sections';

export type EstimateLineKind =
  | 'base'
  | 'product'
  | 'option'
  | 'packageItem'
  | 'rule'
  | 'unknown';

export type EstimateLineModel = {
  id: string;
  section: Section;
  status: EstimateLine['status'];
  kind: EstimateLineKind;
  title: string | null;
  brand: string | null;
  categoryId: string | null;
  category: string | null;
  roomClientId: string | null;
  roomNames: readonly string[];
  quantity: number | null;
  unit: string | null;
  unitPriceCents: number | null;
  amountCents: number | null;
  amountUahKopecks: number | null;
  warnings: readonly EstimateMessage[];
  errorCode: string | null;
  disabled: boolean;
  accessories: readonly EstimateAccessoryModel[];
};

export type EstimateAccessoryModel = {
  id: string;
  key: string;
  name: string;
  amountCents: number;
  amountUahKopecks: number | null;
};

export type EstimateFlatSectionModel = {
  subtotal: Money | null;
  lines: readonly EstimateLineModel[];
};

export type EstimateRoomModel = {
  roomClientId: string;
  name: string;
  subtotal: Money | null;
  lines: readonly EstimateLineModel[];
  warnings: readonly EstimateMessage[];
};

export type EstimateMaterialsModel = {
  subtotal: Money | null;
  rooms: readonly EstimateRoomModel[];
  balcony: EstimateRoomModel | null;
};

export type EstimateModel = {
  base: EstimateFlatSectionModel;
  materials: EstimateMaterialsModel;
  engineering: EstimateFlatSectionModel;
  additional: EstimateFlatSectionModel;
};

export type EstimateProductName = { name: string; brand: string | null };

export type EstimateCatalog = {
  product: (id: string) => EstimateProductName | undefined;
  category: (id: string) => string | undefined;
  option: (id: string) => string | undefined;
  packageItem: (id: string) => string | undefined;
  rule: (id: string) => string | undefined;
  accessory: (coefficientKey: string) => string | undefined;
};

export type EstimateRoomInput = {
  clientId: string;
  name: string;
  disabledCategoryIds: readonly string[];
};

export type BuildEstimateModelInput = {
  estimate: Estimate;
  rooms: readonly EstimateRoomInput[];
  catalog: EstimateCatalog;
  blockedLineIds?: ReadonlySet<string>;
  optionRoomIds?: ReadonlyMap<string, readonly string[]>;
};

export function toEstimateRooms(
  rooms: readonly DraftRoom[],
  typeLabel: (roomTypeCode: string) => string,
): EstimateRoomInput[] {
  return rooms.map((room) => ({
    clientId: room.clientId,
    name: roomDisplayName(
      rooms,
      room,
      room.roomTypeCode === null ? '' : typeLabel(room.roomTypeCode),
    ),
    disabledCategoryIds: Object.entries(room.selections)
      .filter(([, selection]) => selection?.disabled === true)
      .map(([categoryId]) => categoryId),
  }));
}

function subtotalOf(lines: readonly EstimateLineModel[]): Money | null {
  const parts: Money[] = [];
  for (const line of lines) {
    if (line.amountCents === null) {
      return null;
    }
    parts.push({
      usdCents: line.amountCents,
      uahKopecks: line.amountUahKopecks,
    });
  }
  return sumMoney(parts);
}

function kindOf(line: LineView): EstimateLineKind {
  if (line.productId !== null) {
    return 'product';
  }
  if (line.optionId !== null) {
    return 'option';
  }
  if (line.packageItemId !== null) {
    return 'packageItem';
  }
  if (line.ruleId !== null) {
    return 'rule';
  }
  return line.section === 'BASE' ? 'base' : 'unknown';
}

function titleOf(
  line: LineView,
  kind: EstimateLineKind,
  product: EstimateProductName | undefined,
  catalog: EstimateCatalog,
): string | undefined {
  switch (kind) {
    case 'product':
      return product?.name;
    case 'option':
      return line.optionId === null ? undefined : catalog.option(line.optionId);
    case 'packageItem':
      return line.packageItemId === null
        ? undefined
        : catalog.packageItem(line.packageItemId);
    case 'rule':
      return line.ruleId === null ? undefined : catalog.rule(line.ruleId);
    default:
      return undefined;
  }
}

function accessoriesOf(
  line: LineView,
  catalog: EstimateCatalog,
  rate: string | null,
): EstimateAccessoryModel[] {
  if (line.status !== 'OK' || line.amountCents === null) {
    return [];
  }
  const components = line.components ?? [];
  const kopecks = partKopecks(
    components.map((component) => component.amountCents),
    line.amountUahKopecks,
    rate,
  );
  return components.flatMap((component, index) => {
    const key = accessoryKey(component);
    const name = key === undefined ? undefined : catalog.accessory(key);
    return key === undefined || name === undefined
      ? []
      : [
          {
            id: `${key}-${index}`,
            key,
            name,
            amountCents: component.amountCents,
            amountUahKopecks: kopecks[index] ?? null,
          },
        ];
  });
}

function toLineModel(
  line: LineView,
  catalog: EstimateCatalog,
  rate: string | null,
  disabled: boolean,
  roomNames: readonly string[] = [],
): EstimateLineModel {
  const kind = kindOf(line);
  const product =
    line.productId === null ? undefined : catalog.product(line.productId);
  return {
    id: line.id,
    section: line.section,
    status: line.status,
    kind,
    title: titleOf(line, kind, product, catalog) ?? null,
    brand: product?.brand ?? null,
    categoryId: line.categoryId,
    category:
      line.categoryId === null
        ? null
        : (catalog.category(line.categoryId) ?? null),
    roomClientId: line.roomClientId,
    roomNames,
    quantity: line.quantity,
    unit: line.unit,
    unitPriceCents: line.unitPriceCents,
    amountCents: line.amountCents,
    amountUahKopecks: line.amountUahKopecks,
    warnings: line.warnings,
    errorCode: line.error?.code ?? null,
    disabled,
    accessories: accessoriesOf(line, catalog, rate),
  };
}

function disabledLine(
  room: EstimateRoomInput,
  categoryId: string,
  catalog: EstimateCatalog,
): EstimateLineModel {
  return {
    id: `MATERIALS:${room.clientId}:${categoryId}`,
    section: 'MATERIALS',
    status: 'OK',
    kind: 'product',
    title: null,
    brand: null,
    categoryId,
    category: catalog.category(categoryId) ?? null,
    roomClientId: room.clientId,
    roomNames: [],
    quantity: null,
    unit: null,
    unitPriceCents: null,
    amountCents: 0,
    amountUahKopecks: 0,
    warnings: [],
    errorCode: null,
    disabled: true,
    accessories: [],
  };
}

function toLineModels(
  lines: readonly LineView[],
  catalog: EstimateCatalog,
  rate: string | null,
  roomNames: ReadonlyMap<string, string>,
  optionRoomIds: ReadonlyMap<string, readonly string[]>,
): EstimateLineModel[] {
  return lines.map((line) => {
    const ids =
      line.roomClientId !== null
        ? [line.roomClientId]
        : (optionRoomIds.get(line.optionId ?? '') ?? []);
    return toLineModel(
      line,
      catalog,
      rate,
      false,
      ids.flatMap((id) => roomNames.get(id) ?? []),
    );
  });
}

function roomWarningsOf(
  estimate: Estimate,
  roomClientId: string,
): EstimateMessage[] {
  return estimate.warnings.filter(
    (warning) =>
      warning.code === 'AREA_SHARE_UNALLOCATED' &&
      warning.params?.roomClientId === roomClientId,
  );
}

function roomModelOf(
  roomClientId: string,
  input: EstimateRoomInput | undefined,
  rawLines: readonly LineView[],
  catalog: EstimateCatalog,
  rate: string | null,
  warnings: readonly EstimateMessage[] = [],
): EstimateRoomModel | null {
  const disabledIds = new Set(input?.disabledCategoryIds);
  const lines = rawLines.map((line) =>
    toLineModel(
      line,
      catalog,
      rate,
      line.categoryId !== null && disabledIds.has(line.categoryId),
    ),
  );
  if (input) {
    const present = new Set(lines.map((line) => line.id));
    for (const categoryId of disabledIds) {
      const synthetic = disabledLine(input, categoryId, catalog);
      if (!present.has(synthetic.id)) {
        lines.push(synthetic);
      }
    }
  }
  if (lines.length === 0) {
    return null;
  }
  return {
    roomClientId,
    name: input?.name ?? '',
    subtotal: subtotalOf(lines),
    lines,
    warnings,
  };
}

export function buildEstimateModel({
  estimate,
  rooms,
  catalog,
  blockedLineIds,
  optionRoomIds = new Map(),
}: BuildEstimateModelInput): EstimateModel {
  const grouped = groupLines(
    estimate,
    rooms.map((room) => room.clientId),
    blockedLineIds,
  );
  const rate = estimate.exchangeRate?.rate ?? null;
  const inputs = new Map(rooms.map((room) => [room.clientId, room]));
  const roomNames = new Map(rooms.map((room) => [room.clientId, room.name]));
  const rawByRoom = new Map(
    grouped.materials.map((room) => [room.roomClientId, room.lines]),
  );
  const order = [
    ...inputs.keys(),
    ...[...rawByRoom.keys()].filter(
      (id) => !inputs.has(id) && id !== OBJECT_GROUP_ID,
    ),
  ];

  const roomModels: EstimateRoomModel[] = [];
  for (const roomClientId of order) {
    const model = roomModelOf(
      roomClientId,
      inputs.get(roomClientId),
      rawByRoom.get(roomClientId) ?? [],
      catalog,
      rate,
      roomWarningsOf(estimate, roomClientId),
    );
    if (model) {
      roomModels.push(model);
    }
  }

  const balcony = roomModelOf(
    OBJECT_GROUP_ID,
    undefined,
    rawByRoom.get(OBJECT_GROUP_ID) ?? [],
    catalog,
    rate,
  );
  const baseLines = toLineModels(
    grouped.base,
    catalog,
    rate,
    roomNames,
    optionRoomIds,
  );
  const engineering = toLineModels(
    grouped.engineering,
    catalog,
    rate,
    roomNames,
    optionRoomIds,
  );
  const additional = toLineModels(
    grouped.additional,
    catalog,
    rate,
    roomNames,
    optionRoomIds,
  );

  return {
    base: { lines: baseLines, subtotal: subtotalOf(baseLines) },
    materials: {
      subtotal: subtotalOf(
        [...roomModels, ...(balcony ? [balcony] : [])].flatMap(
          (room) => room.lines,
        ),
      ),
      rooms: roomModels,
      balcony,
    },
    engineering: { lines: engineering, subtotal: subtotalOf(engineering) },
    additional: { lines: additional, subtotal: subtotalOf(additional) },
  };
}
