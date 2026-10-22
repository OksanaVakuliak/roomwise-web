import { useCallback, useEffect, useRef, useState } from 'react';

export function useRetry(onRetry: () => void | Promise<unknown>) {
  const [pending, setPending] = useState(false);
  const handler = useRef(onRetry);
  const mounted = useRef(true);

  useEffect(() => {
    handler.current = onRetry;
  }, [onRetry]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const retry = useCallback(() => {
    const result = handler.current();
    if (!(result instanceof Promise)) {
      return;
    }
    setPending(true);
    const settle = () => {
      if (mounted.current) {
        setPending(false);
      }
    };
    result.then(settle, settle);
  }, []);

  return { pending, retry };
}
