'use client';

import { type ReactNode, useCallback, useId, useState } from 'react';
import { cx } from '@/lib/cx';
import { Collapse } from '../Collapse/Collapse';
import { DisclosureButton } from '../DisclosureButton/DisclosureButton';
import { PickedBadge } from '../PickedBadge/PickedBadge';
import {
  SpecComponents,
  type SpecComponentsItem,
} from '../SpecComponents/SpecComponents';
import styles from './SpecItem.module.css';

export type SpecItemFit = 'ok' | 'no';

export type SpecItemProps = {
  size?: 'mobile' | 'desktop';
  image: ReactNode;
  name: ReactNode;
  brand?: ReactNode;
  dimensions?: ReactNode;
  color?: ReactNode;
  fit?: SpecItemFit;
  fitLabel?: ReactNode;
  components?: readonly SpecComponentsItem[];
  warning?: ReactNode;
  unavailable?: boolean;
  unavailableLabel?: ReactNode;
  selected?: boolean;
  pickedLabel: ReactNode;
  price: ReactNode;
  unit?: ReactNode;
  roomCost?: ReactNode;
  roomCostLabel?: ReactNode;
  actions?: ReactNode;
  showDetailsLabel?: string;
  hideDetailsLabel?: string;
};

export function SpecItem({
  size = 'mobile',
  image,
  name,
  brand,
  dimensions,
  color,
  fit,
  fitLabel,
  components,
  warning,
  unavailable = false,
  unavailableLabel,
  selected = false,
  pickedLabel,
  price,
  unit,
  roomCost,
  roomCostLabel,
  actions,
  showDetailsLabel,
  hideDetailsLabel,
}: SpecItemProps) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((current) => !current), []);
  const detailsId = useId();
  const classes = cx(
    styles.root,
    styles[size],
    unavailable && styles.unavailable,
  );

  const toggleLabel = open ? hideDetailsLabel : showDetailsLabel;
  const collapsible =
    toggleLabel !== undefined &&
    Boolean(brand || dimensions || color || fit || components || roomCost);

  const extra = (
    <>
      {brand || dimensions || color ? (
        <span className={styles.details}>
          {brand ? <span className={styles.brand}>{brand}</span> : null}
          {dimensions || color ? (
            <span>
              {dimensions}
              {dimensions && color ? ', ' : null}
              {color}
            </span>
          ) : null}
        </span>
      ) : null}
      {fit && fitLabel ? (
        <span className={cx(styles.fit, styles[fit])}>{fitLabel}</span>
      ) : null}
      {components ? <SpecComponents items={components} /> : null}
    </>
  );
  const cost = roomCost ? (
    <span className={`${styles.roomCost} num`}>
      {roomCostLabel ? (
        <span className={styles.roomCostLabel}>{roomCostLabel}</span>
      ) : null}
      {roomCost}
    </span>
  ) : null;

  return (
    <div className={classes}>
      {selected ? <span className={styles.bar} aria-hidden="true" /> : null}
      <div className={styles.grid}>
        <div className={styles.media}>
          <span className={styles.image} aria-hidden="true">
            {image}
          </span>
          <span className={styles.picked}>
            {selected ? <PickedBadge>{pickedLabel}</PickedBadge> : null}
          </span>
        </div>
        <div className={styles.body}>
          <span className={styles.name}>{name}</span>
          {collapsible ? null : <>{extra}</>}
          {warning ? <span className={styles.warning}>{warning}</span> : null}
          {unavailable && unavailableLabel ? (
            <span className={styles.unavailableNote}>{unavailableLabel}</span>
          ) : null}
        </div>
        <span className={`${styles.price} num`}>
          {price}
          {unit ? <span className={styles.unit}>{unit}</span> : null}
          {collapsible ? null : <>{cost}</>}
        </span>
        {actions || collapsible ? (
          <div className={cx(styles.actions, collapsible && styles.inline)}>
            {actions}
            {collapsible ? (
              <DisclosureButton
                className={styles.toggle}
                expanded={open}
                controls={detailsId}
                label={toggleLabel}
                onClick={toggle}
              />
            ) : null}
          </div>
        ) : null}
        {collapsible ? (
          <Collapse id={detailsId} open={open} className={styles.collapse}>
            <div className={styles.extra}>
              {extra}
              {cost}
            </div>
          </Collapse>
        ) : null}
      </div>
    </div>
  );
}
