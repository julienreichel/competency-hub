import { Amplify } from 'aws-amplify';
import amplifyConfig from '../../amplify_outputs.json';

/**
 * Initialize AWS Amplify configuration
 */
function configureAmplify(): void {
  Amplify.configure(amplifyConfig);
}

/**
 * Quasar boot function - runs before the Vue app is created
 */
export default configureAmplify;
