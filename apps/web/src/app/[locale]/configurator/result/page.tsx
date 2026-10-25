import { type StepPageProps, stepMetadata } from '../step-metadata';
import { StepPage } from '../step-page';

export const generateMetadata = stepMetadata('result');

export default function ResultPage(props: StepPageProps) {
  return <StepPage step="result" {...props} />;
}
