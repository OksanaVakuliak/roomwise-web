import { act, screen, within } from '@testing-library/react';
import { runEstimate } from '@/lib/engine/run-estimate';
import { moneyMinor } from '@/lib/format';
import { useDraft } from '@/stores/draft';
import {
  categoryIds,
  makeCategoryProducts,
  makeRoomTypes,
  productIds,
  type RoomTypesResponse,
} from '@/test/fixtures/catalog';
import {
  type DraftV1,
  makeDraftRoom,
  makeInteriorDraft,
} from '@/test/fixtures/draft';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  createTestQueryClient,
  renderWithProviders,
  seedCatalog,
} from '@/test/render-with-providers';
import { setViewport } from '@/test/viewports';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { ConfiguratorShell } from '../shell/ConfiguratorShell/ConfiguratorShell';
import { InteriorStep } from './InteriorStep/InteriorStep';

export const noLandmarkRule = { rules: { region: { enabled: false } } };
export const catalogs = { en, uk };
export const pricing = makePricingData();

export const livingId = '00000000-0000-4000-8000-000000000301';
export const bathroomId = '00000000-0000-4000-8000-000000000302';
export const bedroomId = '00000000-0000-4000-8000-000000000303';
export const kitchenLivingId = '00000000-0000-4000-8000-000000000304';

export const FLOOR_NAMES = [
  'Oak Natural Laminate',
  'Stone Grey Porcelain Tile',
  'Walnut Premium Laminate',
];

export function styleSelection(productId: string) {
  return { productId, disabled: false, source: 'style' as const };
}

export function makeDraft(): DraftV1 {
  const base = makeInteriorDraft();
  return {
    ...base,
    rooms: [
      ...base.rooms,
      makeDraftRoom({
        clientId: bedroomId,
        roomTypeCode: 'BEDROOM',
        lengthM: 4,
        widthM: 3,
        selections: {
          [categoryIds.floor]: styleSelection(productIds.laminate),
          [categoryIds.walls]: styleSelection(productIds.paint),
        },
      }),
    ],
  };
}

export function makeKitchenLivingDraft(): DraftV1 {
  const base = makeInteriorDraft();
  return {
    ...base,
    rooms: [
      makeDraftRoom({
        clientId: kitchenLivingId,
        roomTypeCode: 'KITCHEN_LIVING',
        lengthM: 6,
        widthM: 4,
        selections: {
          [categoryIds.floor]: {
            productId: null,
            disabled: false,
            source: 'style',
          },
          [categoryIds.walls]: styleSelection(productIds.paint),
        },
      }),
      base.rooms[1],
    ],
  };
}

export const wallpaperId = 'cat-wallpaper';

export function makeCatalog(withWallpaper = false): RoomTypesResponse {
  const base = makeRoomTypes();
  const [floor, walls, ceiling] = base.items[0].categories;
  const wallpaper = { ...walls, id: wallpaperId, name: 'Wallpaper' };
  return {
    items: base.items.map((type) => {
      if (withWallpaper && type.code === 'LIVING_ROOM') {
        return { ...type, categories: [floor, walls, wallpaper, ceiling] };
      }
      if (type.code === 'KITCHEN_LIVING') {
        return { ...type, categories: [walls, floor] };
      }
      if (type.code === 'BEDROOM') {
        return {
          ...type,
          categories: [floor, walls, { ...ceiling, productCount: 0 }],
        };
      }
      return type;
    }),
  };
}

export type StepOptions = NonNullable<
  Parameters<typeof renderWithProviders>[1]
> & {
  viewport?: number;
  draft?: DraftV1;
  withWallpaper?: boolean;
};

export async function renderStep(url: string, options: StepOptions = {}) {
  const {
    viewport = 1024,
    draft = makeDraft(),
    withWallpaper = false,
    ...rest
  } = options;
  setViewport(viewport);
  useDraft.setState({ ...draft, revision: 1 });
  const locale = rest.locale ?? 'en';
  const queryClient = rest.queryClient ?? createTestQueryClient();
  seedCatalog(queryClient, locale);
  queryClient.setQueryData(['room-types', locale], makeCatalog(withWallpaper));
  queryClient.setQueryData(
    ['products', wallpaperId, locale],
    makeCategoryProducts(categoryIds.walls),
  );
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <ConfiguratorShell>
        <InteriorStep />
      </ConfiguratorShell>,
      { url, ...rest, catalog: false, queryClient },
    );
  });
  return result;
}

export function roomSection(name: string) {
  return screen.getByRole('region', { name: new RegExp(name) });
}

export function categoryRows(name = 'Living room') {
  return within(within(roomSection(name)).getByRole('list')).getAllByRole(
    'listitem',
  );
}

export function rowButton(row: HTMLElement) {
  return within(row).getAllByRole('button')[0];
}

export function productCards(root: HTMLElement) {
  return within(root).getAllByRole('listitem');
}

export function showcase(name: string) {
  return screen.getByRole('list', { name });
}

export function cardNamed(root: HTMLElement, name: string) {
  const found = productCards(root).find((card) =>
    card.textContent?.includes(name),
  );
  if (!found) {
    throw new Error(`No card named ${name}`);
  }
  return found;
}

export function chooseButton(root: HTMLElement, name: string) {
  return within(cardNamed(root, name)).getByRole('button', {
    name: `Choose: ${name}`,
  });
}

export function currentDraft(): DraftV1 {
  const { rooms, options, object, styleId, step, furthestStep, lastSaved } =
    useDraft.getState();
  return { rooms, options, object, styleId, step, furthestStep, lastSaved };
}

export function panelOf(draft: DraftV1) {
  return runEstimate({
    draft,
    draftRevision: 1,
    pricing,
    pricingVersion: pricing.version,
    currency: 'UAH',
  }).panel;
}

export function usd(cents: number | undefined) {
  return moneyMinor(cents ?? 0, 'USD', 'en');
}

export function costRow(label: string) {
  const term = screen.getByText(label, { selector: 'dt' });
  return within(term.parentElement as HTMLElement).getByRole('definition');
}
