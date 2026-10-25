import { type StepPageProps, stepMetadata } from '../step-metadata';
import { StepPage } from '../step-page';

export const generateMetadata = stepMetadata('engineering');

export default function EngineeringPage(props: StepPageProps) {
  return <StepPage step="engineering" {...props} />;
}
