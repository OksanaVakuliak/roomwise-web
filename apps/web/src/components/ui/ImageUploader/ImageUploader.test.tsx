import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import {
  ImageUploader,
  type ImageUploaderItem,
  type ImageUploaderProps,
} from './ImageUploader';

const items: ImageUploaderItem[] = [
  {
    localId: 'a',
    previewUrl: 'blob:a',
    progress: 100,
    state: 'done',
    primary: true,
  },
  {
    localId: 'b',
    previewUrl: 'blob:b',
    progress: 40,
    state: 'uploading',
    primary: false,
  },
  {
    localId: 'c',
    previewUrl: 'blob:c',
    progress: 0,
    state: 'error',
    primary: false,
    errorText: 'Upload failed',
  },
];

const itemName = (item: ImageUploaderItem) => `image ${item.localId}`;
const dragLabel = (item: ImageUploaderItem) => `Drag ${itemName(item)}`;
const moveUpLabel = (item: ImageUploaderItem) => `Up ${itemName(item)}`;
const moveDownLabel = (item: ImageUploaderItem) => `Down ${itemName(item)}`;
const removeLabel = (item: ImageUploaderItem) => `Remove ${itemName(item)}`;
const previewAlt = (item: ImageUploaderItem) => `Preview ${itemName(item)}`;
const wrongTypeMessage = (name: string) => `${name}: wrong type`;
const tooLargeMessage = (name: string) => `${name}: too large`;

function setup(overrides: Partial<ImageUploaderProps> = {}) {
  const onAdd = vi.fn();
  const onRemove = vi.fn();
  const onReorder = vi.fn();
  const onPrimary = vi.fn();
  const view = render(
    <ImageUploader
      items={items}
      onAdd={onAdd}
      onRemove={onRemove}
      onReorder={onReorder}
      onPrimary={onPrimary}
      accept="image/jpeg,image/png,image/webp"
      maxBytes={5 * 1024 * 1024}
      label="Images"
      addLabel="Add images"
      emptyLabel="No files"
      listLabel="Uploaded images"
      primaryLabel="Primary"
      progressLabel="Uploading"
      previewAlt={previewAlt}
      removeLabel={removeLabel}
      wrongTypeMessage={wrongTypeMessage}
      tooLargeMessage={tooLargeMessage}
      dragLabel={dragLabel}
      moveUpLabel={moveUpLabel}
      moveDownLabel={moveDownLabel}
      screenReaderInstructions="Press space to pick up"
      announcements={{
        onDragStart: ({ active }) => `Picked ${active.id}`,
        onDragOver: ({ active }) => `Over ${active.id}`,
        onDragEnd: ({ active }) => `Dropped ${active.id}`,
        onDragCancel: ({ active }) => `Cancelled ${active.id}`,
      }}
      {...overrides}
    />,
  );
  return { onAdd, onRemove, onReorder, onPrimary, ...view };
}

const file = (name: string, type: string, size = 10) => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('ImageUploader', () => {
  it('renders previews in order', () => {
    setup();
    const images = screen.getAllByRole('img');
    expect(images.map((img) => img.getAttribute('src'))).toEqual([
      'blob:a',
      'blob:b',
      'blob:c',
    ]);
    expect(screen.getByAltText('Preview image a')).toBeInTheDocument();
  });

  it('passes only valid files to onAdd and reports rejected ones', () => {
    const { onAdd } = setup();
    const input = screen.getByLabelText('Images');
    const ok = file('ok.png', 'image/png');
    const big = file('big.png', 'image/png', 6 * 1024 * 1024);
    const gif = file('anim.gif', 'image/gif');
    fireEvent.change(input, { target: { files: [ok, big, gif] } });
    expect(onAdd).toHaveBeenCalledWith([ok]);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('big.png: too large');
    expect(alert).toHaveTextContent('anim.gif: wrong type');
  });

  it('does not call onAdd when every file is rejected', () => {
    const { onAdd } = setup();
    fireEvent.change(screen.getByLabelText('Images'), {
      target: { files: [file('anim.gif', 'image/gif')] },
    });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('shows progress for uploading items and error text for failed ones', () => {
    setup();
    const bars = screen.getAllByRole('progressbar', { name: 'Uploading' });
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });

  it('marks the primary item and calls onPrimary', () => {
    const second: ImageUploaderItem = {
      ...items[0],
      localId: 'd',
      primary: false,
    };
    const { onPrimary } = setup({ items: [items[0], second] });
    const buttons = screen.getAllByRole('button', { name: /^Primary/ });
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(buttons[1]);
    expect(onPrimary).toHaveBeenCalledWith('d');
  });

  it('disables primary, drag and move controls of rows that are not done', () => {
    const { onPrimary, onReorder } = setup();
    const buttons = screen.getAllByRole('button', { name: /^Primary/ });
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeDisabled();
    expect(buttons[2]).toBeDisabled();
    for (const id of ['b', 'c']) {
      expect(
        screen.getByRole('button', { name: `Drag image ${id}` }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: `Up image ${id}` }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: `Down image ${id}` }),
      ).toBeDisabled();
    }
    fireEvent.click(buttons[1]);
    expect(onPrimary).not.toHaveBeenCalled();
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('calls onRemove with the local id', () => {
    const { onRemove } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Remove image b' }));
    expect(onRemove).toHaveBeenCalledWith('b');
  });

  it('reorders with the Down button', () => {
    const { onReorder } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Down image a' }));
    expect(onReorder).toHaveBeenCalledWith([items[1], items[0], items[2]]);
  });

  it('has no accessibility violations', async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
