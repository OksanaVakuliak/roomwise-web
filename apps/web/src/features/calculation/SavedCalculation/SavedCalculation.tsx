'use client';

import type { VersionView } from '@/lib/api/calculations';
import { CalculationScreen } from '../CalculationScreen/CalculationScreen';
import { EditInConfigurator } from '../EditInConfigurator/EditInConfigurator';
import { ExpiredBadge } from '../ExpiredBadge/ExpiredBadge';
import { NewerVersionLink } from '../NewerVersionLink/NewerVersionLink';
import { PriceChangedBanner } from '../PriceChangedBanner/PriceChangedBanner';
import { VersionList } from '../VersionList/VersionList';

export type SavedCalculationProps = {
  publicId: string;
  versionNumber?: string;
};

const renderNotices = (version: VersionView) => (
  <>
    <NewerVersionLink version={version} />
    <PriceChangedBanner version={version} />
  </>
);
const renderBadge = (version: VersionView) =>
  version.expired ? <ExpiredBadge /> : null;
const renderVersions = (version: VersionView) => (
  <VersionList version={version} />
);
const renderActions = (version: VersionView) => (
  <EditInConfigurator version={version} />
);

export function SavedCalculation({
  publicId,
  versionNumber,
}: SavedCalculationProps) {
  return (
    <CalculationScreen
      publicId={publicId}
      versionNumber={versionNumber}
      notices={renderNotices}
      badge={renderBadge}
      versions={renderVersions}
      actions={renderActions}
    />
  );
}
