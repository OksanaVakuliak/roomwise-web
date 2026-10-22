import { createSerwistRoute } from '@serwist/turbopack';
import { buildRevision } from '@/lib/pwa/revision';

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [
      { url: '/~offline', revision: buildRevision() },
    ],
    swSrc: 'src/app/sw.ts',
    useNativeEsbuild: true,
  });
