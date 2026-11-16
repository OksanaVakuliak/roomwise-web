import {
  type CSSProperties,
  type RefObject,
  type TransitionEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  inertElements,
  lockScroll,
  releaseElements,
  unlockScroll,
} from '@/lib/dialog';
import { useIsDesktop, usePrefersReducedMotion } from '@/lib/media';

export type SceneExpandMode = 'idle' | 'enter' | 'open' | 'leave';

type Frame = { left: number; top: number; width: number; height: number };
type Geometry = { origin: Frame; target: Frame };

const EMPTY_FRAME: Frame = { left: 0, top: 0, width: 0, height: 0 };
const BODY_SELECTOR = '[data-layout-body]';
const LEAVE_FALLBACK_MS = 420;

function readFrame(rect: DOMRect): Frame {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function readTarget(slot: HTMLElement, desktop: boolean): Frame {
  if (!desktop) {
    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  const body = slot.closest(BODY_SELECTOR);
  const rect = body?.getBoundingClientRect();
  const top = Math.max(rect?.top ?? 0, 0);
  return {
    left: rect?.left ?? 0,
    top,
    width: rect?.width ?? window.innerWidth,
    height: Math.max(window.innerHeight - top, 0),
  };
}

function sameFrame(a: Frame, b: Frame): boolean {
  return (
    a.left === b.left &&
    a.top === b.top &&
    a.width === b.width &&
    a.height === b.height
  );
}

export function slotVariables({ origin }: Geometry): CSSProperties {
  return { '--slot-height': `${origin.height}px` } as CSSProperties;
}

export function expandVariables({ origin, target }: Geometry): CSSProperties {
  return {
    '--expand-left': `${target.left}px`,
    '--expand-top': `${target.top}px`,
    '--expand-width': `${target.width}px`,
    '--expand-height': `${target.height}px`,
    '--flip-x': `${origin.left - target.left}px`,
    '--flip-y': `${origin.top - target.top}px`,
    '--flip-sx': ratio(origin.width, target.width),
    '--flip-sy': ratio(origin.height, target.height),
  } as CSSProperties;
}

function ratio(value: number, base: number): number {
  return base === 0 ? 1 : value / base;
}

export function useSceneExpand(
  slotRef: RefObject<HTMLElement | null>,
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const desktop = useIsDesktop();
  const reducedMotion = usePrefersReducedMotion();
  const [mode, setMode] = useState<SceneExpandMode>('idle');
  const [geometry, setGeometry] = useState<Geometry>({
    origin: EMPTY_FRAME,
    target: EMPTY_FRAME,
  });
  const modeRef = useRef(mode);

  useLayoutEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const collapse = useCallback(
    (instant: boolean) => {
      const slot = slotRef.current;
      if (slot) {
        const origin = readFrame(slot.getBoundingClientRect());
        const target = readTarget(slot, desktop);
        setGeometry({ origin, target });
        if (sameFrame(origin, target)) {
          setMode('idle');
          return;
        }
      }
      setMode(instant || reducedMotion || !slot ? 'idle' : 'leave');
    },
    [slotRef, reducedMotion, desktop],
  );

  const expand = useCallback(() => {
    const slot = slotRef.current;
    if (!slot) return;
    setGeometry({
      origin: readFrame(slot.getBoundingClientRect()),
      target: readTarget(slot, desktop),
    });
    setMode(reducedMotion ? 'open' : 'enter');
  }, [slotRef, reducedMotion, desktop]);

  const toggle = useCallback(() => {
    if (modeRef.current === 'idle') expand();
    else if (modeRef.current !== 'leave') collapse(false);
  }, [expand, collapse]);

  useLayoutEffect(() => {
    if (mode !== 'enter') return;
    rootRef.current?.getBoundingClientRect();
    setMode('open');
  }, [mode, rootRef]);

  const [layout, setLayout] = useState({ enabled, desktop });
  if (layout.enabled !== enabled || layout.desktop !== desktop) {
    setLayout({ enabled, desktop });
    if (mode !== 'idle') setMode('idle');
  }

  useEffect(() => {
    if (mode !== 'open') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) collapse(false);
    };
    const onResize = () => {
      const slot = slotRef.current;
      if (slot) {
        const target = readTarget(slot, desktop);
        setGeometry((current) =>
          sameFrame(current.target, target) ? current : { ...current, target },
        );
      }
    };
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, {
      passive: true,
      capture: true,
    });
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, { capture: true });
    };
  }, [mode, collapse, slotRef, desktop]);

  useEffect(() => {
    if (mode !== 'leave') return;
    const timer = window.setTimeout(() => setMode('idle'), LEAVE_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [mode]);

  useEffect(() => {
    const root = rootRef.current;
    if (mode !== 'leave' || !root) return;
    const onCancel = (event: Event) => {
      if (event.target === root) setMode('idle');
    };
    root.addEventListener('transitioncancel', onCancel);
    return () => root.removeEventListener('transitioncancel', onCancel);
  }, [mode, rootRef]);

  const expanded = mode === 'enter' || mode === 'open';

  useEffect(() => {
    const slot = slotRef.current;
    if (!expanded || !slot) return;
    const body = desktop ? slot.closest(BODY_SELECTOR) : document.body;
    if (!body) return;
    const siblings: Element[] = [];
    let node: HTMLElement = slot;
    while (node !== body && node.parentElement) {
      const parent: HTMLElement = node.parentElement;
      for (const sibling of parent.children) {
        if (sibling !== node) siblings.push(sibling);
      }
      node = parent;
    }
    const inerted = inertElements(siblings);
    return () => releaseElements(inerted);
  }, [expanded, slotRef, desktop]);

  useEffect(() => {
    if (!expanded || desktop) return;
    lockScroll();
    return unlockScroll;
  }, [expanded, desktop]);

  const onTransitionEnd = useCallback((event: TransitionEvent) => {
    if (event.target === event.currentTarget && modeRef.current === 'leave') {
      setMode('idle');
    }
  }, []);

  return {
    mode,
    expanded,
    available: enabled,
    geometry,
    toggle,
    onTransitionEnd,
  };
}
