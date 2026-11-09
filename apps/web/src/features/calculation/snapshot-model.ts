import type { Estimate } from '@roomwise/calc-engine';
import {
  buildEstimateModel,
  type EstimateCatalog,
  type EstimateModel,
  type EstimateProductName,
  type EstimateRoomInput,
} from '@/features/estimate';
import type { VersionView } from '@/lib/api/calculations';
import { roomOrdinal } from '@/lib/draft/rooms';

type Line = VersionView['lines'][number];

const UNAVAILABLE_CODE = 'PRODUCT_UNAVAILABLE';

function indexNames(
  lines: readonly Line[],
  idOf: (line: Line) => string | null,
  nameOf: (line: Line) => string | null,
): Map<string, string> {
  const names = new Map<string, string>();
  for (const line of lines) {
    const id = idOf(line);
    const name = nameOf(line);
    if (id !== null && name !== null && !names.has(id)) {
      names.set(id, name);
    }
  }
  return names;
}

export function snapshotCatalog(
  lines: readonly Line[],
  accessories: Readonly<Record<string, string>> = {},
): EstimateCatalog {
  const products = new Map<string, EstimateProductName>();
  for (const line of lines) {
    if (line.productId !== null && line.product !== null) {
      products.set(line.productId, {
        name: line.product.name,
        brand: line.product.brand === '' ? null : line.product.brand,
      });
    }
  }
  const categories = indexNames(
    lines,
    (line) => line.categoryId,
    (line) => line.categoryName,
  );
  const options = indexNames(
    lines,
    (line) => line.optionId,
    (line) => line.optionName,
  );
  const packageItems = indexNames(
    lines,
    (line) => line.packageItemId,
    (line) => line.packageItemName,
  );
  const rules = indexNames(
    lines,
    (line) => line.ruleId,
    (line) => line.ruleName,
  );
  return {
    product: (id) => products.get(id),
    category: (id) => categories.get(id),
    option: (id) => options.get(id),
    packageItem: (id) => packageItems.get(id),
    rule: (id) => rules.get(id),
    accessory: (key) => accessories[key],
  };
}

export function snapshotRooms(version: VersionView): EstimateRoomInput[] {
  const customNames = new Map(
    version.configuration.rooms.map((room) => [room.clientId, room.name]),
  );
  return version.rooms.map((room) => ({
    clientId: room.clientId,
    name:
      customNames.get(room.clientId) ??
      `${room.roomTypeName} ${roomOrdinal(version.rooms, room.clientId) ?? 1}`,
    disabledCategoryIds: [],
  }));
}

function unavailableLineIds(version: VersionView): ReadonlySet<string> {
  return new Set(
    version.priceStatus?.unavailableItems.map((item) => item.lineId),
  );
}

export function snapshotEstimate(version: VersionView): Estimate {
  const unavailable = unavailableLineIds(version);
  return {
    pricingVersion: version.pricingVersion,
    currency: version.configuration.currency,
    exchangeRate: version.exchangeRate,
    lines: version.lines.map((line) => ({
      id: line.id,
      section: line.section,
      status: line.status,
      roomClientId: line.roomClientId,
      categoryId: line.categoryId,
      productId: line.productId,
      optionId: line.optionId,
      packageItemId: line.packageItemId,
      ruleId: line.ruleId,
      quantity: line.quantity,
      unit: line.unit,
      unitPriceCents: line.unitPriceCents,
      amountCents: line.amountCents,
      amountUahKopecks: line.amountUahKopecks,
      components: line.components,
      warnings: line.warnings,
      error:
        line.error ??
        (unavailable.has(line.id) ? { code: UNAVAILABLE_CODE } : null),
    })),
    totals: version.totals as Estimate['totals'],
    warnings: version.warnings,
    incomplete: version.incomplete,
  };
}

export function toSnapshotModel(version: VersionView): EstimateModel {
  return buildEstimateModel({
    estimate: snapshotEstimate(version),
    rooms: snapshotRooms(version),
    catalog: snapshotCatalog(version.lines, version.accessories),
  });
}
