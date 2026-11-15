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

function readTarget(slot: HTMLElement): Frame {
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
) {
  const isDesktop = useIsDesktop();
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
        const target = readTarget(slot);
        setGeometry({ origin, target });
        if (sameFrame(origin, target)) {
          setMode('idle');
          return;
        }
      }
      setMode(instant || reducedMotion || !slot ? 'idle' : 'leave');
    },
    [slotRef, reducedMotion],
  );

  const expand = useCallback(() => {
    const slot = slotRef.current;
    if (!slot) return;
    setGeometry({
      origin: readFrame(slot.getBoundingClientRect()),
      target: readTarget(slot),
    });
    setMode(reducedMotion ? 'open' : 'enter');
  }, [slotRef, reducedMotion]);

  const toggle = useCallback(() => {
    if (modeRef.current === 'idle') expand();
    else if (modeRef.current !== 'leave') collapse(false);
  }, [expand, collapse]);

  useLayoutEffect(() => {
    if (mode !== 'enter') return;
    rootRef.current?.getBoundingClientRect();
    setMode('open');
  }, [mode, rootRef]);

  useEffect(() => {
    if (!isDesktop && modeRef.current !== 'idle') setMode('idle');
  }, [isDesktop]);

  useEffect(() => {
    if (mode !== 'open') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) collapse(false);
    };
    const onResize = () => {
      const slot = slotRef.current;
      if (slot) {
        setGeometry((current) => ({ ...current, target: readTarget(slot) }));
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
  }, [mode, collapse, slotRef]);

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
    const body = slot.closest(BODY_SELECTOR);
    if (!body) return;
    const previous = new Map<HTMLElement, boolean>();
    let node: HTMLElement = slot;
    while (node !== body && node.parentElement) {
      const parent: HTMLElement = node.parentElement;
      for (const sibling of Array.from(parent.children)) {
        if (sibling !== node && sibling instanceof HTMLElement) {
          previous.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
      node = parent;
    }
    return () => {
      for (const [element, wasInert] of previous) element.inert = wasInert;
    };
  }, [expanded, slotRef]);

  const onTransitionEnd = useCallback((event: TransitionEvent) => {
    if (event.target === event.currentTarget && modeRef.current === 'leave') {
      setMode('idle');
    }
  }, []);

  return {
    mode,
    expanded,
    available: isDesktop,
    geometry,
    toggle,
    onTransitionEnd,
  };
}
