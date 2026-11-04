import { useEffect } from 'react';
import type { WriteGate } from './write';

export type CountdownTick =
  | { kind: 'limited'; seconds: number }
  | { kind: 'idle' };

const SECOND_MS = 1000;

export function useRateLimitCountdown(
  gate: WriteGate,
  limited: boolean,
  setState: (next: CountdownTick) => void,
) {
  useEffect(() => {
    if (!limited) {
      return;
    }
    const timer = setInterval(() => {
      const seconds = gate.blockedForSeconds();
      setState(seconds > 0 ? { kind: 'limited', seconds } : { kind: 'idle' });
    }, SECOND_MS);
    return () => clearInterval(timer);
  }, [limited, gate, setState]);
}
