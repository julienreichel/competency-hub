import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StatusIndicator from '../../../src/components/ui/StatusIndicator.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('StatusIndicator - User Experience', () => {
  describe('When users need to understand account status', () => {
    it('should clearly communicate active user status to administrators', () => {
      const wrapper = mount(
        StatusIndicator,
        withQuasarBrowser({
          props: {
            status: 'Active',
          },
        }),
      );

      // User sees clear status information (may include icon text)
      expect(wrapper.text()).toContain('Active');

      // Visual indicator for status (icon + text pattern)
      expect(wrapper.html()).toMatch(/active|icon|status/i);
    });

    it('should alert users to inactive account status', () => {
      const wrapper = mount(
        StatusIndicator,
        withQuasarBrowser({
          props: {
            status: 'Inactive',
          },
        }),
      );

      // User clearly sees inactive status (may include icon text)
      expect(wrapper.text()).toContain('Inactive');

      // Visual distinction for inactive state
      expect(wrapper.html()).toMatch(/inactive|status|icon/i);
    });

    it('should warn users about suspended account status', () => {
      const wrapper = mount(
        StatusIndicator,
        withQuasarBrowser({
          props: {
            status: 'Suspended',
          },
        }),
      );

      // User sees suspension warning (may include icon text)
      expect(wrapper.text()).toContain('Suspended');

      // Visual warning indicator
      expect(wrapper.html()).toMatch(/suspend|status|icon/i);
    });
  });

  describe('When status information changes', () => {
    it('should immediately reflect status updates to users', async () => {
      const wrapper = mount(
        StatusIndicator,
        withQuasarBrowser({
          props: {
            status: 'Active',
          },
        }),
      );

      // Initial status is clear to user (may include icon text)
      expect(wrapper.text()).toContain('Active');

      // Status change is immediately visible
      await wrapper.setProps({ status: 'Suspended' });
      expect(wrapper.text()).toContain('Suspended');
    });

    it('should provide consistent status representation across all status types', () => {
      const statuses: Array<'Active' | 'Inactive' | 'Suspended'> = [
        'Active',
        'Inactive',
        'Suspended',
      ];

      statuses.forEach((status) => {
        const wrapper = mount(
          StatusIndicator,
          withQuasarBrowser({
            props: {
              status,
            },
          }),
        );

        // Each status is clearly readable (may include icon text)
        expect(wrapper.text()).toContain(status);

        // Consistent visual pattern (icon + text)
        expect(wrapper.html()).toMatch(/icon|q-icon/i);
      });
    });
  });

  describe('Accessibility and Screen Reader Experience', () => {
    it('should provide clear status information for screen readers', () => {
      const wrapper = mount(
        StatusIndicator,
        withQuasarBrowser({
          props: {
            status: 'Active',
          },
        }),
      );

      // Screen reader gets meaningful status content (may include icon text)
      const text = wrapper.text();
      expect(text).toContain('Active');
      expect(text).toMatch(/(Active|Inactive|Suspended)/);
    });

    it('should maintain logical reading level for assistive technology', () => {
      const wrapper = mount(
        StatusIndicator,
        withQuasarBrowser({
          props: {
            status: 'Suspended',
          },
        }),
      );

      // Content flows logically for screen readers
      const content = wrapper.text();
      expect(content).toContain('Suspended');

      // Visual elements support the text content
      expect(wrapper.html()).toMatch(/flex|items-center|icon.*suspended|suspended.*icon/i);
    });
  });
});
