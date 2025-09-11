import { Amplify } from 'aws-amplify';

// Fallback CI configuration embedded directly to avoid import issues
const CI_CONFIG = {
  version: '1',
  auth: {
    aws_region: 'us-east-1',
    user_pool_id: 'CI_PLACEHOLDER',
    user_pool_client_id: 'CI_PLACEHOLDER',
  },
};

/**
 * Safely load Amplify configuration with fallbacks
 * @returns {Promise<Record<string, unknown>>} Amplify configuration object
 */
async function loadAmplifyConfig() {
  // In CI/test environments, use embedded config
  if (process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
    console.info('Using embedded CI Amplify configuration');
    return CI_CONFIG;
  }

  // In development/production, try to load real config
  try {
    // Use fetch to avoid compile-time resolution issues
    const response = await fetch('/amplify_outputs.json');
    if (response.ok) {
      const config = await response.json();
      console.info('Using real Amplify configuration from fetch');
      return config;
    }
  } catch {
    console.warn('Fetch failed, using CI fallback configuration');
  }

  // Fallback to CI config
  return CI_CONFIG;
}

/**
 * Initialize AWS Amplify configuration
 * @returns {Promise<void>}
 */
async function configureAmplify() {
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
