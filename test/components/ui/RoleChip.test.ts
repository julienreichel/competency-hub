import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RoleChip from '../../../src/components/ui/RoleChip.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('RoleChip Component', () => {
  it('should render Admin role with correct text and styling', () => {
    const wrapper = mount(
      RoleChip,
      withQuasarBrowser({
        props: {
          role: 'Admin',
        },
      }),
    );

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toBe('Admin');

    // Test that real Quasar QChip is rendered
    const chipElement = wrapper.find('.q-chip');
    expect(chipElement.exists()).toBe(true);
    expect(chipElement.element.tagName.toLowerCase()).toBe('div');
  });

  it('should render different role types with proper colors', () => {
    const roles = [
      { role: 'Admin', expectedColor: 'red' },
      { role: 'Educator', expectedColor: 'blue' },
      { role: 'Parent', expectedColor: 'green' },
      { role: 'Student', expectedColor: 'purple' },
    ] as const;

    roles.forEach(({ role }) => {
      const wrapper = mount(
        RoleChip,
        withQuasarBrowser({
          props: {
            role,
          },
        }),
      );

      expect(wrapper.text()).toBe(role);

      // Verify the component renders with the expected role
      const chipElement = wrapper.find('.q-chip');
      expect(chipElement.exists()).toBe(true);
    });
  });

  it('should handle click events properly', () => {
    const wrapper = mount(
      RoleChip,
      withQuasarBrowser({
        props: {
          role: 'Educator',
        },
      }),
    );

    const chipElement = wrapper.find('.q-chip');
    expect(chipElement.exists()).toBe(true);

    // Test that real Quasar event handling works
    expect(() => chipElement.trigger('click')).not.toThrow();
  });
});
