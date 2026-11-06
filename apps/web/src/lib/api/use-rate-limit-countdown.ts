import { useEffect } from 'react';
import type { WriteGate } from './write';

export type CountdownTick =
  | { kind: 'limited'; seconds: number }
  | { kind: 'idle' };

const SECOND_MS = 1000;
const SECONDS_PER_MINUTE = 60;

export const rateLimitValues = (seconds: number) => ({
  seconds,
  minutes:
    seconds < SECONDS_PER_MINUTE ? 0 : Math.ceil(seconds / SECONDS_PER_MINUTE),
});

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
