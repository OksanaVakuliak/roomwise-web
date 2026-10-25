import { type StepPageProps, stepMetadata } from '../step-metadata';
import { StepPage } from '../step-page';

export const generateMetadata = stepMetadata('interior');

export default function InteriorPage(props: StepPageProps) {
  return <StepPage step="interior" {...props} />;
}
