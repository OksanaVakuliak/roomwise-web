import { act, fireEvent, screen } from '@testing-library/react';
import { createTranslator, type Locale } from 'next-intl';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultDraft } from '@/lib/draft/schema';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { objectFieldDomId } from './field-ids';
import { ObjectForm, type ObjectFormErrors } from './ObjectForm';

const catalogs = { en, uk };
const { limits } = makePricingData();

function form(locale: Locale) {
  return createTranslator({
    locale,
    messages: catalogs[locale],
    namespace: 'ObjectStep.form',
  });
}

async function renderForm(locale: Locale = 'en', errors?: ObjectFormErrors) {
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(<ObjectForm errors={errors} />, { locale });
  });
  return result;
}

describe('ObjectForm', () => {
  beforeEach(() => {
    installMemoryStorage();
    useDraft.setState({
      ...createDefaultDraft(),
      revision: 0,
      storageAvailable: true,
      notice: null,
    });
  });

  it.each(forEachLocale)('renders every control in %s', async (locale) => {
    const t = form(locale);
    await renderForm(locale);

    expect(
      screen.getByRole('radio', { name: t('finishRough') }),
    ).not.toBeChecked();
    expect(screen.getByRole('radio', { name: t('finishPre') })).toBeVisible();
    expect(
      screen.getByRole('spinbutton', { name: t('totalArea') }),
    ).toBeVisible();
    expect(
      screen.getByRole('radio', { name: t('kitchenSeparate') }),
    ).toBeChecked();
    expect(
      screen.getByRole('radio', { name: t('kitchenLiving') }),
    ).not.toBeChecked();
    expect(screen.getByRole('switch', { name: t('gas') })).not.toBeChecked();
    expect(
      screen.getByRole('switch', { name: t('balcony') }),
    ).not.toBeChecked();
    expect(
      screen.queryByRole('spinbutton', { name: t('balconyArea') }),
    ).not.toBeInTheDocument();
  });

  it('writes the finish level, kitchen type and gas to the draft', async () => {
    const t = form('en');
    await renderForm();

    fireEvent.click(screen.getByRole('radio', { name: t('finishPre') }));
    fireEvent.click(screen.getByRole('radio', { name: t('kitchenLiving') }));
    fireEvent.click(screen.getByRole('switch', { name: t('gas') }));

    expect(useDraft.getState().object).toMatchObject({
      finishLevel: 'PRE_FINISH',
      kitchenType: 'KITCHEN_LIVING',
      gas: true,
    });
  });

  it('writes the total area as a number and an empty field as null', async () => {
    const t = form('en');
    await renderForm();
    const input = screen.getByRole('spinbutton', { name: t('totalArea') });

    fireEvent.change(input, { target: { value: '64' } });
    expect(useDraft.getState().object.totalAreaSqm).toBe(64);

    fireEvent.change(input, { target: { value: '64.5' } });
    expect(useDraft.getState().object.totalAreaSqm).toBe(64.5);

    fireEvent.change(input, { target: { value: '' } });
    expect(useDraft.getState().object.totalAreaSqm).toBeNull();
  });

  it('takes its limits from the pricing data', async () => {
    const t = form('en');
    await renderForm();
    const input = screen.getByRole('spinbutton', { name: t('totalArea') });

    expect(input).toHaveAttribute('min', String(limits.totalAreaSqm.min));
    expect(input).toHaveAttribute('max', String(limits.totalAreaSqm.max));

    fireEvent.click(screen.getByRole('switch', { name: t('balcony') }));
    const balcony = screen.getByRole('spinbutton', { name: t('balconyArea') });
    expect(balcony).toHaveAttribute('min', '0');
    expect(balcony).toHaveAttribute('max', String(limits.totalAreaSqm.max));

    fireEvent.change(input, { target: { value: '40' } });
    expect(balcony).toHaveAttribute('max', '40');
  });

  it('shows the balcony fields and writes them to the draft', async () => {
    const t = form('en');
    await renderForm();

    fireEvent.click(screen.getByRole('switch', { name: t('balcony') }));
    expect(useDraft.getState().object.balcony.present).toBe(true);

    fireEvent.change(
      screen.getByRole('spinbutton', { name: t('balconyArea') }),
      { target: { value: '4.5' } },
    );
    fireEvent.click(screen.getByRole('checkbox', { name: t('balconyTiles') }));

    expect(useDraft.getState().object.balcony).toEqual({
      present: true,
      areaSqm: 4.5,
      tiles: true,
    });

    fireEvent.click(screen.getByRole('switch', { name: t('balcony') }));
    expect(
      screen.queryByRole('spinbutton', { name: t('balconyArea') }),
    ).not.toBeInTheDocument();
  });

  it('never writes NaN when the browser reports an unparsable value', async () => {
    const t = form('en');
    await renderForm();
    const input = screen.getByRole('spinbutton', { name: t('totalArea') });

    fireEvent.change(input, { target: { value: '64' } });
    fireEvent.change(input, { target: { value: '64,5' } });

    expect(useDraft.getState().object.totalAreaSqm).not.toBeNaN();
  });

  it('renders errors with aria-invalid and a description', async () => {
    const t = form('en');
    await renderForm('en', {
      finishLevel: 'Choose the finish level',
      totalArea: 'Out of range',
    });

    const area = screen.getByRole('spinbutton', { name: t('totalArea') });
    expect(area).toHaveAttribute('aria-invalid', 'true');
    expect(area).toHaveAccessibleDescription(/Out of range/);
    expect(screen.getByRole('radio', { name: t('finishPre') })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByText('Choose the finish level')).toBeInTheDocument();
  });

  it('gives each focusable control a stable DOM id', async () => {
    const t = form('en');
    useDraft.getState().setObject({
      balcony: { present: true, areaSqm: null, tiles: false },
    });
    await renderForm();

    expect(
      screen.getByRole('radio', { name: t('finishRough') }),
    ).toHaveAttribute('id', objectFieldDomId('finishLevel'));
    expect(
      screen.getByRole('spinbutton', { name: t('totalArea') }),
    ).toHaveAttribute('id', objectFieldDomId('totalArea'));
    expect(
      screen.getByRole('spinbutton', { name: t('balconyArea') }),
    ).toHaveAttribute('id', objectFieldDomId('balconyArea'));
  });

  it.each(forEachLocale)(
    'has no accessibility violations in %s',
    async (locale) => {
      useDraft.getState().setObject({
        balcony: { present: true, areaSqm: 3, tiles: true },
      });
      const { container } = await renderForm(locale, {
        totalArea: 'Out of range',
        finishLevel: 'Choose',
      });

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
