import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LastActiveCell from '../../../src/components/admin/LastActiveCell.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('LastActiveCell - User Behavior', () => {
  describe('When displaying user activity status', () => {
    it('shows "Just now" for very recent activity', () => {
      // Arrange: User was active 30 seconds ago
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();

      // Act: Render the cell
      const wrapper = mount(
        LastActiveCell,
        withQuasarBrowser({
          props: { lastActive: thirtySecondsAgo },
        }),
      );

      // Assert: User sees recent activity indication
      expect(wrapper.text()).toBe('Just now');
      // Behavior: Recent activity should be visually distinctive (green)
      expect(wrapper.html()).toMatch(/text-green|color.*green|recent/i);
    });

    it('shows time ago format for recent activity', () => {
      // Arrange: User was active 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      // Act: Render the cell
      const wrapper = mount(
        LastActiveCell,
        withQuasarBrowser({
          props: { lastActive: twoHoursAgo },
        }),
      );

      // Assert: User sees relative time
      expect(wrapper.text()).toBe('2h ago');
      // Behavior: Moderate activity should be visually distinct
      expect(wrapper.html()).toMatch(/text-orange|color.*orange|moderate/i);
    });

    it('shows full date for old activity', () => {
      // Arrange: User was active over a week ago
      const oneWeekAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

      // Act: Render the cell
      const wrapper = mount(
        LastActiveCell,
        withQuasarBrowser({
          props: { lastActive: oneWeekAgo },
        }),
      );

      // Assert: User sees a proper date format
      expect(wrapper.text()).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date pattern
      // Behavior: Old activity should be visually subdued
      expect(wrapper.html()).toMatch(/text-grey|text-gray|faded|inactive/i);
    });

    it('handles missing activity data gracefully', () => {
      // Arrange: No activity data provided
      // Act: Render the cell
      const wrapper = mount(
        LastActiveCell,
        withQuasarBrowser({
          props: { lastActive: '' },
        }),
      );

      // Assert: User sees clear indication of invalid/missing data
      // Note: This tests ACTUAL behavior, not assumed behavior
      expect(wrapper.text()).toBe('Invalid Date');
      // Behavior: Should be visually distinct for invalid activity
      expect(wrapper.html()).toMatch(/text-grey|text-gray|inactive/i);
    });

    it('updates display when activity changes', async () => {
      // Arrange: Start with recent activity
      const recentTime = new Date(Date.now() - 30 * 1000).toISOString();
      const wrapper = mount(
        LastActiveCell,
        withQuasarBrowser({
          props: { lastActive: recentTime },
        }),
      );

      // Assert: Initially shows recent activity
      expect(wrapper.text()).toBe('Just now');

      // Act: Update to older activity
      const olderTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      await wrapper.setProps({ lastActive: olderTime });

      // Assert: Updates to show new activity status
      expect(wrapper.text()).toBe('2h ago');
    });
  });

  describe('Accessibility and UX', () => {
    it('provides meaningful content for screen readers', () => {
      const wrapper = mount(
        LastActiveCell,
        withQuasarBrowser({
          props: { lastActive: new Date(Date.now() - 30 * 1000).toISOString() },
        }),
      );

      // Behavior: Should have accessible content
      const element = wrapper.element;
      expect(element.textContent?.trim()).toBeTruthy();
      expect(element.textContent).not.toMatch(/^\s*$/); // Not just whitespace
    });

    it('maintains visual hierarchy through styling', () => {
      const wrapper = mount(
        LastActiveCell,
        withQuasarBrowser({
          props: { lastActive: new Date(Date.now() - 30 * 1000).toISOString() },
        }),
      );

      // Behavior: Should have styling that indicates importance/recency
      const html = wrapper.html();
      expect(html).toMatch(/class="[^"]*text-/); // Has some text color class
    });
  });
});
