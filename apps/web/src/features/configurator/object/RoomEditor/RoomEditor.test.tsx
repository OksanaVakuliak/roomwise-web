import { act, fireEvent, screen } from '@testing-library/react';
import { createTranslator, type Locale } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultDraft } from '@/lib/draft/schema';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import { makeRoomTypes } from '@/test/fixtures/catalog';
import { makeDraftRoom } from '@/test/fixtures/draft';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { RoomEditor, type RoomEditorProps } from './RoomEditor';
import { roomFieldDomId } from './room-field';

const catalogs = { en, uk };
const noop = () => undefined;
const { limits } = makePricingData();
const roomTypes = makeRoomTypes().items.map(({ code, name }) => ({
  code,
  name,
}));

function translator(locale: Locale) {
  return createTranslator({
    locale,
    messages: catalogs[locale],
    namespace: 'ObjectStep.rooms',
  });
}

async function renderEditor(
  props: Partial<RoomEditorProps> = {},
  locale: Locale = 'en',
) {
  const room = props.room ?? makeDraftRoom({ roomTypeCode: 'BEDROOM' });
  useDraft.setState({ rooms: [room] });
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <RoomEditor
        room={room}
        rooms={[room]}
        kitchenType="SEPARATE"
        roomTypes={roomTypes}
        limits={limits}
        onDelete={noop}
        {...props}
      />,
      { locale },
    );
  });
  return { ...result, room };
}

describe('RoomEditor', () => {
  beforeEach(() => {
    installMemoryStorage();
    useDraft.setState({ ...createDefaultDraft(), revision: 0 });
  });

  it.each(forEachLocale)(
    'shows the area of 4 × 3.5 as 14 in %s',
    async (locale) => {
      const t = translator(locale);
      await renderEditor(
        {
          room: makeDraftRoom({
            roomTypeCode: 'BEDROOM',
            lengthM: 4,
            widthM: 3.5,
            heightM: 2.7,
          }),
        },
        locale,
      );

      expect(
        screen.getByText(t('areaValue', { value: '14' })),
      ).toBeInTheDocument();
    },
  );

  it('shows a dash instead of the area until both sides are set', async () => {
    await renderEditor({
      room: makeDraftRoom({
        roomTypeCode: 'BEDROOM',
        lengthM: 4,
        widthM: null,
      }),
    });

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('writes type, dimensions and name to the draft', async () => {
    const t = translator('en');
    const { room } = await renderEditor();

    fireEvent.change(screen.getByRole('combobox', { name: t('type') }), {
      target: { value: 'KITCHEN' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: t('length') }), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: t('name') }), {
      target: { value: ' Guest room ' },
    });

    expect(useDraft.getState().rooms[0]).toMatchObject({
      clientId: room.clientId,
      roomTypeCode: 'KITCHEN',
      lengthM: 5,
      name: 'Guest room',
    });
  });

  it('clears a dimension when the field is emptied', async () => {
    const t = translator('en');
    await renderEditor({
      room: makeDraftRoom({ roomTypeCode: 'BEDROOM', lengthM: 4 }),
    });

    fireEvent.change(screen.getByRole('spinbutton', { name: t('length') }), {
      target: { value: '' },
    });

    expect(useDraft.getState().rooms[0].lengthM).toBeNull();
  });

  it('uses the pricing limits as field bounds', async () => {
    const t = translator('en');
    await renderEditor();

    const height = screen.getByRole('spinbutton', { name: t('height') });
    expect(height).toHaveAttribute('min', String(limits.roomHeightM.min));
    expect(height).toHaveAttribute('max', String(limits.roomHeightM.max));
    expect(
      screen.getByRole('spinbutton', { name: t('length') }),
    ).toHaveAttribute('max', String(limits.roomSideM.max));
  });

  it('offers only types allowed for the kitchen type', async () => {
    const t = translator('en');
    await renderEditor({ kitchenType: 'KITCHEN_LIVING' });

    const options = screen
      .getAllByRole('option')
      .map((option) => option.getAttribute('value'));
    expect(options).toContain('KITCHEN_LIVING');
    expect(options).not.toContain('KITCHEN');
    expect(options).not.toContain('LIVING_ROOM');
    expect(screen.getByRole('combobox', { name: t('type') })).toHaveValue(
      'BEDROOM',
    );
  });

  it('keeps a mismatched type selected and offers both actions', async () => {
    const t = translator('en');
    const onDelete = vi.fn();
    const { room } = await renderEditor({
      room: makeDraftRoom({ roomTypeCode: 'LIVING_ROOM' }),
      kitchenType: 'KITCHEN_LIVING',
      onDelete,
    });
    const select = screen.getByRole('combobox', { name: t('type') });

    expect(select).toHaveValue('LIVING_ROOM');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(t('typeMismatch'))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: t('changeType') }));
    expect(select).toHaveFocus();

    fireEvent.click(
      screen.getByRole('button', { name: t('deleteMismatched') }),
    );
    expect(onDelete).toHaveBeenCalledWith(room.clientId);
  });

  it('marks fields from the errors prop invalid and describes them', async () => {
    const t = translator('en');
    await renderEditor({ errors: { heightM: 'Enter a value' } });

    const height = screen.getByRole('spinbutton', { name: t('height') });
    expect(height).toHaveAttribute('aria-invalid', 'true');
    expect(height).toHaveAccessibleDescription(/Enter a value/);
  });

  it('exposes stable DOM ids for focusing', async () => {
    const { room } = await renderEditor();

    expect(
      document.getElementById(roomFieldDomId(room.clientId, 'heightM')),
    ).toBe(
      screen.getByRole('spinbutton', { name: translator('en')('height') }),
    );
  });

  it.each(forEachLocale)(
    'has no accessibility violations in %s',
    async (locale) => {
      const { container } = await renderEditor(
        {
          room: makeDraftRoom({ roomTypeCode: 'LIVING_ROOM' }),
          kitchenType: 'KITCHEN_LIVING',
          errors: { heightM: 'x' },
        },
        locale,
      );

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
