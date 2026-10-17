import { fireEvent, screen } from '@testing-library/react';
import { useId, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { Tab } from '../Tab/Tab';
import { TabPanel } from '../TabPanel/TabPanel';
import { Tabs, type TabsSize } from './Tabs';

function Harness({ size }: { size?: TabsSize }) {
  const id = useId();
  const [value, setValue] = useState('walls');

  return (
    <>
      <Tabs
        id={id}
        label="Sections"
        value={value}
        onValueChange={setValue}
        size={size}
      >
        <Tab value="walls">Walls</Tab>
        <Tab value="floor">Floor</Tab>
        <Tab value="ceiling">Ceiling</Tab>
      </Tabs>
      <TabPanel tabsId={id} value="walls" selected={value === 'walls'}>
        Walls content
      </TabPanel>
      <TabPanel tabsId={id} value="floor" selected={value === 'floor'}>
        Floor content
      </TabPanel>
      <TabPanel tabsId={id} value="ceiling" selected={value === 'ceiling'}>
        Ceiling content
      </TabPanel>
    </>
  );
}

function tab(name: string) {
  return screen.getByRole('tab', { name });
}

describe('Tabs', () => {
  it('renders a named tablist with the selected tab marked', () => {
    renderWithProviders(<Harness />);
    expect(
      screen.getByRole('tablist', { name: 'Sections' }),
    ).toBeInTheDocument();
    expect(tab('Walls')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Floor')).toHaveAttribute('aria-selected', 'false');
  });

  it('uses a roving tabindex', () => {
    renderWithProviders(<Harness />);
    expect(tab('Walls')).toHaveAttribute('tabindex', '0');
    expect(tab('Floor')).toHaveAttribute('tabindex', '-1');
  });

  it('keeps the first tab focusable when nothing is selected', () => {
    renderWithProviders(
      <Tabs label="Sections" value="" onValueChange={vi.fn()}>
        <Tab value="walls">Walls</Tab>
        <Tab value="floor">Floor</Tab>
      </Tabs>,
    );
    expect(tab('Walls')).toHaveAttribute('tabindex', '0');
    expect(tab('Walls')).toHaveAttribute('aria-selected', 'false');
    expect(tab('Floor')).toHaveAttribute('tabindex', '-1');
  });

  it('links tabs and panels', () => {
    renderWithProviders(<Harness />);
    const panel = document.getElementById(
      tab('Walls').getAttribute('aria-controls') ?? '',
    );
    expect(panel).toHaveAttribute('role', 'tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', tab('Walls').id);
  });

  it('selects on click and shows its panel', () => {
    renderWithProviders(<Harness />);
    fireEvent.click(tab('Floor'));
    expect(tab('Floor')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Floor content')).toBeVisible();
    expect(screen.getByText('Walls content')).not.toBeVisible();
  });

  it('moves with arrows and wraps', () => {
    renderWithProviders(<Harness />);
    tab('Walls').focus();
    fireEvent.keyDown(tab('Walls'), { key: 'ArrowRight' });
    expect(tab('Floor')).toHaveFocus();
    expect(tab('Floor')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(tab('Floor'), { key: 'ArrowRight' });
    fireEvent.keyDown(tab('Ceiling'), { key: 'ArrowRight' });
    expect(tab('Walls')).toHaveFocus();
    fireEvent.keyDown(tab('Walls'), { key: 'ArrowLeft' });
    expect(tab('Ceiling')).toHaveFocus();
    expect(tab('Ceiling')).toHaveAttribute('aria-selected', 'true');
  });

  it('jumps with Home and End', () => {
    renderWithProviders(<Harness />);
    tab('Walls').focus();
    fireEvent.keyDown(tab('Walls'), { key: 'End' });
    expect(tab('Ceiling')).toHaveFocus();
    expect(tab('Ceiling')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(tab('Ceiling'), { key: 'Home' });
    expect(tab('Walls')).toHaveFocus();
    expect(tab('Walls')).toHaveAttribute('aria-selected', 'true');
  });

  it.each(['mobile', 'desktop'] as const)('supports size %s', (size) => {
    renderWithProviders(<Harness size={size} />);
    expect(tab('Walls').getAttribute('class')).toContain(size);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<Harness />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
