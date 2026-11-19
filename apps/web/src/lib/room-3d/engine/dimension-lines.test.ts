import { describe, expect, it, vi } from 'vitest';
import {
  type DimensionSector,
  dimensionLines,
  type RoomSize,
} from '../geometry';
import {
  createDimensionLines,
  disposeDimensionLines,
  setDimensionLinesColor,
  updateDimensionLines,
} from './dimension-lines';

const colors = { background: '#ffffff', neutral: '#cccccc', edge: '#112233' };
const room: RoomSize = { lengthM: 5, widthM: 3, heightM: 2.7 };
const sector: DimensionSector = { sx: 1, sz: 1, height: true };

function positions(state: ReturnType<typeof createDimensionLines>) {
  return state.object.geometry.getAttribute('position');
}

describe('dimension lines', () => {
  it('uses the edge colour', () => {
    const state = createDimensionLines(colors);
    expect(state.object.material.color.getHexString()).toBe('112233');
  });

  it('writes every segment of every line into the position attribute', () => {
    const state = createDimensionLines(colors);
    updateDimensionLines(state, room, sector);
    const lines = dimensionLines(room, sector);
    const segments = lines.flatMap((line) => line.segments);
    expect(state.lines).toEqual(lines);
    expect(positions(state).count).toBe(segments.length * 2);
    const [start, end] = segments[0];
    const attribute = positions(state);
    expect([attribute.getX(0), attribute.getY(0), attribute.getZ(0)]).toEqual(
      [...start].map(Math.fround),
    );
    expect([attribute.getX(1), attribute.getY(1), attribute.getZ(1)]).toEqual(
      [...end].map(Math.fround),
    );
  });

  it('keeps the geometry when room and sector are unchanged', () => {
    const state = createDimensionLines(colors);
    updateDimensionLines(state, room, sector);
    const attribute = positions(state);
    updateDimensionLines(state, { ...room }, { ...sector });
    expect(positions(state)).toBe(attribute);
  });

  it('rebuilds when the sector changes', () => {
    const state = createDimensionLines(colors);
    updateDimensionLines(state, room, sector);
    const attribute = positions(state);
    updateDimensionLines(state, room, { ...sector, sx: -1 });
    expect(positions(state)).not.toBe(attribute);
    updateDimensionLines(state, room, { ...sector, sx: -1, height: false });
    expect(state.lines.map(({ key }) => key)).not.toContain('height');
  });

  it('rebuilds when the room size changes', () => {
    const state = createDimensionLines(colors);
    updateDimensionLines(state, room, sector);
    const attribute = positions(state);
    updateDimensionLines(state, { ...room, lengthM: 6 }, sector);
    expect(positions(state)).not.toBe(attribute);
    expect(state.lines).toEqual(
      dimensionLines({ ...room, lengthM: 6 }, sector),
    );
  });

  it('changes colour', () => {
    const state = createDimensionLines(colors);
    setDimensionLinesColor(state, { ...colors, edge: '#ff0000' });
    expect(state.object.material.color.getHexString()).toBe('ff0000');
  });

  it('disposes geometry and material', () => {
    const state = createDimensionLines(colors);
    updateDimensionLines(state, room, sector);
    const geometry = vi.spyOn(state.object.geometry, 'dispose');
    const material = vi.spyOn(state.object.material, 'dispose');
    disposeDimensionLines(state);
    expect(geometry).toHaveBeenCalled();
    expect(material).toHaveBeenCalled();
  });
});
