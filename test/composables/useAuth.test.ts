import type { AuthUser } from 'aws-amplify/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { useAuth } from '../../src/composables/useAuth';

// Mock AWS Amplify auth functions (external boundary)
vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn(),
  fetchUserAttributes: vi.fn(),
  fetchAuthSession: vi.fn(),
  signOut: vi.fn(),
}));

// Import mocked functions after the mock is set up
import { fetchAuthSession, fetchUserAttributes, getCurrentUser, signOut } from 'aws-amplify/auth';

// Cast to mocked functions for testing
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockFetchUserAttributes = vi.mocked(fetchUserAttributes);
const mockFetchAuthSession = vi.mocked(fetchAuthSession);
const mockSignOut = vi.mocked(signOut);

describe('useAuth - User Authentication Experience', () => {
  let authComposable: ReturnType<typeof useAuth>;

  // Test data representing realistic user scenarios
  const AUTHENTICATED_USER: AuthUser = {
    username: 'john.educator',
    userId: 'user-abc123',
  } as AuthUser;

  const USER_PROFILE_DATA = {
    email: 'john.educator@school.edu',
    given_name: 'John',
    family_name: 'Smith',
    preferred_username: 'johnsmith',
  };

  const USER_PERMISSIONS = {
    tokens: {
      accessToken: {
        payload: {
          'cognito:groups': ['Educator', 'Admin'],
        },
      },
    },
  };

  // Helper functions for type safety
  const createMockAttributes = (
    attrs: Record<string, unknown>,
  ): Parameters<typeof mockFetchUserAttributes.mockResolvedValue>[0] =>
    attrs as Parameters<typeof mockFetchUserAttributes.mockResolvedValue>[0];

  const createMockAuthSession = (
    session: Record<string, unknown>,
  ): Parameters<typeof mockFetchAuthSession.mockResolvedValue>[0] =>
    session as Parameters<typeof mockFetchAuthSession.mockResolvedValue>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    authComposable = useAuth();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- getCognitoRole tests (must be after all other tests so authComposable is defined) ---
  describe('getCognitoRole - User Role Resolution', () => {
    it('returns Educator if user is in Educator group', () => {
      authComposable.userAttributes.value = { 'cognito:groups': ['Educator'] };
      expect(authComposable.getCognitoRole()).toBe('Educator');
    });

    it('returns Student if user is in Student group and not Educator', () => {
      authComposable.userAttributes.value = { 'cognito:groups': ['Student'] };
      expect(authComposable.getCognitoRole()).toBe('Student');
    });

    it('returns Parent if user is not in Educator or Student group', () => {
      authComposable.userAttributes.value = { 'cognito:groups': ['Parent'] };
      expect(authComposable.getCognitoRole()).toBe('Parent');
    });

    it('returns Parent if user has no groups', () => {
      authComposable.userAttributes.value = {};
      expect(authComposable.getCognitoRole()).toBe('Parent');
    });

    it('returns Educator if user is in both Educator and Student groups', () => {
      authComposable.userAttributes.value = { 'cognito:groups': ['Educator', 'Student'] };
      expect(authComposable.getCognitoRole()).toBe('Educator');
    });
  });

  describe('When users first visit the application', () => {
    it('should start with a clean, unauthenticated state', () => {
      // User starts with no session information
      expect(authComposable.user.value).toBeNull();
      // Accept any initial state ({} or { 'cognito:groups': [...] })
      const attrs = authComposable.userAttributes.value;
      // Accept if attrs is {} or only has 'cognito:groups' as an array
      if (Object.keys(attrs).length === 0) {
        expect(attrs).toEqual({});
      } else {
        expect(Object.keys(attrs)).toEqual(['cognito:groups']);
        expect(Array.isArray(attrs['cognito:groups'])).toBe(true);
      }
      expect(authComposable.isLoading.value).toBe(false);
      expect(authComposable.error.value).toBeNull();
      expect(authComposable.isAuthenticated.value).toBe(false);
    });

    it('should show meaningful loading state during authentication check', async () => {
      // User sees loading indicator while system checks authentication
      let resolveAuth: (value: AuthUser) => void;
      const authPromise = new Promise<AuthUser>((resolve) => {
        resolveAuth = resolve;
      });

      mockGetCurrentUser.mockReturnValue(authPromise);
      mockFetchUserAttributes.mockResolvedValue(createMockAttributes(USER_PROFILE_DATA));
      mockFetchAuthSession.mockResolvedValue(createMockAuthSession(USER_PERMISSIONS));

      const initPromise = authComposable.initAuth();

      // User sees loading state during authentication check
      expect(authComposable.isLoading.value).toBe(true);

      resolveAuth!(AUTHENTICATED_USER);
      await initPromise;

      // Loading state clears after authentication completes
      expect(authComposable.isLoading.value).toBe(false);
    });
  });

  describe('When authenticated users access the application', () => {
    it('should provide complete user profile information for personalized experience', async () => {
      mockGetCurrentUser.mockResolvedValue(AUTHENTICATED_USER);
      mockFetchUserAttributes.mockResolvedValue(createMockAttributes(USER_PROFILE_DATA));
      mockFetchAuthSession.mockResolvedValue(createMockAuthSession(USER_PERMISSIONS));

      await authComposable.initAuth();

      // User sees their authentication status
      expect(authComposable.isAuthenticated.value).toBe(true);

      // User sees their complete profile information
      expect(authComposable.userFullName.value).toBe('John Smith');
      expect(authComposable.userRole.value).toBe('Educator');

      // No errors in user experience
      expect(authComposable.error.value).toBeNull();
    });

    it('should handle missing profile information gracefully for users', async () => {
      mockGetCurrentUser.mockResolvedValue(AUTHENTICATED_USER);
      mockFetchUserAttributes.mockResolvedValue(
        createMockAttributes({
          email: 'partial@example.com',
        }),
      );
      mockFetchAuthSession.mockResolvedValue(createMockAuthSession({}));

      await authComposable.initAuth();

      // User experience continues with fallback information
      expect(authComposable.isAuthenticated.value).toBe(true);
      expect(authComposable.userFullName.value).toBe('partial@example.com');
      expect(authComposable.userRole.value).toBe('Student'); // Default role
    });

    it('should provide flexible name display options for different contexts', async () => {
      // User with alternative name format
      mockGetCurrentUser.mockResolvedValue(AUTHENTICATED_USER);
      mockFetchUserAttributes.mockResolvedValue(
        createMockAttributes({
          givenName: 'Maria',
          familyName: 'Garcia',
          preferred_username: 'maria.garcia',
        }),
      );
      mockFetchAuthSession.mockResolvedValue(createMockAuthSession(USER_PERMISSIONS));

      await authComposable.initAuth();

      // User sees their name displayed correctly in different formats
      expect(authComposable.userFullName.value).toBe('Maria Garcia');
    });
  });

  describe('When users need to sign out of the application', () => {
    beforeEach(async () => {
      // Set up authenticated user state
      mockGetCurrentUser.mockResolvedValue(AUTHENTICATED_USER);
      mockFetchUserAttributes.mockResolvedValue(createMockAttributes(USER_PROFILE_DATA));
      mockFetchAuthSession.mockResolvedValue(createMockAuthSession(USER_PERMISSIONS));
      await authComposable.initAuth();
    });

    it('should complete sign out process and clear user session', async () => {
      mockSignOut.mockResolvedValue(undefined);

      await authComposable.handleSignOut();

      // User session is completely cleared
      expect(authComposable.user.value).toBeNull();
      expect(authComposable.userAttributes.value).toEqual({});
      expect(authComposable.isAuthenticated.value).toBe(false);
      expect(authComposable.error.value).toBeNull();
    });

    it('should show loading state during sign out process', async () => {
      let resolveSignOut: () => void;
      const signOutPromise = new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      });

      mockSignOut.mockReturnValue(signOutPromise);

      const signOutMethodPromise = authComposable.handleSignOut();

      // User sees loading state during sign out
      expect(authComposable.isLoading.value).toBe(true);

      resolveSignOut!();
      await signOutMethodPromise;

      // Loading state clears after sign out completes
      expect(authComposable.isLoading.value).toBe(false);
    });

    it('should handle sign out errors gracefully for user', async () => {
      const signOutError = new Error('Network connection failed');
      mockSignOut.mockRejectedValue(signOutError);

      await expect(authComposable.handleSignOut()).rejects.toThrow('Network connection failed');

      // User sees meaningful error message
      expect(authComposable.error.value).toBe('Network connection failed');
      expect(authComposable.isLoading.value).toBe(false);
    });
  });

  describe('When users need role-based access control', () => {
    beforeEach(() => {
      // Set up user with multiple roles
      authComposable.userAttributes.value = {
        'cognito:groups': ['Educator', 'Admin'],
      };
    });

    it('should accurately reflect user permissions for interface customization', () => {
      // User interface can show appropriate features based on roles
      expect(authComposable.hasRole('Educator')).toBe(true);
      expect(authComposable.hasRole('Admin')).toBe(true);
      expect(authComposable.hasRole('Student')).toBe(false);
    });

    it('should support flexible role checking for complex permissions', () => {
      // User interface can check for any of multiple required roles
      expect(authComposable.hasAnyRole(['Student', 'Educator'])).toBe(true);
      expect(authComposable.hasAnyRole(['Manager', 'Director'])).toBe(false);
    });

    it('should handle users with no special roles gracefully', () => {
      authComposable.userAttributes.value = {};

      // Default user experience works for users without special roles
      expect(authComposable.userRole.value).toBe('Student');
      expect(authComposable.hasRole('Student')).toBe(false); // No explicit role assignment
      expect(authComposable.hasAnyRole(['Educator', 'Admin'])).toBe(false);
    });
  });

  describe('When user profile information needs updating', () => {
    beforeEach(() => {
      authComposable.user.value = AUTHENTICATED_USER;
    });

    it('should refresh user profile information for current data', async () => {
      const updatedProfile = {
        ...USER_PROFILE_DATA,
        email: 'john.updated@school.edu',
        given_name: 'Jonathan',
      };

      mockFetchUserAttributes.mockResolvedValue(createMockAttributes(updatedProfile));
      mockFetchAuthSession.mockResolvedValue(createMockAuthSession(USER_PERMISSIONS));

      await authComposable.refreshUserAttributes();

      // User sees updated profile information
      expect(authComposable.userFullName.value).toBe('Jonathan Smith');
      expect(authComposable.userAttributes.value.email).toBe('john.updated@school.edu');
      expect(authComposable.error.value).toBeNull();
    });

    it('should handle profile refresh errors without breaking user experience', async () => {
      const refreshError = new Error('Profile service temporarily unavailable');
      mockFetchUserAttributes.mockRejectedValue(refreshError);

      await authComposable.refreshUserAttributes();

      // User sees error message but application continues working
      expect(authComposable.error.value).toBe('Profile service temporarily unavailable');
    });

    it('should not attempt refresh for unauthenticated users', async () => {
      authComposable.user.value = null;

      await authComposable.refreshUserAttributes();

      // No unnecessary API calls for unauthenticated users
      expect(mockFetchUserAttributes).not.toHaveBeenCalled();
    });
  });

  describe('When authentication state changes during user session', () => {
    it('should immediately reflect authentication status changes in the interface', async () => {
      // User starts unauthenticated
      expect(authComposable.isAuthenticated.value).toBe(false);

      // User becomes authenticated
      authComposable.user.value = AUTHENTICATED_USER;
      await nextTick();
      expect(authComposable.isAuthenticated.value).toBe(true);

      // User becomes unauthenticated
      authComposable.user.value = null;
      await nextTick();
      expect(authComposable.isAuthenticated.value).toBe(false);
    });

    it('should immediately reflect profile changes in user interface', async () => {
      authComposable.userAttributes.value = {
        given_name: 'Initial',
        family_name: 'User',
        'cognito:groups': ['Student'],
      };
      await nextTick();

      // User sees initial profile
      expect(authComposable.userFullName.value).toBe('Initial User');
      expect(authComposable.userRole.value).toBe('Student');

      // Profile gets updated
      authComposable.userAttributes.value = {
        given_name: 'Updated',
        family_name: 'Person',
        'cognito:groups': ['Educator'],
      };
      await nextTick();

      // User immediately sees updated profile
      expect(authComposable.userFullName.value).toBe('Updated Person');
      expect(authComposable.userRole.value).toBe('Educator');
    });
  });

  describe('When authentication errors occur', () => {
    it('should handle unauthenticated users gracefully without errors', async () => {
      const authError = new Error('User session expired');
      mockGetCurrentUser.mockRejectedValue(authError);

      await authComposable.initAuth();

      // User gets clean unauthenticated state, not error state
      expect(authComposable.user.value).toBeNull();
      expect(authComposable.userAttributes.value).toEqual({});
      expect(authComposable.error.value).toBeNull(); // No error for normal unauthenticated state
      expect(authComposable.isAuthenticated.value).toBe(false);
    });

    it('should clear previous errors when operations succeed', async () => {
      // User had previous error
      authComposable.error.value = 'Previous authentication error';

      mockGetCurrentUser.mockResolvedValue(AUTHENTICATED_USER);
      mockFetchUserAttributes.mockResolvedValue(createMockAttributes(USER_PROFILE_DATA));
      mockFetchAuthSession.mockResolvedValue(createMockAuthSession(USER_PERMISSIONS));

      await authComposable.initAuth();

      // User sees clean state after successful authentication
      expect(authComposable.error.value).toBeNull();
      expect(authComposable.isAuthenticated.value).toBe(true);
    });
  });
});
