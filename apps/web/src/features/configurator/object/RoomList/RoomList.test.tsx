import { act, fireEvent, screen, within } from '@testing-library/react';
import { createTranslator, type Locale } from 'next-intl';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultDraft } from '@/lib/draft/schema';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import { makeDraftRoom, makeEmptyDraft } from '@/test/fixtures/draft';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { roomFieldDomId } from '../RoomEditor/room-field';
import { RoomList, type RoomListProps } from './RoomList';

const catalogs = { en, uk };
const noop = () => undefined;

function translator(locale: Locale) {
  return createTranslator({
    locale,
    messages: catalogs[locale],
    namespace: 'ObjectStep.rooms',
  });
}

async function renderList(
  draft = makeEmptyDraft(),
  locale: Locale = 'en',
  props: RoomListProps = {},
) {
  useDraft.setState({ ...draft, revision: 1 });
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(<RoomList {...props} />, { locale });
  });
  return result;
}

function items(locale: Locale) {
  return within(
    screen.getByRole('list', { name: translator(locale)('title') }),
  ).getAllByRole('listitem');
}

const withMaterial = makeDraftRoom({
  clientId: 'with-material',
  roomTypeCode: 'BEDROOM',
  heatedFloor: true,
});
const plain = makeDraftRoom({ clientId: 'plain', roomTypeCode: 'BEDROOM' });

describe('RoomList', () => {
  beforeEach(() => {
    installMemoryStorage();
    useDraft.setState({ ...createDefaultDraft(), revision: 0 });
  });

  it.each(forEachLocale)('shows the empty state in %s', async (locale) => {
    const t = translator(locale);
    await renderList(makeEmptyDraft(), locale);

    expect(screen.getByText(t('empty'))).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: t('add') })).toBeInTheDocument();
  });

  it.each(forEachLocale)(
    'adds a room and focuses its type field in %s',
    async (locale) => {
      const t = translator(locale);
      await renderList(makeEmptyDraft(), locale);

      fireEvent.click(screen.getByRole('button', { name: t('add') }));

      expect(items(locale)).toHaveLength(1);
      expect(
        within(items(locale)[0]).getByRole('combobox', { name: t('type') }),
      ).toHaveFocus();
    },
  );

  it('shows 14 m² for a 4 × 3.5 bedroom', async () => {
    const t = translator('en');
    await renderList(makeEmptyDraft());
    fireEvent.click(screen.getByRole('button', { name: t('add') }));
    const [room] = items('en');

    fireEvent.change(within(room).getByRole('combobox', { name: t('type') }), {
      target: { value: 'BEDROOM' },
    });
    fireEvent.change(
      within(room).getByRole('spinbutton', { name: t('length') }),
      { target: { value: '4' } },
    );
    fireEvent.change(
      within(room).getByRole('spinbutton', { name: t('width') }),
      { target: { value: '3.5' } },
    );

    expect(
      within(room).getByText(t('areaValue', { value: '14' })),
    ).toBeInTheDocument();
  });

  it('names a room and falls back to the generated name when cleared', async () => {
    const t = translator('en');
    await renderList(makeEmptyDraft({ rooms: [plain] }));
    const [room] = items('en');
    const name = within(room).getByRole('textbox', { name: t('name') });

    expect(name).toHaveAttribute('placeholder', 'Bedroom 1');

    fireEvent.change(name, { target: { value: 'Nursery' } });
    expect(useDraft.getState().rooms[0].name).toBe('Nursery');
    expect(within(room).getByText('Nursery')).toBeInTheDocument();

    fireEvent.change(name, { target: { value: '' } });
    expect(useDraft.getState().rooms[0].name).toBeNull();
    expect(within(room).getByText('Bedroom 1')).toBeInTheDocument();
  });

  it('deletes a room without material immediately and focuses the next delete button', async () => {
    const t = translator('en');
    await renderList(makeEmptyDraft({ rooms: [plain, withMaterial] }));

    fireEvent.click(
      within(items('en')[0]).getByRole('button', { name: t('delete') }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useDraft.getState().rooms.map((room) => room.clientId)).toEqual([
      'with-material',
    ]);
    expect(
      within(items('en')[0]).getByRole('button', { name: t('delete') }),
    ).toHaveFocus();
  });

  it('focuses the add button after the last room is deleted', async () => {
    const t = translator('en');
    await renderList(makeEmptyDraft({ rooms: [plain] }));

    fireEvent.click(screen.getByRole('button', { name: t('delete') }));

    expect(useDraft.getState().rooms).toHaveLength(0);
    expect(screen.getByRole('button', { name: t('add') })).toHaveFocus();
  });

  it.each(forEachLocale)(
    'asks for confirmation before deleting a room with a heated floor in %s',
    async (locale) => {
      const t = translator(locale);
      await renderList(makeEmptyDraft({ rooms: [withMaterial] }), locale);

      fireEvent.click(screen.getByRole('button', { name: t('delete') }));
      const dialog = screen.getByRole('dialog', { name: t('deleteTitle') });
      expect(useDraft.getState().rooms).toHaveLength(1);

      fireEvent.click(
        within(dialog).getByRole('button', { name: t('deleteConfirm') }),
      );

      expect(useDraft.getState().rooms).toHaveLength(0);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    },
  );

  it('keeps the room when the confirmation is cancelled with Escape', async () => {
    const t = translator('en');
    await renderList(makeEmptyDraft({ rooms: [withMaterial] }));

    fireEvent.click(screen.getByRole('button', { name: t('delete') }));
    const dialog = screen.getByRole('dialog', { name: t('deleteTitle') });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(useDraft.getState().rooms).toHaveLength(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the room when the confirmation is declined', async () => {
    const t = translator('en');
    await renderList(makeEmptyDraft({ rooms: [withMaterial] }));

    fireEvent.click(screen.getByRole('button', { name: t('delete') }));
    fireEvent.click(screen.getByRole('button', { name: t('deleteCancel') }));

    expect(useDraft.getState().rooms).toHaveLength(1);
  });

  it('lets the mismatch action delete the room through the same flow', async () => {
    const t = translator('en');
    const mismatched = makeDraftRoom({
      clientId: 'mismatched',
      roomTypeCode: 'LIVING_ROOM',
    });
    const draft = makeEmptyDraft({ rooms: [mismatched] });
    await renderList({
      ...draft,
      object: { ...draft.object, kitchenType: 'KITCHEN_LIVING' },
    });

    expect(screen.getByText(t('typeMismatch'))).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: t('deleteMismatched') }),
    );

    expect(useDraft.getState().rooms).toHaveLength(0);
  });

  it('passes field errors to the matching room only', async () => {
    const t = translator('en');
    await renderList(makeEmptyDraft({ rooms: [plain, withMaterial] }), 'en', {
      errors: { plain: { heightM: 'Enter a value' } },
    });
    const [first, second] = items('en');

    expect(
      within(first).getByRole('spinbutton', { name: t('height') }),
    ).toHaveAttribute('aria-invalid', 'true');
    expect(
      within(second).getByRole('spinbutton', { name: t('height') }),
    ).not.toHaveAttribute('aria-invalid');
    expect(document.getElementById(roomFieldDomId('plain', 'heightM'))).toBe(
      within(first).getByRole('spinbutton', { name: t('height') }),
    );
  });

  it.each(forEachLocale)(
    'has no accessibility violations in %s',
    async (locale) => {
      const { container } = await renderList(
        makeEmptyDraft({ rooms: [plain, withMaterial] }),
        locale,
        { errors: { plain: { heightM: 'x' } } },
      );

      expect(await axe(container)).toHaveNoViolations();
    },
  );

  it('has no accessibility violations with an open confirmation', async () => {
    const t = translator('en');
    const { baseElement } = await renderList(
      makeEmptyDraft({ rooms: [withMaterial] }),
    );

    fireEvent.click(screen.getByRole('button', { name: t('delete') }));

    expect(await axe(baseElement)).toHaveNoViolations();
  });
});
