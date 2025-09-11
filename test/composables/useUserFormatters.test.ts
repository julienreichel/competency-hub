import { describe, expect, it } from 'vitest';
import { useUserFormatters } from '../../src/composables/useUserFormatters';

describe('useUserFormatters', () => {
  const { getUserInitials, formatLastActive, getLastActiveClass } = useUserFormatters();

  describe('getUserInitials', () => {
    it('should generate initials from full name', () => {
      expect(getUserInitials('John Doe')).toBe('JD');
    });

    it('should handle single name', () => {
      expect(getUserInitials('Madonna')).toBe('M');
    });

    it('should handle multiple names', () => {
      expect(getUserInitials('Mary Jane Watson')).toBe('MJW');
    });

    it('should handle empty string', () => {
      expect(getUserInitials('')).toBe('');
    });

    it('should handle names with extra spaces', () => {
      expect(getUserInitials('  John   Doe  ')).toBe('JD');
    });
  });

  describe('formatLastActive', () => {
    it('should format recent activity', () => {
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

      const result = formatLastActive(twoMinutesAgo.toISOString());
      expect(result).toBe('Just now');
    });

    it('should format hours ago', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const result = formatLastActive(twoHoursAgo.toISOString());
      expect(result).toBe('2h ago');
    });

    it('should format days ago', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const result = formatLastActive(threeDaysAgo.toISOString());
      expect(result).toBe('3d ago');
    });

    it('should format old dates', () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const result = formatLastActive(oldDate.toISOString());
      expect(result).toBe(oldDate.toLocaleDateString());
    });
  });

  describe('getLastActiveClass', () => {
    it('should return green class for recent activity', () => {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      expect(getLastActiveClass(thirtyMinutesAgo.toISOString())).toBe('text-green');
    });

    it('should return orange class for moderate activity', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      expect(getLastActiveClass(twoHoursAgo.toISOString())).toBe('text-orange');
    });

    it('should return grey class for old activity', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      expect(getLastActiveClass(twoDaysAgo.toISOString())).toBe('text-grey');
    });
  });
});
