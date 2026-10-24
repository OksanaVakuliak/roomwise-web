import { createSerwistRoute } from '@serwist/turbopack';
import { precacheEntries } from '@/lib/pwa';

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: precacheEntries(
      process.env.NEXT_PUBLIC_APP_VERSION ?? '',
    ),
    swSrc: 'src/app/sw.ts',
    useNativeEsbuild: true,
  });
