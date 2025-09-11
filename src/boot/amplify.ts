import { Amplify } from 'aws-amplify';

// Fallback CI configuration embedded directly to avoid import issues
const CI_CONFIG = {
  version: '1',
  auth: {
    aws_region: 'us-east-1',
    user_pool_id: 'CI_PLACEHOLDER',
    user_pool_client_id: 'CI_PLACEHOLDER',
  },
} as const;

/**
 * Safely load Amplify configuration with fallbacks
 */
async function loadAmplifyConfig(): Promise<Record<string, unknown>> {
  // In CI/test environments, use embedded config
  if (process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
    console.info('Using embedded CI Amplify configuration');
    return CI_CONFIG;
  }

  // In development/production, try to load real config
  try {
    // Use dynamic import to avoid compile-time resolution issues
    const response = await fetch('/amplify_outputs.json');
    if (response.ok) {
      const config = await response.json();
      console.info('Using real Amplify configuration');
      return config;
    }
  } catch {
    // Fetch failed, try dynamic import as fallback
    try {
      const module = await import('../../amplify_outputs.json');
      const config = module.default || module;
      console.info('Using imported Amplify configuration');
      return config;
    } catch {
      console.warn('No real Amplify config found, using CI fallback');
    }
  }

  // Final fallback to CI config
  return CI_CONFIG;
}

/**
 * Initialize AWS Amplify configuration
 */
async function configureAmplify(): Promise<void> {
  try {
    const config = await loadAmplifyConfig();
    Amplify.configure(config);
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
    // Use CI config as last resort
    Amplify.configure(CI_CONFIG);
  }
}

/**
 * Quasar boot function - runs before the Vue app is created
 */
export default configureAmplify;
