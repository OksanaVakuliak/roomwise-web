'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui';
import type { AdminMaterialType } from '@/lib/admin-api/catalog';

type EditButtonProps = {
  item: AdminMaterialType;
  label: string;
  onEdit: (item: AdminMaterialType) => void;
};

export function EditButton({ item, label, onEdit }: EditButtonProps) {
  const handleClick = useCallback(() => onEdit(item), [onEdit, item]);

  return (
    <Button kind="outline" onClick={handleClick}>
      {label}
    </Button>
  );
}
