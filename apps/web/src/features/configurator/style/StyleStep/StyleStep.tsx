'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ErrorState } from '@/components/system';
import {
  Banner,
  Button,
  ConfirmDialog,
  EmptyState,
  Icon,
  ImageWithFallback,
  Skeleton,
  StyleCard,
  VisuallyHidden,
} from '@/components/ui';
import {
  catalogRoots,
  defaultMaterialsQuery,
  useRoomTypes,
  useStyles,
} from '@/lib/api/catalog';
import { ApiRequestError } from '@/lib/api/request-error';
import { hasManualChanges } from '@/lib/draft/style';
import { useDraft } from '@/stores/draft';
import { useStepValidation } from '../../shell/StepValidation/step-validation-context';
import {
  StylePreview,
  type StylePreviewStyle,
} from '../StylePreview/StylePreview';
import styles from './StyleStep.module.css';

const REQUIRED_MESSAGE_DOM_ID = 'style-required';
const APPLYING_STATUS_DOM_ID = 'style-applying';

type Failure = 'unavailable' | 'failed';

type StyleOptionProps = {
  item: StylePreviewStyle & { image: { card: string; zoom: string } | null };
  selected: boolean;
  busy: boolean;
  onChoose: (styleId: string) => void;
  onPreview: (styleId: string) => void;
};

function StyleOption({
  item,
  selected,
  busy,
  onChoose,
  onPreview,
}: StyleOptionProps) {
  const t = useTranslations('StyleStep');
  const handleChoose = useCallback(
    () => onChoose(item.id),
    [item.id, onChoose],
  );
  const handlePreview = useCallback(
    () => onPreview(item.id),
    [item.id, onPreview],
  );

  return (
    <li className={styles.item} aria-busy={busy || undefined}>
      <StyleCard
        image={<ImageWithFallback src={item.image?.card} name={item.name} />}
        name={item.name}
        description={item.description}
        selected={selected}
        pickedLabel={t('picked')}
        onSelect={handleChoose}
      />
      <Button
        kind="outline"
        className={styles.preview}
        aria-label={t('preview', { name: item.name })}
        onClick={handlePreview}
      >
        {t('previewOpen')}
      </Button>
    </li>
  );
}

export function StyleStep() {
  const t = useTranslations('StyleStep');
  const queryClient = useQueryClient();
  const stylesQuery = useStyles();
  const roomTypesQuery = useRoomTypes();
  const styleId = useDraft((state) => state.styleId);
  const selectStyle = useDraft((state) => state.selectStyle);
  const [attempted, setAttempted] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const items = stylesQuery.data?.items;
  const roomTypes = roomTypesQuery.data;
  const chosen = items?.some((item) => item.id === styleId) ?? false;

  useStepValidation(() => {
    if (applyingId !== null) {
      return APPLYING_STATUS_DOM_ID;
    }
    if (chosen) {
      return null;
    }
    flushSync(() => setAttempted(true));
    return REQUIRED_MESSAGE_DOM_ID;
  });

  const apply = useCallback(
    async (id: string) => {
      if (!roomTypes) {
        return;
      }
      const requestId = ++latestRequest.current;
      setFailure(null);
      setApplyingId(id);
      try {
        const defaults = await queryClient.fetchQuery(
          defaultMaterialsQuery(id),
        );
        if (requestId === latestRequest.current) {
          selectStyle(defaults, roomTypes);
        }
      } catch (error) {
        if (requestId !== latestRequest.current) {
          return;
        }
        if (error instanceof ApiRequestError && error.status === 404) {
          setFailure('unavailable');
          void queryClient.invalidateQueries({
            queryKey: [catalogRoots.styles],
          });
          return;
        }
        setFailure('failed');
      } finally {
        if (requestId === latestRequest.current) {
          setApplyingId(null);
        }
      }
    },
    [queryClient, roomTypes, selectStyle],
  );

  const choose = useCallback(
    (id: string) => {
      const draft = useDraft.getState();
      if (draft.styleId === id) {
        return;
      }
      if (hasManualChanges(draft)) {
        setPendingId(id);
        return;
      }
      void apply(id);
    },
    [apply],
  );

  const chooseFromPreview = useCallback(
    (id: string) => {
      setPreviewId(null);
      choose(id);
    },
    [choose],
  );

  const confirmReplace = useCallback(() => {
    const id = pendingId;
    setPendingId(null);
    if (id !== null) {
      void apply(id);
    }
  }, [apply, pendingId]);

  const cancelReplace = useCallback(() => setPendingId(null), []);
  const closePreview = useCallback(() => setPreviewId(null), []);
  const { refetch: refetchStyles } = stylesQuery;
  const { refetch: refetchRoomTypes } = roomTypesQuery;
  const retryCatalog = useCallback(() => {
    void refetchStyles();
    void refetchRoomTypes();
  }, [refetchRoomTypes, refetchStyles]);
  const dismissFailure = useCallback(() => setFailure(null), []);

  if (stylesQuery.isError || roomTypesQuery.isError) {
    return <ErrorState headingLevel={2} onRetry={retryCatalog} />;
  }

  if (!items || !roomTypes) {
    return (
      <div className={styles.root} role="status" aria-label={t('loading')}>
        <div className={styles.list}>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} variant="block" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        headingLevel={2}
        title={t('emptyTitle')}
        text={t('emptyText')}
      />
    );
  }

  const previewStyle = items.find((item) => item.id === previewId) ?? null;

  return (
    <div className={styles.root}>
      {failure ? (
        <Banner
          variant={failure === 'unavailable' ? 'warning' : 'error'}
          onDismiss={dismissFailure}
          dismissLabel={t('dismiss')}
        >
          {failure === 'unavailable' ? t('unavailable') : t('loadFailed')}
        </Banner>
      ) : null}
      <ul className={styles.list} aria-label={t('listLabel')}>
        {items.map((item) => (
          <StyleOption
            key={item.id}
            item={item}
            selected={item.id === styleId}
            busy={item.id === applyingId}
            onChoose={choose}
            onPreview={setPreviewId}
          />
        ))}
      </ul>
      {applyingId !== null ? (
        <div id={APPLYING_STATUS_DOM_ID} role="status" tabIndex={-1}>
          <VisuallyHidden>{t('applying')}</VisuallyHidden>
        </div>
      ) : null}
      {attempted && !chosen && applyingId === null ? (
        <p id={REQUIRED_MESSAGE_DOM_ID} tabIndex={-1} className={styles.error}>
          <Icon name="warning" size="sm" />
          {t('required')}
        </p>
      ) : null}
      <StylePreview
        item={previewStyle}
        selected={previewStyle?.id === styleId}
        onSelect={chooseFromPreview}
        onClose={closePreview}
      />
      <ConfirmDialog
        open={pendingId !== null}
        title={t('confirm.title')}
        description={t('confirm.description')}
        confirmLabel={t('confirm.confirm')}
        cancelLabel={t('confirm.cancel')}
        closeLabel={t('confirm.close')}
        onConfirm={confirmReplace}
        onCancel={cancelReplace}
      />
    </div>
  );
}
