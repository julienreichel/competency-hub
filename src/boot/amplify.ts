import { Amplify } from 'aws-amplify';

// Import fallback CI configuration
import ciConfig from '../../amplify_outputs.ci.json';

/**
 * Initialize AWS Amplify configuration
 * In development, this will use the local amplify_outputs.json
 * In CI/CD, this will use the fallback CI configuration
 */
export function configureAmplify(): void {
  // Check if we have a real amplify_outputs.json available
  if (process.env.NODE_ENV === 'development') {
    // In development, try to dynamically import the real config
    import('../../amplify_outputs.json')
      .then((config) => {
        Amplify.configure(config.default || config);
      })
      .catch(() => {
        // Fallback to CI config if real config not available
        console.warn('Using CI Amplify configuration - some features may not work');
        Amplify.configure(ciConfig);
      });
  } else {
    // In CI/test environments, use the CI config
    console.info('Using CI Amplify configuration for build/test environment');
    Amplify.configure(ciConfig);
  }
}
