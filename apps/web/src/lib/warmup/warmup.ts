import { create } from 'zustand';
import { api } from '@/lib/api/client';

export const WARMUP_SCREEN_DELAY_MS = 2000;
export const WARMUP_TIMEOUT_MS = 90000;
export const WARMUP_RETRY_BASE_MS = 1000;
export const WARMUP_RETRY_MAX_MS = 10000;

export type ServerState = 'unknown' | 'warming' | 'ready' | 'failed';
export type NetworkState = 'online' | 'offline';
export type WarmupStatus =
  | 'unknown'
  | 'warming'
  | 'ready'
  | 'failed'
  | 'offline';

type WarmupState = {
  server: ServerState;
  network: NetworkState;
  startedAt: number | null;
};

function currentNetwork(): NetworkState {
  return typeof window !== 'undefined' && window.navigator.onLine === false
    ? 'offline'
    : 'online';
}

function initialState(): WarmupState {
  return { server: 'unknown', network: 'online', startedAt: null };
}

export const useWarmup = create<WarmupState>()(initialState);

export function selectWarmupStatus(state: WarmupState): WarmupStatus {
  if (state.server === 'ready') {
    return 'ready';
  }
  if (state.network === 'offline') {
    return 'offline';
  }
  return state.server;
}

let generation = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let deadlineTimer: ReturnType<typeof setTimeout> | undefined;

function clearTimers(): void {
  clearTimeout(retryTimer);
  clearTimeout(deadlineTimer);
  retryTimer = undefined;
  deadlineTimer = undefined;
}

function retryDelay(attempt: number): number {
  return Math.min(WARMUP_RETRY_BASE_MS * 2 ** attempt, WARMUP_RETRY_MAX_MS);
}

async function probe(): Promise<boolean> {
  try {
    const { response } = await api.GET('/api/v1/health');
    return response.ok;
  } catch {
    return false;
  }
}

async function attempt(run: number, attemptNumber: number): Promise<void> {
  const ok = await probe();
  if (run !== generation) {
    return;
  }
  if (ok) {
    clearTimers();
    useWarmup.setState({ server: 'ready' });
    return;
  }
  retryTimer = setTimeout(() => {
    void attempt(run, attemptNumber + 1);
  }, retryDelay(attemptNumber));
}

function beginWindow(): void {
  generation += 1;
  clearTimers();
  const run = generation;
  useWarmup.setState({ server: 'warming', startedAt: Date.now() });
  deadlineTimer = setTimeout(() => {
    if (run !== generation) {
      return;
    }
    clearTimeout(retryTimer);
    generation += 1;
    useWarmup.setState({ server: 'failed' });
  }, WARMUP_TIMEOUT_MS);
  void attempt(run, 0);
}

export function startWarmup(): void {
  const { server, network } = useWarmup.getState();
  if (server !== 'unknown') {
    return;
  }
  if (network === 'offline') {
    useWarmup.setState({ server: 'warming' });
    return;
  }
  beginWindow();
}

export async function retryWarmup(): Promise<void> {
  const { server, network } = useWarmup.getState();
  if (server === 'ready') {
    return;
  }
  if (network === 'offline') {
    const run = generation;
    const ok = await probe();
    if (run === generation && ok) {
      clearTimers();
      useWarmup.setState({ network: 'online', server: 'ready' });
    }
    return;
  }
  if (server === 'failed') {
    beginWindow();
  }
}

function goOffline(): void {
  generation += 1;
  clearTimers();
  useWarmup.setState({ network: 'offline' });
}

function goOnline(): void {
  useWarmup.setState({ network: 'online' });
  const { server } = useWarmup.getState();
  if (server === 'warming' || server === 'failed') {
    beginWindow();
  }
}

export function installNetworkListeners(): () => void {
  window.addEventListener('offline', goOffline);
  window.addEventListener('online', goOnline);
  if (currentNetwork() === 'offline') {
    goOffline();
  } else if (useWarmup.getState().network === 'offline') {
    goOnline();
  }
  return () => {
    window.removeEventListener('offline', goOffline);
    window.removeEventListener('online', goOnline);
  };
}

export function resetWarmup(): void {
  generation += 1;
  clearTimers();
  useWarmup.setState(initialState());
}
