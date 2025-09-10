import type { AuthUser } from 'aws-amplify/auth';
import { fetchUserAttributes, getCurrentUser, signOut } from 'aws-amplify/auth';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

/**
 * User attributes interface for better type safety
 */
interface UserAttributes {
  email?: string;
  given_name?: string;
  family_name?: string;
  givenName?: string;
  familyName?: string;
  preferred_username?: string;
  'cognito:groups'?: string[];
  [key: string]: unknown;
}

/**
 * Return type for useAuth composable
 */
interface UseAuthReturn {
  user: Ref<AuthUser | null>;
  userAttributes: Ref<UserAttributes>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  isAuthenticated: ComputedRef<boolean>;
  userFullName: ComputedRef<string>;
  userDisplayName: ComputedRef<string>;
  userRole: ComputedRef<string>;
  initAuth: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  refreshUserAttributes: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

/**
 * Composable for managing authentication state and user information
 */
export function useAuth(): UseAuthReturn {
  const user = ref<AuthUser | null>(null);
  const userAttributes = ref<UserAttributes>({});
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed(() => !!user.value);

  /**
   * Get user's full name from attributes
   */
  const userFullName = computed(() => {
    const given = userAttributes.value.given_name || userAttributes.value.givenName || '';
    const family = userAttributes.value.family_name || userAttributes.value.familyName || '';
    const fullName = `${given} ${family}`.trim();

    if (fullName) {
      return fullName;
    }

    // Fallback to preferred username or email
    return userAttributes.value.preferred_username || userAttributes.value.email || 'User';
  });

  /**
   * Get user's display username
   */
  const userDisplayName = computed(() => {
    return userAttributes.value.preferred_username || userAttributes.value.email || 'User';
  });

  /**
   * Get user's role/group
   */
  const userRole = computed((): string => {
    const groups = userAttributes.value['cognito:groups'] || [];
    if (Array.isArray(groups) && groups.length > 0 && groups[0]) {
      return groups[0];
    }
    return 'Student';
  });

  /**
   * Initialize authentication state
   */
  async function initAuth(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      const currentUser = await getCurrentUser();
      user.value = currentUser;

      const attributes = await fetchUserAttributes();
      userAttributes.value = attributes as UserAttributes;
    } catch {
      // User is not authenticated, which is fine
      user.value = null;
      userAttributes.value = {};
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Sign out the current user
   */
  async function handleSignOut(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      await signOut();

      user.value = null;
      userAttributes.value = {};
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign out failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Refresh user attributes
   */
  async function refreshUserAttributes(): Promise<void> {
    if (!user.value) return;

    try {
      const attributes = await fetchUserAttributes();
      userAttributes.value = attributes as UserAttributes;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to refresh user attributes';
    }
  }

  /**
   * Check if user has specific role
   */
  function hasRole(role: string): boolean {
    const groups = userAttributes.value['cognito:groups'] || [];
    return groups.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  function hasAnyRole(roles: string[]): boolean {
    const groups = userAttributes.value['cognito:groups'] || [];
    return roles.some((role) => groups.includes(role));
  }

  return {
    // State
    user,
    userAttributes,
    isLoading,
    error,

    // Computed
    isAuthenticated,
    userFullName,
    userDisplayName,
    userRole,

    // Methods
    initAuth,
    handleSignOut,
    refreshUserAttributes,
    hasRole,
    hasAnyRole,
  };
}
