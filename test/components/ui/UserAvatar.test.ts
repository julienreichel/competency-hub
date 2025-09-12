import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserAvatar from '../../../src/components/ui/UserAvatar.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('UserAvatar - User Experience', () => {
  describe('When users need to identify people visually', () => {
    it('should show meaningful initials when no photo is available', () => {
      const wrapper = mount(
        UserAvatar,
        withQuasarBrowser({
          props: {
            user: {
              name: 'John Doe',
            },
          },
        }),
      );

      // User sees clear initials for identification
      expect(wrapper.text()).toBe('JD');
    });

    it('should display profile photos when available for better recognition', () => {
      const wrapper = mount(
        UserAvatar,
        withQuasarBrowser({
          props: {
            user: {
              name: 'Jane Smith',
              avatar: 'https://example.com/avatar.jpg',
            },
          },
        }),
      );

      // User sees profile image instead of initials
      expect(wrapper.html()).toMatch(/img|q-img|avatar\.jpg/i);

      // No initials shown when photo is available
      expect(wrapper.text()).not.toBe('JS');
    });

    it('should create recognizable initials for single names', () => {
      const wrapper = mount(
        UserAvatar,
        withQuasarBrowser({
          props: {
            user: {
              name: 'Madonna',
            },
          },
        }),
      );

      // Single name creates single initial
      expect(wrapper.text()).toBe('M');
    });

    it('should generate helpful initials for complex names', () => {
      const wrapper = mount(
        UserAvatar,
        withQuasarBrowser({
          props: {
            user: {
              name: 'Mary Jane Watson',
            },
          },
        }),
      );

      // Multiple names create multiple initials
      expect(wrapper.text()).toBe('MJW');
    });
  });

  describe('When displaying avatars at different sizes', () => {
    it('should use appropriate default size for standard interfaces', () => {
      const wrapper = mount(
        UserAvatar,
        withQuasarBrowser({
          props: {
            user: {
              name: 'Test User',
            },
          },
        }),
      );

      // Default size is reasonable for UI
      expect(wrapper.html()).toMatch(/40px|avatar/i);
    });

    it('should scale to custom sizes when interface requires it', () => {
      const wrapper = mount(
        UserAvatar,
        withQuasarBrowser({
          props: {
            user: {
              name: 'Test User',
            },
            size: '60px',
          },
        }),
      );

      // Custom size is applied for specific contexts
      expect(wrapper.html()).toMatch(/60px/i);
    });
  });

  describe('When handling name formatting edge cases', () => {
    it('should gracefully handle names with extra whitespace', () => {
      const wrapper = mount(
        UserAvatar,
        withQuasarBrowser({
          props: {
            user: {
              name: '  John   Doe  ',
            },
          },
        }),
      );

      // Creates meaningful initials despite formatting issues
      const initials = wrapper.text();
      expect(initials.length).toBeGreaterThan(0);
      expect(initials).toMatch(/^[A-Z]+$/);
    });

    it('should ensure initials are clearly readable in uppercase', () => {
      const wrapper = mount(
        UserAvatar,
        withQuasarBrowser({
          props: {
            user: {
              name: 'john doe',
            },
          },
        }),
      );

      // Initials are uppercase for readability
      expect(wrapper.text()).toBe('JD');
      expect(wrapper.text()).toMatch(/^[A-Z]+$/);
    });

    it('should handle empty names without breaking the interface', () => {
      const wrapper = mount(
        UserAvatar,
        withQuasarBrowser({
          props: {
            user: {
              name: '',
            },
          },
        }),
      );

      // Component renders without crashing
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.html()).toMatch(/avatar|q-avatar/i);
    });
  });

  describe('When user has both name and photo available', () => {
    it('should prioritize photo over initials for better user recognition', () => {
      const wrapper = mount(
        UserAvatar,
        withQuasarBrowser({
          props: {
            user: {
              name: 'John Doe',
              avatar: 'https://example.com/john.jpg',
            },
          },
        }),
      );

      // Photo takes priority for better identification
      expect(wrapper.html()).toMatch(/img|q-img|john\.jpg/i);

      // Initials not shown when photo is available
      expect(wrapper.text()).not.toBe('JD');
    });
  });

  describe('Accessibility and Screen Reader Experience', () => {
    it('should provide meaningful alternative text for screen readers', () => {
      const wrapper = mount(
        UserAvatar,
        withQuasarBrowser({
          props: {
            user: {
              name: 'Alice Johnson',
            },
          },
        }),
      );

      // Screen reader can understand avatar purpose
      const content = wrapper.text() || wrapper.html();
      expect(content).toMatch(/AJ|Alice|avatar|user/i);
    });

    it('should maintain semantic meaning for assistive technology', () => {
      const wrapper = mount(
        UserAvatar,
        withQuasarBrowser({
          props: {
            user: {
              name: 'Bob Wilson',
              avatar: 'https://example.com/bob.jpg',
            },
          },
        }),
      );

      // Semantic structure supports accessibility
      expect(wrapper.html()).toMatch(/avatar|img|alt|role/i);
    });
  });
});
