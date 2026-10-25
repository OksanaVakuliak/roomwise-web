import { type StepPageProps, stepMetadata } from '../step-metadata';
import { StepPage } from '../step-page';

export const generateMetadata = stepMetadata('object');

export default function ObjectPage(props: StepPageProps) {
  return <StepPage step="object" {...props} />;
}
