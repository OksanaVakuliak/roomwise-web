'use client';

import { useLocale, useTranslations } from 'next-intl';
import { NoticeStack } from '@/components/layout';
import { Banner, Toast } from '@/components/ui';
import { useProduct, useRoomTypes } from '@/lib/api/catalog';
import type { Replacement } from '@/lib/draft/reconcile';
import { roomDisplayName } from '@/lib/draft/rooms';
import type { DraftRoom } from '@/lib/draft/schema';
import { runEstimate } from '@/lib/engine/run-estimate';
import { moneyMinor } from '@/lib/format';
import { useDraft, useDraftValue } from '@/stores/draft';
import { usePricingData } from '@/stores/pricing-data';
import { useDisplayCurrency } from '@/stores/use-display-currency';
import styles from './DraftNotices.module.css';

function ReplacementItem({ replacement }: { replacement: Replacement }) {
  const t = useTranslations('DraftNotices');
  const rooms = useDraft((state) => state.rooms);
  const { data: roomTypes } = useRoomTypes();
  const { data: product } = useProduct(replacement.toProductId);
  const room = rooms.find((item) => item.clientId === replacement.roomClientId);
  if (!room) {
    return null;
  }
  const roomType = roomTypes?.items.find(
    (type) => type.code === room.roomTypeCode,
  );
  const roomName = roomDisplayName(rooms, room, roomType?.name ?? '');
  const category =
    roomType?.categories.find((item) => item.id === replacement.categoryId)
      ?.name ?? '';
  if (replacement.toProductId === null) {
    return <li>{t('chooseMaterial', { room: roomName, category })}</li>;
  }
  return (
    <li>
      {product?.name
        ? t('replacedWithStyle', {
            room: roomName,
            category,
            product: product.name,
          })
        : t('replacedWithStyleUnnamed', { room: roomName, category })}
    </li>
  );
}

function PricesUpdatedToast({ onDismiss }: { onDismiss: () => void }) {
  const t = useTranslations('DraftNotices');
  const tShell = useTranslations('ConfiguratorShell');
  const locale = useLocale();
  const draft = useDraftValue();
  const revision = useDraft((state) => state.revision);
  const pricing = usePricingData((state) => state.data);
  const version = usePricingData((state) => state.version);
  const { currency } = useDisplayCurrency();

  const total =
    pricing && version
      ? runEstimate({
          draft,
          draftRevision: revision,
          pricing,
          pricingVersion: version,
          currency: 'UAH',
        }).panel.total
      : null;
  const formatted = total
    ? currency === 'UAH' && total.uahKopecks !== null
      ? moneyMinor(total.uahKopecks, 'UAH', locale)
      : moneyMinor(total.usdCents, 'USD', locale)
    : null;

  return (
    <Toast dismissLabel={tShell('dismiss')} onDismiss={onDismiss}>
      {formatted === null
        ? t('pricesUpdated')
        : t('pricesUpdatedWithTotal', { total: formatted })}
    </Toast>
  );
}

function isStillReplaced(
  replacement: Replacement,
  rooms: readonly DraftRoom[],
): boolean {
  const selection = rooms.find(
    (room) => room.clientId === replacement.roomClientId,
  )?.selections[replacement.categoryId];
  return (
    selection !== undefined &&
    !selection.disabled &&
    selection.productId === replacement.toProductId
  );
}

export function DraftNotices() {
  const t = useTranslations('DraftNotices');
  const tShell = useTranslations('ConfiguratorShell');
  const storageAvailable = useDraft((state) => state.storageAvailable);
  const notice = useDraft((state) => state.notice);
  const dismissNotice = useDraft((state) => state.dismissNotice);
  const heatedFloorReset = useDraft((state) => state.heatedFloorReset);
  const dismissHeatedFloorReset = useDraft(
    (state) => state.dismissHeatedFloorReset,
  );
  const rooms = useDraft((state) => state.rooms);
  const storedReplacements = useDraft((state) => state.replacements);
  const dismissReplacements = useDraft((state) => state.dismissReplacements);
  const priceUpdate = usePricingData((state) => state.priceUpdate);
  const acknowledgePriceUpdate = usePricingData(
    (state) => state.acknowledgePriceUpdate,
  );

  const replacements = storedReplacements.filter((replacement) =>
    isStillReplaced(replacement, rooms),
  );
  const hasReplacements = replacements.length > 0;
  const showPriceUpdate = priceUpdate !== null && rooms.length > 0;
  const banners =
    !storageAvailable || notice === 'draftReset' || hasReplacements;
  const toasts = heatedFloorReset || showPriceUpdate;

  return (
    <>
      {banners ? (
        <div className={styles.root}>
          {storageAvailable ? null : (
            <Banner variant="warning">{t('storageUnavailable')}</Banner>
          )}
          {notice === 'draftReset' ? (
            <Banner
              variant="info"
              onDismiss={dismissNotice}
              dismissLabel={tShell('dismiss')}
            >
              {t('draftReset')}
            </Banner>
          ) : null}
          {hasReplacements ? (
            <Banner
              variant="info"
              title={t('replacementsTitle')}
              onDismiss={dismissReplacements}
              dismissLabel={tShell('dismiss')}
            >
              <ul className={styles.replacements}>
                {replacements.map((replacement) => (
                  <ReplacementItem
                    key={`${replacement.roomClientId}:${replacement.categoryId}`}
                    replacement={replacement}
                  />
                ))}
              </ul>
            </Banner>
          ) : null}
        </div>
      ) : null}
      {toasts ? (
        <NoticeStack>
          {heatedFloorReset ? (
            <Toast
              dismissLabel={tShell('dismiss')}
              onDismiss={dismissHeatedFloorReset}
            >
              {t('heatedFloorReset')}
            </Toast>
          ) : null}
          {showPriceUpdate ? (
            <PricesUpdatedToast onDismiss={acknowledgePriceUpdate} />
          ) : null}
        </NoticeStack>
      ) : null}
    </>
  );
}
