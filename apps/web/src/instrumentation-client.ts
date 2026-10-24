import {
  captureRouterTransition,
  initMonitoring,
} from '@/lib/monitoring/client';

initMonitoring();

export const onRouterTransitionStart = captureRouterTransition;
