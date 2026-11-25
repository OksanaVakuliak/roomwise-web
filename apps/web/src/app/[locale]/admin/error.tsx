'use client';

import { AdminErrorView } from '@/features/admin/errors';

export default function AdminError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main>
      <AdminErrorView {...props} />
    </main>
  );
}
