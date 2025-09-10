import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

/**
 * Initialize AWS Amplify configuration
 */
export function configureAmplify(): void {
  Amplify.configure(outputs);
}
