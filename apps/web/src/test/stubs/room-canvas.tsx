import { useEffect } from 'react';
import type { RoomCanvasProps } from '@/components/ui';

export function RoomCanvas({
  onStatus,
  label,
  roleDescription,
  describedBy,
}: RoomCanvasProps) {
  useEffect(() => {
    onStatus('ready');
  }, [onStatus]);

  return (
    <div
      role="group"
      aria-roledescription={roleDescription}
      aria-label={label}
      aria-describedby={describedBy}
      tabIndex={0}
    />
  );
}
