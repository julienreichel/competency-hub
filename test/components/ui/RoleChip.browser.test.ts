import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RoleChip from '../../../src/components/ui/RoleChip.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('RoleChip Component (Browser)', () => {
  it('should render Admin role with correct text', () => {
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
  });

  it('should render different role types', () => {
    const roles = ['Admin', 'Educator', 'Parent', 'Student'] as const;

    roles.forEach((role) => {
      const wrapper = mount(
        RoleChip,
        withQuasarBrowser({
          props: {
            role,
          },
        }),
      );

      expect(wrapper.text()).toBe(role);
    });
  });

  it('should have Quasar chip structure', () => {
    const wrapper = mount(
      RoleChip,
      withQuasarBrowser({
        props: {
          role: 'Admin',
        },
      }),
    );

    // Test that the component renders with basic chip structure
    const chipElement = wrapper.find('.q-chip');
    expect(chipElement.exists()).toBe(true);
    expect(chipElement.text()).toBe('Admin');
  });
});
