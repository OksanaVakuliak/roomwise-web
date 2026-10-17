import { useId } from 'react';
import styles from './Hatch.module.css';

export type HatchMaterial = 'wood' | 'glue' | 'cable' | 'screed' | 'concrete';

export type HatchProps = {
  material: HatchMaterial;
};

const cableXs = [14, 44, 74, 104, 134, 164, 194];

function Pattern({
  material,
  id,
}: {
  material: Exclude<HatchMaterial, 'cable'>;
  id: string;
}) {
  if (material === 'wood') {
    return (
      <pattern id={id} width="34" height="7" patternUnits="userSpaceOnUse">
        <rect width="34" height="7" fill="var(--paper)" />
        <path d="M0 3.5H34" stroke="var(--wood)" strokeWidth="2.6" />
        <path d="M26 0v7" stroke="var(--line)" strokeWidth=".9" />
      </pattern>
    );
  }
  if (material === 'glue') {
    return (
      <pattern
        id={id}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="6" height="6" fill="var(--paper)" />
        <path d="M0 0V6" stroke="var(--glue)" strokeWidth="1.7" />
      </pattern>
    );
  }
  if (material === 'screed') {
    return (
      <pattern id={id} width="9" height="9" patternUnits="userSpaceOnUse">
        <rect width="9" height="9" fill="var(--paper)" />
        <circle cx="2" cy="2" r="1" fill="var(--concrete)" />
        <circle cx="6.5" cy="5" r="1.3" fill="var(--concrete)" />
        <circle cx="3" cy="7.5" r=".8" fill="var(--concrete)" />
      </pattern>
    );
  }
  if (material === 'concrete') {
    return (
      <pattern
        id={id}
        width="10"
        height="10"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="10" height="10" fill="var(--paper)" />
        <path d="M0 0V10" stroke="var(--concrete)" strokeWidth="1.4" />
      </pattern>
    );
  }
  return null;
}

export function Hatch({ material }: HatchProps) {
  const id = `hatch-${useId()}`;

  return (
    <svg
      className={styles.root}
      data-material={material}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {material === 'cable' ? (
        <>
          <rect width="100%" height="100%" fill="var(--paper)" />
          <g fill="var(--heat)">
            {cableXs.map((x) => (
              <circle key={x} cx={x} cy="50%" r="6" />
            ))}
          </g>
        </>
      ) : (
        <>
          <defs>
            <Pattern material={material} id={id} />
          </defs>
          <rect width="100%" height="100%" fill={`url(#${id})`} />
        </>
      )}
    </svg>
  );
}
