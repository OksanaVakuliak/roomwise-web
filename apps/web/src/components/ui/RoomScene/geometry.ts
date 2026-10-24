type Point = readonly [number, number];

export type Label = {
  x: number;
  y: number;
  rotation: number;
};

export type Segment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type SceneGeometry = {
  viewBox: string;
  floor: string;
  rightWall: string;
  leftWall: string;
  outline: string;
  edges: string;
  backLeft: Segment;
  dimensionPaths: string[];
  cutLine: Segment;
  cutTicks: string;
  width: Label;
  length: Label;
  height: Label;
  cutStart: Label;
  cutEnd: Label;
  place: (label: Label) => { left: string; top: string };
};

const SCALE = 26;
const COS = Math.sqrt(3) / 2;
const SIN = 0.5;
const CUT_FRACTION = 0.55;
const CUT_START = -15.5;
const CUT_OVERSHOOT = 23.2;
const LABEL_HALF_WIDTH = 26;
const LABEL_HALF_HEIGHT = 10;
const PADDING = 6;

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function points(list: readonly Point[]): string {
  return list.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
}

function move(point: Point, dx: number, dy: number): Point {
  return [point[0] + dx, point[1] + dy];
}

function line(from: Point, to: Point): string {
  return `M${round(from[0])} ${round(from[1])}L${round(to[0])} ${round(to[1])}`;
}

function barbs(at: Point, relative: string): string {
  return `M${round(at[0])} ${round(at[1])} ${relative}`;
}

function middle(a: Point, b: Point): Point {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function segment(from: Point, to: Point): Segment {
  return {
    x1: round(from[0]),
    y1: round(from[1]),
    x2: round(to[0]),
    y2: round(to[1]),
  };
}

export function computeGeometry(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
): SceneGeometry {
  const length = (lengthCm / 100) * SCALE;
  const width = (widthCm / 100) * SCALE;
  const height = (heightCm / 100) * SCALE;

  const back: Point = [0, 0];
  const right: Point = [COS * length, SIN * length];
  const left: Point = [-COS * width, SIN * width];
  const front: Point = [right[0] + left[0], right[1] + left[1]];
  const backTop = move(back, 0, -height);
  const rightTop = move(right, 0, -height);
  const leftTop = move(left, 0, -height);

  const widthStart = move(right, 15.5, 9.2);
  const widthEnd = move(front, 15.5, 9.2);
  const lengthStart = move(left, -16, 9.2);
  const lengthEnd = move(front, -16, 9.2);
  const heightX = right[0] + 17.5;
  const heightStart: Point = [heightX, rightTop[1]];
  const heightEnd: Point = [heightX, right[1]];

  const extend = (from: Point, near: Point, far: Point) =>
    line(move(from, near[0], near[1]), move(from, far[0], far[1]));
  const widthNear: Point = [1.5, 3.4];
  const widthFar: Point = [19.5, 13.8];
  const lengthNear: Point = [-2, 3.2];
  const lengthFar: Point = [-20, 13.6];

  const dimensionPaths = [
    line(widthStart, widthEnd),
    extend(right, widthNear, widthFar),
    extend(front, widthNear, widthFar),
    line(lengthStart, lengthEnd),
    extend(left, lengthNear, lengthFar),
    extend(front, lengthNear, lengthFar),
    line(heightStart, heightEnd),
    line(move(rightTop, 3.5, 0), move(rightTop, 23.5, 0)),
    line(move(right, 3.5, 0), move(right, 23.5, 0)),
    barbs(widthStart, 'l-9 1 m9 -1 l-4 8'),
    barbs(widthEnd, 'l9 -1 m-9 1 l4 -8'),
    barbs(lengthStart, 'l8 3 m-8 -3 l5 7'),
    barbs(lengthEnd, 'l-8 -3 m8 3 l-5 -7'),
    barbs(heightStart, 'l-3.5 8 m3.5 -8 l3.5 8'),
    barbs(heightEnd, 'l-3.5 -8 m3.5 8 l3.5 -8'),
  ];

  const cutOffset = CUT_FRACTION * width;
  const onCut = (u: number): Point => [
    COS * (u - cutOffset),
    SIN * (u + cutOffset),
  ];
  const cutStart = onCut(CUT_START);
  const cutEnd = onCut(length + CUT_OVERSHOOT);

  const widthMiddle = middle(widthStart, widthEnd);
  const lengthMiddle = middle(lengthStart, lengthEnd);
  const heightMiddle = middle(heightStart, heightEnd);

  const labels = {
    width: {
      x: widthMiddle[0] + 21.2,
      y: widthMiddle[1] + 11.7,
      rotation: -30,
    },
    length: {
      x: lengthMiddle[0] - 21.2,
      y: lengthMiddle[1] + 15.6,
      rotation: 30,
    },
    height: {
      x: heightMiddle[0] + 21.6,
      y: heightMiddle[1] + 2.8,
      rotation: 0,
    },
    cutStart: { x: cutStart[0] - 13, y: cutStart[1] - 5, rotation: 0 },
    cutEnd: { x: cutEnd[0] - 19, y: cutEnd[1] + 21, rotation: 0 },
  };

  const extent: Point[] = [
    back,
    right,
    left,
    front,
    backTop,
    rightTop,
    leftTop,
    widthStart,
    widthEnd,
    lengthStart,
    lengthEnd,
    heightStart,
    heightEnd,
    cutStart,
    cutEnd,
    move(widthEnd, 4, 14),
    move(lengthEnd, -20, 14),
  ];
  for (const label of Object.values(labels)) {
    extent.push(
      [label.x - LABEL_HALF_WIDTH, label.y - LABEL_HALF_HEIGHT],
      [label.x + LABEL_HALF_WIDTH, label.y + LABEL_HALF_HEIGHT],
    );
  }
  const minX = Math.min(...extent.map(([x]) => x)) - PADDING;
  const maxX = Math.max(...extent.map(([x]) => x)) + PADDING;
  const minY = Math.min(...extent.map(([, y]) => y)) - PADDING;
  const maxY = Math.max(...extent.map(([, y]) => y)) + PADDING;
  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;

  return {
    viewBox: [minX, minY, boxWidth, boxHeight].map(round).join(' '),
    floor: points([back, right, front, left]),
    rightWall: points([backTop, rightTop, right, back]),
    leftWall: points([backTop, leftTop, left, back]),
    outline: points([leftTop, backTop, rightTop, right, front, left, leftTop]),
    edges: points([backTop, back, right]),
    backLeft: segment(back, left),
    dimensionPaths,
    cutLine: segment(cutStart, cutEnd),
    cutTicks: `${barbs(cutStart, 'l-8 12')}${barbs(cutEnd, 'l-8 12')}`,
    ...labels,
    place: (label) => ({
      left: `${round(((label.x - minX) / boxWidth) * 100)}%`,
      top: `${round(((label.y - minY) / boxHeight) * 100)}%`,
    }),
  };
}
