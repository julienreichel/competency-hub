import type { AuthUser } from 'aws-amplify/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { useAuth } from '../../src/composables/useAuth';

// Mock AWS Amplify auth functions
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

describe('useAuth Composable', () => {
  let authComposable: ReturnType<typeof useAuth>;

  // Test data constants
  const MOCK_USER: AuthUser = {
    username: 'testuser',
    userId: 'user-123',
  } as AuthUser;

  const MOCK_ATTRIBUTES = {
    email: 'test@example.com',
    given_name: 'John',
    family_name: 'Doe',
    preferred_username: 'johndoe',
  };

  const MOCK_AUTH_SESSION = {
    tokens: {
      accessToken: {
        payload: {
          'cognito:groups': ['Educator', 'Admin'],
        },
      },
    },
  };

  // Use type assertion to bypass AWS Amplify typing issues in tests
  const createMockAttributes = (
    attrs: Record<string, unknown>,
  ): Parameters<typeof mockFetchUserAttributes.mockResolvedValue>[0] =>
    attrs as Parameters<typeof mockFetchUserAttributes.mockResolvedValue>[0];

  const createMockAuthSession = (
    session: Record<string, unknown>,
  ): Parameters<typeof mockFetchAuthSession.mockResolvedValue>[0] =>
    session as Parameters<typeof mockFetchAuthSession.mockResolvedValue>[0];

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create a fresh instance of the composable
    authComposable = useAuth();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      expect(authComposable.user.value).toBeNull();
      expect(authComposable.userAttributes.value).toEqual({});
      expect(authComposable.isLoading.value).toBe(false);
      expect(authComposable.error.value).toBeNull();
      expect(authComposable.isAuthenticated.value).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      // Set up authenticated state
      authComposable.user.value = MOCK_USER;
      authComposable.userAttributes.value = {
        ...MOCK_ATTRIBUTES,
        'cognito:groups': ['Educator', 'Admin'],
      };
    });

    it('should compute isAuthenticated correctly when user exists', () => {
      expect(authComposable.isAuthenticated.value).toBe(true);
    });

    it('should compute isAuthenticated correctly when user is null', () => {
      authComposable.user.value = null;
      expect(authComposable.isAuthenticated.value).toBe(false);
    });

    it('should compute userFullName from given_name and family_name', () => {
      expect(authComposable.userFullName.value).toBe('John Doe');
    });

    it('should compute userFullName from givenName and familyName fallback', () => {
      authComposable.userAttributes.value = {
        givenName: 'Jane',
        familyName: 'Smith',
      };
      expect(authComposable.userFullName.value).toBe('Jane Smith');
    });

    it('should fallback to preferred_username when names are not available', () => {
      authComposable.userAttributes.value = {
        preferred_username: 'testuser',
      };
      expect(authComposable.userFullName.value).toBe('testuser');
    });

    it('should fallback to email when preferred_username is not available', () => {
      authComposable.userAttributes.value = {
        email: 'fallback@example.com',
      };
      expect(authComposable.userFullName.value).toBe('fallback@example.com');
    });

    it('should fallback to "User" when no name information is available', () => {
      authComposable.userAttributes.value = {};
      expect(authComposable.userFullName.value).toBe('User');
    });

    it('should compute userDisplayName from preferred_username', () => {
      expect(authComposable.userDisplayName.value).toBe('johndoe');
    });

    it('should compute userDisplayName fallback to email', () => {
      authComposable.userAttributes.value = {
        email: 'display@example.com',
      };
      expect(authComposable.userDisplayName.value).toBe('display@example.com');
    });

    it('should compute userDisplayName fallback to "User"', () => {
      authComposable.userAttributes.value = {};
      expect(authComposable.userDisplayName.value).toBe('User');
    });

    it('should compute userRole from cognito:groups', () => {
      expect(authComposable.userRole.value).toBe('Educator');
    });

    it('should fallback to "Student" when no groups exist', () => {
      authComposable.userAttributes.value = {};
      expect(authComposable.userRole.value).toBe('Student');
    });

    it('should fallback to "Student" when groups array is empty', () => {
      authComposable.userAttributes.value = {
        'cognito:groups': [],
      };
      expect(authComposable.userRole.value).toBe('Student');
    });
  });

  describe('initAuth Method', () => {
    it('should successfully initialize authenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(MOCK_USER);
      mockFetchUserAttributes.mockResolvedValue(createMockAttributes(MOCK_ATTRIBUTES));
      mockFetchAuthSession.mockResolvedValue(createMockAuthSession(MOCK_AUTH_SESSION));

      await authComposable.initAuth();

      expect(authComposable.user.value).toEqual(MOCK_USER);
      expect(authComposable.userAttributes.value).toEqual({
        ...MOCK_ATTRIBUTES,
        'cognito:groups': ['Educator', 'Admin'],
      });
      expect(authComposable.error.value).toBeNull();
      expect(authComposable.isLoading.value).toBe(false);
    });

    it('should handle unauthenticated user gracefully', async () => {
      const authError = new Error('User not authenticated');
      mockGetCurrentUser.mockRejectedValue(authError);

      await authComposable.initAuth();

      expect(authComposable.user.value).toBeNull();
      expect(authComposable.userAttributes.value).toEqual({});
      expect(authComposable.error.value).toBeNull();
      expect(authComposable.isLoading.value).toBe(false);
    });

    it('should set loading state during initialization', async () => {
      let resolveGetUser: (value: AuthUser) => void;
      const getUserPromise = new Promise<AuthUser>((resolve) => {
        resolveGetUser = resolve;
      });

      mockGetCurrentUser.mockReturnValue(getUserPromise);
      mockFetchUserAttributes.mockResolvedValue(createMockAttributes(MOCK_ATTRIBUTES));
      mockFetchAuthSession.mockResolvedValue(createMockAuthSession(MOCK_AUTH_SESSION));

      const initPromise = authComposable.initAuth();

      // Check loading state is true during async operation
      expect(authComposable.isLoading.value).toBe(true);

      // Resolve the promise
      resolveGetUser!(MOCK_USER);
      await initPromise;

      // Check loading state is false after completion
      expect(authComposable.isLoading.value).toBe(false);
    });
  });

  describe('handleSignOut Method', () => {
    beforeEach(() => {
      // Set up initial authenticated state
      authComposable.user.value = MOCK_USER;
      authComposable.userAttributes.value = MOCK_ATTRIBUTES;
    });

    it('should successfully sign out user', async () => {
      mockSignOut.mockResolvedValue(undefined);

      await authComposable.handleSignOut();

      expect(mockSignOut).toHaveBeenCalledOnce();
      expect(authComposable.user.value).toBeNull();
      expect(authComposable.userAttributes.value).toEqual({});
      expect(authComposable.error.value).toBeNull();
      expect(authComposable.isLoading.value).toBe(false);
    });

    it('should handle sign out errors properly', async () => {
      const signOutError = new Error('Sign out failed');
      mockSignOut.mockRejectedValue(signOutError);

      await expect(authComposable.handleSignOut()).rejects.toThrow('Sign out failed');

      expect(authComposable.error.value).toBe('Sign out failed');
      expect(authComposable.isLoading.value).toBe(false);
    });

    it('should handle non-Error exceptions', async () => {
      const NON_ERROR_MESSAGE = 'String error';
      mockSignOut.mockRejectedValue(NON_ERROR_MESSAGE);

      await expect(authComposable.handleSignOut()).rejects.toBe(NON_ERROR_MESSAGE);

      expect(authComposable.error.value).toBe('Sign out failed');
      expect(authComposable.isLoading.value).toBe(false);
    });

    it('should set loading state during sign out', async () => {
      let resolveSignOut: () => void;
      const signOutPromise = new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      });

      mockSignOut.mockReturnValue(signOutPromise);

      const signOutMethodPromise = authComposable.handleSignOut();

      // Check loading state is true during async operation
      expect(authComposable.isLoading.value).toBe(true);

      // Resolve the promise
      resolveSignOut!();
      await signOutMethodPromise;

      // Check loading state is false after completion
      expect(authComposable.isLoading.value).toBe(false);
    });
  });

  describe('refreshUserAttributes Method', () => {
    it('should refresh attributes for authenticated user', async () => {
      authComposable.user.value = MOCK_USER;
      const updatedAttributes = { ...MOCK_ATTRIBUTES, email: 'updated@example.com' };
      mockFetchUserAttributes.mockResolvedValue(createMockAttributes(updatedAttributes));
      mockFetchAuthSession.mockResolvedValue(createMockAuthSession(MOCK_AUTH_SESSION));

      await authComposable.refreshUserAttributes();

      expect(mockFetchUserAttributes).toHaveBeenCalledOnce();
      expect(authComposable.userAttributes.value).toEqual({
        ...updatedAttributes,
        'cognito:groups': ['Educator', 'Admin'],
      });
      expect(authComposable.error.value).toBeNull();
    });

    it('should not refresh attributes for unauthenticated user', async () => {
      authComposable.user.value = null;

      await authComposable.refreshUserAttributes();

      expect(mockFetchUserAttributes).not.toHaveBeenCalled();
    });

    it('should handle refresh errors properly', async () => {
      authComposable.user.value = MOCK_USER;
      const refreshError = new Error('Failed to fetch attributes');
      mockFetchUserAttributes.mockRejectedValue(refreshError);

      await authComposable.refreshUserAttributes();

      expect(authComposable.error.value).toBe('Failed to fetch attributes');
    });

    it('should handle non-Error exceptions in refresh', async () => {
      authComposable.user.value = MOCK_USER;
      const NON_ERROR_MESSAGE = 'String error';
      mockFetchUserAttributes.mockRejectedValue(NON_ERROR_MESSAGE);

      await authComposable.refreshUserAttributes();

      expect(authComposable.error.value).toBe('Failed to refresh user attributes');
    });
  });

  describe('Role Management Methods', () => {
    beforeEach(() => {
      authComposable.userAttributes.value = {
        'cognito:groups': ['Educator', 'Admin'],
      };
    });

    describe('hasRole Method', () => {
      it('should return true when user has the specified role', () => {
        expect(authComposable.hasRole('Educator')).toBe(true);
        expect(authComposable.hasRole('Admin')).toBe(true);
      });

      it('should return false when user does not have the specified role', () => {
        expect(authComposable.hasRole('Student')).toBe(false);
        expect(authComposable.hasRole('Manager')).toBe(false);
      });

      it('should return false when user has no groups', () => {
        authComposable.userAttributes.value = {};
        expect(authComposable.hasRole('Educator')).toBe(false);
      });

      it('should return false when groups array is empty', () => {
        authComposable.userAttributes.value = {
          'cognito:groups': [],
        };
        expect(authComposable.hasRole('Educator')).toBe(false);
      });
    });

    describe('hasAnyRole Method', () => {
      it('should return true when user has at least one of the specified roles', () => {
        expect(authComposable.hasAnyRole(['Student', 'Educator'])).toBe(true);
        expect(authComposable.hasAnyRole(['Admin', 'Manager'])).toBe(true);
      });

      it('should return false when user has none of the specified roles', () => {
        expect(authComposable.hasAnyRole(['Student', 'Manager'])).toBe(false);
      });

      it('should return false when user has no groups', () => {
        authComposable.userAttributes.value = {};
        expect(authComposable.hasAnyRole(['Educator', 'Admin'])).toBe(false);
      });

      it('should return false when groups array is empty', () => {
        authComposable.userAttributes.value = {
          'cognito:groups': [],
        };
        expect(authComposable.hasAnyRole(['Educator', 'Admin'])).toBe(false);
      });

      it('should handle empty roles array', () => {
        expect(authComposable.hasAnyRole([])).toBe(false);
      });
    });
  });

  describe('Error State Management', () => {
    it('should clear error on successful operations', async () => {
      // Set initial error state
      authComposable.error.value = 'Previous error';

      mockGetCurrentUser.mockResolvedValue(MOCK_USER);
      mockFetchUserAttributes.mockResolvedValue(createMockAttributes(MOCK_ATTRIBUTES));
      mockFetchAuthSession.mockResolvedValue(createMockAuthSession(MOCK_AUTH_SESSION));

      await authComposable.initAuth();

      expect(authComposable.error.value).toBeNull();
    });

    it('should clear error on successful sign out', async () => {
      // Set initial error state
      authComposable.error.value = 'Previous error';
      authComposable.user.value = MOCK_USER;

      mockSignOut.mockResolvedValue(undefined);

      await authComposable.handleSignOut();

      expect(authComposable.error.value).toBeNull();
    });
  });

  describe('Reactive State Updates', () => {
    it('should maintain reactivity when user state changes', async () => {
      expect(authComposable.isAuthenticated.value).toBe(false);

      authComposable.user.value = MOCK_USER;
      await nextTick();

      expect(authComposable.isAuthenticated.value).toBe(true);

      authComposable.user.value = null;
      await nextTick();

      expect(authComposable.isAuthenticated.value).toBe(false);
    });

    it('should maintain reactivity when user attributes change', async () => {
      authComposable.userAttributes.value = {
        ...MOCK_ATTRIBUTES,
        'cognito:groups': ['Educator', 'Admin'],
      };
      await nextTick();

      expect(authComposable.userFullName.value).toBe('John Doe');
      expect(authComposable.userRole.value).toBe('Educator');

      authComposable.userAttributes.value = {
        given_name: 'Jane',
        family_name: 'Smith',
        'cognito:groups': ['Student'],
      };
      await nextTick();

      expect(authComposable.userFullName.value).toBe('Jane Smith');
      expect(authComposable.userRole.value).toBe('Student');
    });
  });
});
