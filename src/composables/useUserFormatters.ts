/**
 * Return type for useUserFormatters composable
 */
import { getUrl } from 'aws-amplify/storage';
import type { User } from '../models/User';

interface UseUserFormattersReturn {
  getLastActiveClass: (lastActive: string) => string;
  formatLastActive: (lastActive: string) => string;
  getUserInitialsFromUser: (user: User) => string;
  resolvePictureUrl: (picture?: string | null) => Promise<string | null>;
}

/**
 * Composable for user-related formatting utilities
 */
export function useUserFormatters(): UseUserFormattersReturn {
  // Constants for time calculations to avoid magic numbers
  const TIME_CONSTANTS = {
    MILLISECONDS_PER_SECOND: 1000,
    SECONDS_PER_HOUR: 3600,
    HOURS_PER_DAY: 24,
    DAYS_PER_WEEK: 7,
    ONE_HOUR: 1,
  } as const;

  /**
   * Get CSS class for last active timestamp based on recency
   */
  function getLastActiveClass(lastActive: string): string {
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const hoursDiff =
      (now.getTime() - lastActiveDate.getTime()) /
      (TIME_CONSTANTS.MILLISECONDS_PER_SECOND * TIME_CONSTANTS.SECONDS_PER_HOUR);

    if (hoursDiff < TIME_CONSTANTS.ONE_HOUR) return 'text-green';
    if (hoursDiff < TIME_CONSTANTS.HOURS_PER_DAY) return 'text-orange';
    return 'text-grey';
  }

  /**
   * Format last active timestamp to human-readable format
   */
  function formatLastActive(lastActive: string): string {
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diff = now.getTime() - lastActiveDate.getTime();
    const hours = Math.floor(
      diff / (TIME_CONSTANTS.MILLISECONDS_PER_SECOND * TIME_CONSTANTS.SECONDS_PER_HOUR),
    );
    const days = Math.floor(hours / TIME_CONSTANTS.HOURS_PER_DAY);

    if (hours < TIME_CONSTANTS.ONE_HOUR) return 'Just now';
    if (hours < TIME_CONSTANTS.HOURS_PER_DAY) return `${hours}h ago`;
    if (days < TIME_CONSTANTS.DAYS_PER_WEEK) return `${days}d ago`;
    return lastActiveDate.toLocaleDateString();
  }

  const resolvePictureUrl = async (picture?: string | null): Promise<string | null> => {
    if (!picture) {
      return null;
    }

    if (/^https?:\/\//i.test(picture)) {
      return picture;
    }

    try {
      const { url } = await getUrl({ path: picture });
      return url.toString();
    } catch (error) {
      console.error('Failed to resolve picture URL', error);
      return null;
    }
  };

  /**
   * Get user initials from User model instance
   * Delegates to User.getInitials()
   */
  function getUserInitialsFromUser(user: User): string {
    return user.getInitials();
  }

  return {
    getLastActiveClass,
    formatLastActive,
    getUserInitialsFromUser,
    resolvePictureUrl,
  };
}
