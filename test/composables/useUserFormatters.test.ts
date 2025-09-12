import { describe, expect, it } from 'vitest';
import { useUserFormatters } from '../../src/composables/useUserFormatters';

describe('useUserFormatters - User Experience Helpers', () => {
  const { getUserInitials, formatLastActive, getLastActiveClass } = useUserFormatters();

  describe('When administrators need to identify users quickly', () => {
    it('should create recognizable initials from full names for user identification', () => {
      // Admin sees clear user identification
      expect(getUserInitials('John Doe')).toBe('JD');
    });

    it('should handle single names professionally for better user recognition', () => {
      // Admin can identify users with single names
      expect(getUserInitials('Madonna')).toBe('M');
    });

    it('should create meaningful initials from complex names', () => {
      // Admin gets helpful identification even for complex names
      expect(getUserInitials('Mary Jane Watson')).toBe('MJW');
    });

    it('should gracefully handle missing name data without breaking interface', () => {
      // System continues to work when name data is missing
      expect(getUserInitials('')).toBe('');
    });

    it('should clean up messy name data for consistent user experience', () => {
      // Admin gets clean initials despite data quality issues
      expect(getUserInitials('  John   Doe  ')).toBe('JD');
    });
  });

  describe('When users need to understand account activity timing', () => {
    it('should show "Just now" for very recent user activity', () => {
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

      // User understands recent activity immediately
      const result = formatLastActive(twoMinutesAgo.toISOString());
      expect(result).toBe('Just now');
    });

    it('should display hours for same-day activity tracking', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // User can track today's activity patterns
      const result = formatLastActive(twoHoursAgo.toISOString());
      expect(result).toBe('2h ago');
    });

    it('should show days for recent but not current activity', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      // User can assess recent engagement levels
      const result = formatLastActive(threeDaysAgo.toISOString());
      expect(result).toBe('3d ago');
    });

    it('should fall back to exact dates for historical activity analysis', () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      // User gets precise information for older activity
      const result = formatLastActive(oldDate.toISOString());
      expect(result).toBe(oldDate.toLocaleDateString());
    });
  });

  describe('When users need visual cues about account activity levels', () => {
    it('should provide green visual indication for active users', () => {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      // User sees positive visual feedback for active accounts
      const activityClass = getLastActiveClass(thirtyMinutesAgo.toISOString());
      expect(activityClass).toMatch(/green|success|active/i);
    });

    it('should provide orange visual warning for moderate inactivity', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // User gets moderate warning for declining activity
      const activityClass = getLastActiveClass(twoHoursAgo.toISOString());
      expect(activityClass).toMatch(/orange|warning|moderate/i);
    });

    it('should provide grey visual indication for inactive accounts', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      // User clearly sees inactive account status
      const activityClass = getLastActiveClass(twoDaysAgo.toISOString());
      expect(activityClass).toMatch(/grey|gray|inactive|muted/i);
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide consistent initials for screen reader compatibility', () => {
      // Screen readers get predictable content
      const initials = getUserInitials('Alice Johnson');
      expect(initials).toMatch(/^[A-Z]*$/);
      expect(initials.length).toBeGreaterThan(0);
    });

    it('should create human-readable activity descriptions', () => {
      const recentActivity = formatLastActive(new Date().toISOString());

      // Content is meaningful to users and assistive technology
      expect(recentActivity).toMatch(/(Just now|ago|\d{1,2}\/\d{1,2}\/\d{4})/);
    });

    it('should provide semantic CSS classes for visual indicators', () => {
      const visualClass = getLastActiveClass(new Date().toISOString());

      // CSS classes convey semantic meaning
      expect(visualClass).toMatch(/text-(green|orange|grey)/);
    });
  });
});
